-- ============================================================================
-- 0019_weekend_pricing_and_reschedule.sql
-- WismaKu: Server-side Weekend Surcharge + Izin Reschedule Mandiri Tamu
-- ============================================================================

-- 1. Simpan persentase surcharge yang berlaku pada pesanan (untuk estimasi reschedule tamu)
alter table public.bookings
  add column if not exists weekend_surcharge_percent numeric default 0;

-- 2. Hitung jumlah malam akhir pekan (Jumat/Sabtu) dalam rentang menginap
create or replace function public.count_weekend_nights(p_check_in date, p_nights int)
returns int
language sql
immutable
as $$
  select coalesce(count(*), 0)::int
    from generate_series(0, greatest(coalesce(p_nights, 1), 1) - 1) as offset
   where extract(dow from (p_check_in + offset)) in (5, 6);
$$;

-- 2. Perbarui trigger integritas booking:
--    - INSERT: terapkan weekend surcharge dari katalog room_types / hotels
--    - UPDATE: izinkan tamu reschedule tanggal & hitung ulang total (diskon diskalakan)
create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
as $$
declare
  h_room_types jsonb;
  h_price int;
  h_weekend_pct numeric;
  h_comm numeric(4,2);
  catalog_room_price int;
  catalog_weekend_pct numeric;
  weekend_nights int;
  subtotal numeric(12,2);
  clean_coupon text;
  c_pct int;
  c_max int;
  calc_coupon numeric(12,2);
  after_coupon numeric(12,2);
  is_privileged boolean;
  is_hotel_partner boolean;
  is_booking_owner boolean;
  is_reschedule boolean;
  old_subtotal numeric(12,2);
begin
  is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role';

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.paid_at := null;
    new.payment_method := null;
    new.snap_token := null;
    new.midtrans_order_id := null;
    new.expires_at := now() + interval '1 hour';
    new.platform_fee := 0;
    new.partner_net := 0;
    catalog_weekend_pct := 0;

    if new.hotel_id is null then
      if not is_privileged then
        raise exception 'hotel_id wajib diisi.';
      end if;
      catalog_room_price := greatest(0, coalesce(new.room_price, 0));
    else
      select room_types, price_from, coalesce(weekend_surcharge_percent, 0)
        into h_room_types, h_price, h_weekend_pct
        from public.hotels
       where id = new.hotel_id;

      if not found then
        raise exception 'Penginapan tidak ditemukan.';
      end if;

      select (elem->>'price')::int,
             coalesce((elem->>'weekend_surcharge_percent')::numeric,
                      (elem->>'weekendSurchargePercent')::numeric,
                      h_weekend_pct, 0)
        into catalog_room_price, catalog_weekend_pct
        from jsonb_array_elements(coalesce(h_room_types, '[]'::jsonb)) as elem
       where elem->>'id' = new.room_type_id
       limit 1;

      if catalog_room_price is null then
        if jsonb_array_length(coalesce(h_room_types, '[]'::jsonb)) = 0 and h_price is not null then
          catalog_room_price := h_price;
          catalog_weekend_pct := coalesce(h_weekend_pct, 0);
        else
          raise exception 'Tipe kamar "%" tidak valid untuk penginapan ini.', new.room_type_id;
        end if;
      end if;
    end if;

    new.room_price := catalog_room_price;
    new.weekend_surcharge_percent := coalesce(catalog_weekend_pct, 0);

    weekend_nights := case
      when new.check_in is not null then public.count_weekend_nights(new.check_in::date, new.nights)
      else 0
    end;

    subtotal := (new.room_price::numeric * new.nights * new.rooms)
      + round(new.room_price::numeric * coalesce(catalog_weekend_pct, 0) / 100.0)
        * weekend_nights * new.rooms;

    clean_coupon := nullif(upper(btrim(coalesce(new.coupon_code, ''))), '');
    new.coupon_code := clean_coupon;

    if clean_coupon is not null then
      select discount_pct, max_discount
        into c_pct, c_max
        from public.coupons
       where code = clean_coupon
         and active = true
         and (valid_until is null or valid_until > now());

      if not found then
        raise exception 'Kode kupon "%" tidak valid atau sudah kadaluarsa.', clean_coupon;
      end if;

      calc_coupon := round((subtotal * c_pct) / 100.0);
      if c_max is not null then
        calc_coupon := least(calc_coupon, c_max::numeric);
      end if;
      new.coupon_discount := greatest(0, calc_coupon);
    else
      new.coupon_discount := 0;
    end if;

    after_coupon := greatest(0, subtotal - new.coupon_discount);

    if new.user_id is not null and exists (
      select 1 from public.members m where m.user_id = new.user_id
    ) then
      new.member_discount := round(after_coupon * 0.10);
    else
      new.member_discount := 0;
    end if;

    new.total_price := greatest(0, after_coupon - new.member_discount);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.user_id := old.user_id;
    new.hotel_id := old.hotel_id;
    new.rooms := old.rooms;
    new.room_price := old.room_price;
    new.coupon_code := old.coupon_code;
    new.created_at := old.created_at;

    if old.status = 'cancelled' and new.status <> 'cancelled' then
      raise exception 'Pesanan yang sudah dibatalkan tidak dapat diubah kembali.';
    end if;

    if old.status = 'completed' and new.status <> 'completed' then
      raise exception 'Pesanan yang sudah selesai tidak dapat diubah kembali.';
    end if;

    is_hotel_partner := exists (
      select 1 from public.hotels h
       where h.id = new.hotel_id
         and h.partner_email = (auth.jwt() ->> 'email')
    );

    is_booking_owner := old.user_id is not null and old.user_id = auth.uid()
      or (old.email is not null and old.email = (auth.jwt() ->> 'email'));

    is_reschedule := old.status in ('pending', 'confirmed')
      and (new.check_in is distinct from old.check_in or new.check_out is distinct from old.check_out);

    if is_reschedule then
      if not (is_privileged or is_booking_owner or is_hotel_partner or public.is_admin()) then
        raise exception 'Anda tidak memiliki izin mengubah tanggal pesanan ini.';
      end if;

      new.nights := greatest(1, (new.check_out::date - new.check_in::date));

      select room_types, coalesce(weekend_surcharge_percent, 0)
        into h_room_types, h_weekend_pct
        from public.hotels
       where id = new.hotel_id;

      catalog_weekend_pct := coalesce((
        select coalesce((elem->>'weekend_surcharge_percent')::numeric,
                        (elem->>'weekendSurchargePercent')::numeric,
                        h_weekend_pct, 0)
          from jsonb_array_elements(coalesce(h_room_types, '[]'::jsonb)) as elem
         where elem->>'id' = new.room_type_id
         limit 1
      ), 0);

      weekend_nights := public.count_weekend_nights(new.check_in::date, new.nights);

      new.weekend_surcharge_percent := coalesce(catalog_weekend_pct, 0);

      subtotal := (old.room_price::numeric * new.nights * new.rooms)
        + round(old.room_price::numeric * catalog_weekend_pct / 100.0) * weekend_nights * new.rooms;

      old_subtotal := greatest(1, old.room_price::numeric * old.nights * old.rooms);

      -- Diskon lama diskalakan proporsional terhadap perubahan durasi
      new.coupon_discount := round(coalesce(old.coupon_discount, 0) * subtotal / old_subtotal);
      new.member_discount := round(coalesce(old.member_discount, 0) * subtotal / old_subtotal);
      new.total_price := greatest(0, subtotal - new.coupon_discount - new.member_discount);

      new.original_check_in := coalesce(old.original_check_in, old.check_in);
      new.original_check_out := coalesce(old.original_check_out, old.check_out);
      new.reschedule_count := coalesce(old.reschedule_count, 0) + 1;
      new.rescheduled_at := now();

      if not is_privileged then
        new.paid_at := old.paid_at;
        new.payment_method := old.payment_method;
        new.snap_token := old.snap_token;
        new.midtrans_order_id := old.midtrans_order_id;
        new.expires_at := old.expires_at;
        new.platform_fee := old.platform_fee;
        new.partner_net := old.partner_net;
      end if;

      return new;
    end if;

    new.nights := old.nights;
    new.check_in := old.check_in;
    new.check_out := old.check_out;
    new.coupon_discount := old.coupon_discount;
    new.member_discount := old.member_discount;
    new.total_price := old.total_price;

    if not is_privileged then
      if new.status <> old.status then
        if new.status = 'confirmed' then
          raise exception 'Konfirmasi pembayaran hanya dapat dilakukan oleh server pembayaran.';
        end if;
        if not (
          (old.status = 'pending' and new.status = 'cancelled')
          or (old.status = 'confirmed' and new.status in ('completed', 'cancelled') and (is_hotel_partner or public.is_admin()))
        ) then
          raise exception 'Anda tidak memiliki izin untuk mengubah status pesanan ini.';
        end if;
      end if;

      new.paid_at := old.paid_at;
      new.payment_method := old.payment_method;
      new.snap_token := old.snap_token;
      new.midtrans_order_id := old.midtrans_order_id;
      new.expires_at := old.expires_at;
      new.platform_fee := old.platform_fee;
      new.partner_net := old.partner_net;
    else
      if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
        select coalesce(commission_rate, 0.15)
          into h_comm
          from public.hotels
         where id = new.hotel_id;

        new.platform_fee := round(new.total_price * coalesce(h_comm, 0.15));
        new.partner_net := greatest(0, new.total_price - new.platform_fee);
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;
