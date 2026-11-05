-- ============================================================================
-- 0010_rbac_financial_and_audit.sql
-- WismaKu: RBAC Mitra & Admin, Pemisahan Komisi, Payouts, dan Jejak Audit
-- ============================================================================

-- 1. Tambah kolom role pada public.profiles dengan default 'member'
alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('member', 'mitra', 'staff', 'superadmin'));

-- Helper: cek peran admin (staff / superadmin)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'superadmin')
  );
$$;

-- Helper: cek peran mitra
create or replace function public.is_mitra()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'mitra'
  );
$$;

-- 2. Kunci kolom role agar tidak dapat diubah sembarangan oleh klien browser
create or replace function public.protect_profile_immutable_columns()
returns trigger
language plpgsql
as $$
declare
  is_privileged boolean;
begin
  is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role';

  new.id := old.id;
  new.email := old.email;
  new.provider := old.provider;
  new.joined_at := old.joined_at;

  -- Klien non-superadmin tidak dapat mengganti role sendiri
  if not is_privileged and new.role <> old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    ) then
      new.role := old.role;
    end if;
  end if;

  return new;
end;
$$;

-- 3. Tambah kolom kepemilikan dan komisi pada public.hotels
alter table public.hotels
  add column if not exists partner_email text,
  add column if not exists commission_rate numeric(4,2) default 0.15;

-- Kebijakan RLS hotels untuk mitra & admin
drop policy if exists "hotels partner update" on public.hotels;
create policy "hotels partner update" on public.hotels
  for update
  using (
    partner_email = (auth.jwt() ->> 'email')
    or public.is_admin()
  )
  with check (
    partner_email = (auth.jwt() ->> 'email')
    or public.is_admin()
  );

drop policy if exists "hotels admin all" on public.hotels;
create policy "hotels admin all" on public.hotels
  for all
  using (public.is_admin());

-- 4. Perluas status pesanan bookings dan tambah split finansial
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'completed', 'cancelled'));

alter table public.bookings
  add column if not exists platform_fee numeric(12,2) default 0,
  add column if not exists partner_net numeric(12,2) default 0;

-- Kebijakan RLS bookings untuk mitra & admin
drop policy if exists "bookings partner read" on public.bookings;
create policy "bookings partner read" on public.bookings
  for select
  using (
    exists (
      select 1 from public.hotels h
      where h.id = bookings.hotel_id
        and (h.partner_email = (auth.jwt() ->> 'email') or public.is_admin())
    )
  );

drop policy if exists "bookings partner update" on public.bookings;
create policy "bookings partner update" on public.bookings
  for update
  using (
    exists (
      select 1 from public.hotels h
      where h.id = bookings.hotel_id
        and (h.partner_email = (auth.jwt() ->> 'email') or public.is_admin())
    )
  );

-- 5. Perbarui trigger enforce_booking_integrity untuk split finansial & izin mitra
create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
as $$
declare
  h_room_types jsonb;
  h_price int;
  h_comm numeric(4,2);
  catalog_room_price int;
  subtotal numeric(12,2);
  clean_coupon text;
  c_pct int;
  c_max int;
  calc_coupon numeric(12,2);
  after_coupon numeric(12,2);
  is_privileged boolean;
  is_hotel_partner boolean;
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

-- 6. Tabel Pencairan Dana Mitra (public.partner_payouts)
create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_email text not null,
  amount numeric(12,2) not null check (amount >= 0),
  period_start date not null,
  period_end date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  transfer_ref text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table public.partner_payouts enable row level security;

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
  using (public.is_admin());

-- 7. Tabel Jejak Audit Admin (public.audit_logs)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs admin read" on public.audit_logs;
create policy "audit_logs admin read" on public.audit_logs
  for select
  using (public.is_admin());

drop policy if exists "audit_logs admin insert" on public.audit_logs;
create policy "audit_logs admin insert" on public.audit_logs
  for insert
  with check (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

-- 8. Tautkan hotel awal (ID 1, 2, 3) ke mitra@wismaku.com
update public.hotels
set partner_email = 'mitra@wismaku.com',
    commission_rate = 0.15
where id in ('1', '2', '3');
