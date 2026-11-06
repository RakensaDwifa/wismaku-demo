-- ============================================================================
-- 0012_internal_rbac_hardening.sql
-- WismaKu: Hardening Kebijakan RLS Server, Kunci Payouts, & Moderasi Internal HQ
-- ============================================================================

-- 1. Perbarui helper pengecekan hak akses admin & superadmin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'superadmin', 'admin')
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('staff', 'superadmin', 'admin')
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'superadmin')
    )
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
as $$
  select (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('superadmin')
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('superadmin')
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );
$$;

-- 2. Tambah kolom is_hidden pada public.reviews untuk soft-moderation
alter table public.reviews
  add column if not exists is_hidden boolean not null default false;

create index if not exists idx_reviews_is_hidden on public.reviews(is_hidden);

-- 3. Perbarui proteksi profil agar Admin/Superadmin dapat mengubah role pengguna
create or replace function public.protect_profile_immutable_columns()
returns trigger
language plpgsql
as $$
declare
  is_privileged boolean;
begin
  is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role'
    or public.is_admin();

  new.id := old.id;
  new.email := old.email;

  if not is_privileged and new.role <> old.role then
    raise exception 'Peran akun tidak dapat diubah oleh pengguna biasa.';
  end if;

  return new;
end;
$$;

-- 4. Perbarui enforce_booking_integrity agar Admin dapat menyelesaikan, membatalkan, dan mengunci payout
create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
security definer
as $$
declare
  is_privileged boolean;
  is_hotel_partner boolean;
  base_price bigint;
  room_night_price bigint;
  after_coupon bigint;
  comm_rate numeric;
begin
  is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role'
    or public.is_admin();

  if tg_op = 'INSERT' then
    if new.nights is null or new.nights < 1 then
      new.nights := 1;
    end if;
    if new.rooms is null or new.rooms < 1 then
      new.rooms := 1;
    end if;

    select r.price_per_night into room_night_price
      from public.room_types r
     where r.id = new.room_type_id
       and r.hotel_id = new.hotel_id;

    if room_night_price is null then
      select h.price_per_night into room_night_price
        from public.hotels h
       where h.id = new.hotel_id;
    end if;

    if room_night_price is null or room_night_price <= 0 then
      room_night_price := coalesce(new.room_price, 0);
    end if;

    new.room_price := room_night_price;
    base_price := room_night_price * new.nights * new.rooms;

    if new.coupon_code is not null and trim(new.coupon_code) <> '' then
      declare
        c_pct numeric;
        c_max bigint;
        calc_disc bigint;
      begin
        select c.discount_pct, c.max_discount
          into c_pct, c_max
          from public.coupons c
         where c.code = upper(trim(new.coupon_code))
           and c.active = true
           and (c.valid_until is null or c.valid_until >= current_date);

        if c_pct is not null then
          calc_disc := round(base_price * (c_pct / 100.0));
          if c_max is not null and calc_disc > c_max then
            calc_disc := c_max;
          end if;
          new.coupon_discount := calc_disc;
        else
          new.coupon_discount := 0;
        end if;
      end;
    else
      new.coupon_discount := 0;
    end if;

    after_coupon := greatest(0, base_price - coalesce(new.coupon_discount, 0));

    if exists (
      select 1 from public.profiles p
       where p.id = new.user_id
         and p.role in ('member', 'mitra', 'staff', 'superadmin')
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

    if old.status = 'completed' and new.status <> 'completed' then
      raise exception 'Pesanan yang sudah selesai tidak dapat diubah kembali.';
    end if;

    is_hotel_partner := exists (
      select 1 from public.hotels h
       where h.id = new.hotel_id
         and h.partner_email = (auth.jwt() ->> 'email')
    );

    if not is_privileged then
      if new.status <> old.status then
        if new.status = 'confirmed' then
          raise exception 'Konfirmasi pembayaran hanya dapat dilakukan oleh server pembayaran.';
        end if;
        if not (
          (old.status = 'pending' and new.status = 'cancelled')
          or (old.status = 'confirmed' and new.status in ('completed', 'cancelled') and is_hotel_partner)
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
      new.payout_id := old.payout_id;
    else
      if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
        select coalesce(commission_rate, 0.15)
          into comm_rate
          from public.hotels
         where id = new.hotel_id;

        comm_rate := coalesce(comm_rate, 0.15);
        new.platform_fee := round(coalesce(new.total_price, 0) * comm_rate);
        new.partner_net := greatest(0, coalesce(new.total_price, 0) - new.platform_fee);
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

-- 5. Hardening Kebijakan RLS Tabel partner_payouts
drop policy if exists "partner_payouts read own" on public.partner_payouts;
create policy "partner_payouts read own" on public.partner_payouts
  for select
  using (
    partner_email = (auth.jwt() ->> 'email')
    or public.is_admin()
  );

drop policy if exists "partner_payouts admin write" on public.partner_payouts;
create policy "partner_payouts admin write" on public.partner_payouts
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Hardening Kebijakan RLS Tabel coupons
drop policy if exists "coupons admin write" on public.coupons;
create policy "coupons admin write" on public.coupons
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Hardening Kebijakan RLS Tabel audit_logs
drop policy if exists "audit_logs admin read" on public.audit_logs;
create policy "audit_logs admin read" on public.audit_logs
  for select
  using (public.is_admin());

drop policy if exists "audit_logs admin insert" on public.audit_logs;
create policy "audit_logs admin insert" on public.audit_logs
  for insert
  with check (public.is_admin());
