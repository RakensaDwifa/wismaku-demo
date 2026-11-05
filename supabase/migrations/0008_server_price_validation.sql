-- ============================================================================
-- WismaKu: validasi harga kamar, kupon, dan diskon member di server (SQL)
-- ============================================================================
-- Memperketat enforce_booking_integrity() saat INSERT agar klien tidak dapat
-- memanipulasi room_price, coupon_discount, member_discount, atau total_price
-- secara langsung melalui API Supabase.
--
-- Fungsi tetap SECURITY INVOKER (default) agar pengecekan current_user /
-- auth.role() pada cabang UPDATE tidak ter-elevasi ke pemilik fungsi.
-- ============================================================================

create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
as $$
declare
  h_room_types jsonb;
  h_price int;
  catalog_room_price int;
  subtotal numeric(12,2);
  clean_coupon text;
  c_pct int;
  c_max int;
  calc_coupon numeric(12,2);
  after_coupon numeric(12,2);
  is_privileged boolean;
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

    if new.hotel_id is null then
      if not is_privileged then
        raise exception 'hotel_id wajib diisi.';
      end if;
      catalog_room_price := greatest(0, coalesce(new.room_price, 0));
    else
      select room_types, price_from
        into h_room_types, h_price
        from public.hotels
       where id = new.hotel_id;

      if not found then
        raise exception 'Penginapan tidak ditemukan.';
      end if;

      select (elem->>'price')::int
        into catalog_room_price
        from jsonb_array_elements(coalesce(h_room_types, '[]'::jsonb)) as elem
       where elem->>'id' = new.room_type_id
       limit 1;

      if catalog_room_price is null then
        if jsonb_array_length(coalesce(h_room_types, '[]'::jsonb)) = 0 and h_price is not null then
          catalog_room_price := h_price;
        else
          raise exception 'Tipe kamar "%" tidak valid untuk penginapan ini.', new.room_type_id;
        end if;
      end if;
    end if;

    new.room_price := catalog_room_price;
    subtotal := (new.room_price::numeric * new.nights * new.rooms);

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
    new.nights := old.nights;
    new.rooms := old.rooms;
    new.room_price := old.room_price;
    new.coupon_code := old.coupon_code;
    new.coupon_discount := old.coupon_discount;
    new.member_discount := old.member_discount;
    new.total_price := old.total_price;
    new.created_at := old.created_at;

    if old.status = 'cancelled' and new.status <> 'cancelled' then
      raise exception 'Pesanan yang sudah dibatalkan tidak dapat diubah kembali.';
    end if;

    if not is_privileged then
      if new.status <> old.status and new.status <> 'cancelled' then
        raise exception 'Konfirmasi pembayaran hanya dapat dilakukan oleh server pembayaran.';
      end if;
      new.paid_at := old.paid_at;
      new.payment_method := old.payment_method;
      new.snap_token := old.snap_token;
      new.midtrans_order_id := old.midtrans_order_id;
      new.expires_at := old.expires_at;
    end if;

    return new;
  end if;

  return new;
end;
$$;
