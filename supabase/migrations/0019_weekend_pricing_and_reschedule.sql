-- ============================================================================
-- 0019_weekend_pricing_and_reschedule.sql
-- WismaKu: Server-side Weekend Surcharge + Izin Reschedule Mandiri Tamu
--
-- PENTING: fungsi enforce_booking_integrity di bawah ini adalah kelanjutan dari
-- versi 0012_internal_rbac_hardening (kunci payout_id, is_admin/is_superadmin,
-- aturan transisi status). Jangan disederhanakan tanpa memindahkan aturan itu.
-- ============================================================================

-- 1. Simpan persentase surcharge yang berlaku pada pesanan (untuk estimasi reschedule tamu)
alter table public.bookings
  add column if not exists weekend_surcharge_percent numeric default 0;

-- 2. Hitung jumlah malam akhir pekan (Jumat/Sabtu) dalam rentang menginap.
--    extract(dow) -> 0=Minggu ... 5=Jumat, 6=Sabtu (konsisten dengan isWeekendNight di JS).
create or replace function public.count_weekend_nights(p_check_in date, p_nights int)
returns int
language sql
immutable
as $$
  select coalesce(count(*), 0)::int
    from generate_series(0, greatest(coalesce(p_nights, 1), 1) - 1) as day_offset
   where extract(dow from (p_check_in + day_offset)) in (5, 6);
$$;

-- 3. Perbarui trigger integritas booking:
--    - INSERT: terapkan weekend surcharge dari katalog room_types / hotels
--    - UPDATE: tamu boleh reschedule tanggal; total & diskon dihitung ulang
--    - Tetap mempertahankan seluruh aturan RBAC dari 0012
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
  old_weekend_nights int;
  old_subtotal numeric(12,2);
  subtotal numeric(12,2);
  clean_coupon text;
  c_pct int;
  c_max int;
  calc_coupon numeric(12,2);
  after_coupon numeric(12,2);
  is_server boolean;
  is_admin_actor boolean;
  is_superadmin_actor boolean;
  is_hotel_partner boolean;
  is_booking_owner boolean;
  is_reschedule boolean;
begin
  is_server := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role';
  is_admin_actor := public.is_admin();
  is_superadmin_actor := public.is_superadmin();

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.paid_at := null;
    new.payment_method := null;
    new.snap_token := null;
    new.midtrans_order_id := null;
    new.expires_at := now() + interval '1 hour';
    new.platform_fee := 0;
    new.partner_net := 0;
    new.payout_id := null;
    catalog_weekend_pct := 0;

    if new.nights is null or new.nights < 1 then
      new.nights := 1;
    end if;
    if new.rooms is null or new.rooms < 1 then
      new.rooms := 1;
    end if;

    if new.hotel_id is null then
      if not is_server then
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
             coalesce(
               nullif(elem->>'weekend_surcharge_percent', '')::numeric,
               nullif(elem->>'weekendSurchargePercent', '')::numeric,
               h_weekend_pct,
               0
             )
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
    new.original_check_in := null;
    new.original_check_out := null;
    new.reschedule_count := 0;
    new.rescheduled_at := null;

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

    is_booking_owner := (old.user_id is not null and old.user_id = auth.uid())
      or (old.email is not null and old.email = (auth.jwt() ->> 'email'));

    is_reschedule := old.status in ('pending', 'confirmed')
      and new.check_in is not null
      and new.check_out is not null
      and new.check_out > new.check_in
      and (
        new.check_in is distinct from old.check_in
        or new.check_out is distinct from old.check_out
      );

    if is_reschedule then
      if not (is_server or is_booking_owner or is_hotel_partner or is_admin_actor) then
        raise exception 'Anda tidak memiliki izin mengubah tanggal pesanan ini.';
      end if;

      -- Tamu tidak boleh mengubah status sekaligus mengubah tanggal.
      if not is_server then
        new.status := old.status;
      end if;

      new.nights := greatest(1, (new.check_out::date - new.check_in::date));

      select coalesce(weekend_surcharge_percent, 0)
        into h_weekend_pct
        from public.hotels
       where id = new.hotel_id;

      catalog_weekend_pct := coalesce(old.weekend_surcharge_percent, h_weekend_pct, 0);

      weekend_nights := public.count_weekend_nights(new.check_in::date, new.nights);
      new.weekend_surcharge_percent := catalog_weekend_pct;

      subtotal := (old.room_price::numeric * new.nights * new.rooms)
        + round(old.room_price::numeric * catalog_weekend_pct / 100.0) * weekend_nights * new.rooms;

      -- Subtotal lama dipakai sebagai basis skala diskon (sudah termasuk surcharge weekend lama).
      old_weekend_nights := case
        when old.check_in is not null then public.count_weekend_nights(old.check_in::date, old.nights)
        else 0
      end;

      old_subtotal := (old.room_price::numeric * greatest(old.nights, 1) * greatest(old.rooms, 1))
        + round(old.room_price::numeric * coalesce(old.weekend_surcharge_percent, 0) / 100.0)
          * old_weekend_nights * greatest(old.rooms, 1);

      if old_subtotal > 0 then
        new.coupon_discount := least(
          subtotal,
          greatest(0, round(coalesce(old.coupon_discount, 0) * subtotal / old_subtotal))
        );
        new.member_discount := least(
          greatest(0, subtotal - new.coupon_discount),
          greatest(0, round(coalesce(old.member_discount, 0) * subtotal / old_subtotal))
        );
      else
        new.coupon_discount := 0;
        new.member_discount := 0;
      end if;

      new.total_price := greatest(0, subtotal - new.coupon_discount - new.member_discount);

      -- Split komisi dihitung ulang hanya bila pesanan sudah pernah dipisah (sudah dibayar).
      if coalesce(old.platform_fee, 0) > 0 or coalesce(old.partner_net, 0) > 0 then
        select coalesce(commission_rate, 0.15)
          into h_comm
          from public.hotels
         where id = new.hotel_id;

        h_comm := coalesce(h_comm, 0.15);
        new.platform_fee := round(new.total_price * h_comm);
        new.partner_net := greatest(0, new.total_price - new.platform_fee);
      else
        new.platform_fee := old.platform_fee;
        new.partner_net := old.partner_net;
      end if;

      new.original_check_in := coalesce(old.original_check_in, old.check_in::text);
      new.original_check_out := coalesce(old.original_check_out, old.check_out::text);
      new.reschedule_count := coalesce(old.reschedule_count, 0) + 1;
      new.rescheduled_at := now();

      if not is_server then
        new.paid_at := old.paid_at;
        new.payment_method := old.payment_method;
        new.snap_token := old.snap_token;
        new.midtrans_order_id := old.midtrans_order_id;
        new.expires_at := old.expires_at;

        if not is_superadmin_actor then
          new.payout_id := old.payout_id;
        end if;
      end if;

      return new;
    end if;

    -- Jalur non-reschedule: kunci jadwal & finansial seperti versi 0012.
    new.nights := old.nights;
    new.check_in := old.check_in;
    new.check_out := old.check_out;
    new.coupon_discount := old.coupon_discount;
    new.member_discount := old.member_discount;
    new.total_price := old.total_price;
    new.weekend_surcharge_percent := old.weekend_surcharge_percent;
    new.original_check_in := old.original_check_in;
    new.original_check_out := old.original_check_out;
    new.reschedule_count := old.reschedule_count;
    new.rescheduled_at := old.rescheduled_at;

    if not is_server then
      if new.status <> old.status then
        if new.status = 'confirmed' then
          raise exception 'Konfirmasi pembayaran hanya dapat dilakukan oleh server pembayaran.';
        end if;
        if not (
          (old.status = 'pending' and new.status = 'cancelled')
          or (old.status = 'confirmed' and new.status in ('completed', 'cancelled') and (is_hotel_partner or is_admin_actor))
          or (old.status in ('pending', 'confirmed') and new.status = 'cancelled' and is_admin_actor)
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

      if not is_superadmin_actor then
        new.payout_id := old.payout_id;
      end if;
    end if;

    -- Pastikan split komisi terhitung dari hotels.commission_rate saat pesanan valid
    if new.status in ('confirmed', 'completed')
       and (coalesce(new.platform_fee, 0) = 0 and coalesce(new.partner_net, 0) = 0 and coalesce(new.total_price, 0) > 0) then
      select coalesce(commission_rate, 0.15)
        into h_comm
        from public.hotels
       where id = new.hotel_id;

      h_comm := coalesce(h_comm, 0.15);
      new.platform_fee := round(coalesce(new.total_price, 0) * h_comm);
      new.partner_net := greatest(0, coalesce(new.total_price, 0) - new.platform_fee);
    end if;

    return new;
  end if;

  return new;
end;
$$;
