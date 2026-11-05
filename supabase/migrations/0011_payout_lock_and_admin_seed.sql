-- ============================================================================
-- 0011_payout_lock_and_admin_seed.sql
-- WismaKu: Kunci Payout ID pada Bookings, Kebijakan RLS Internal, & Akun Bootstrap
-- ============================================================================

-- 1. Tambah kolom payout_id pada public.bookings agar pesanan yang dicairkan terkunci
alter table public.bookings
  add column if not exists payout_id uuid references public.partner_payouts(id) on delete set null;

create index if not exists idx_bookings_payout_id on public.bookings(payout_id);

-- 2. Perbarui handle_new_user agar membaca role awal jika disediakan di user_metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, provider, avatar_url, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'given_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do update
  set name = coalesce(excluded.name, public.profiles.name),
      role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$;

-- 3. Kebijakan RLS agar Admin/Staff dapat mengelola data internal
-- Profiles: Admin dapat melihat seluruh akun & mengubah role
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select
  using (public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Kupon: Admin dapat membuat & memperbarui kupon diskon nasional
drop policy if exists "coupons admin write" on public.coupons;
create policy "coupons admin write" on public.coupons
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Ulasan: Admin/Staff dapat moderasi ulasan (update/delete ulasan bermasalah)
drop policy if exists "reviews admin update" on public.reviews;
create policy "reviews admin update" on public.reviews
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews
  for delete
  using (public.is_admin());

-- Pendaftaran Mitra (partners / partner_leads): Admin/Staff dapat membaca & memproses
drop policy if exists "partners admin read" on public.partners;
create policy "partners admin read" on public.partners
  for select
  using (public.is_admin());

drop policy if exists "partners admin update" on public.partners;
create policy "partners admin update" on public.partners
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Akun Bootstrap Internal (admin@wismaku.com, staff@wismaku.com, mitra@wismaku.com)
do $$
declare
  admin_uid uuid := 'a0000000-0000-0000-0000-000000000001';
  staff_uid uuid := 'a0000000-0000-0000-0000-000000000002';
  mitra_uid uuid := 'a0000000-0000-0000-0000-000000000003';
begin
  -- 1. admin@wismaku.com (superadmin)
  if not exists (select 1 from auth.users where email = 'admin@wismaku.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@wismaku.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Super Admin WismaKu","role":"superadmin"}',
      now(),
      now()
    );
  end if;

  -- 2. staff@wismaku.com (staff)
  if not exists (select 1 from auth.users where email = 'staff@wismaku.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      staff_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'staff@wismaku.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Staff Operasional","role":"staff"}',
      now(),
      now()
    );
  end if;

  -- 3. mitra@wismaku.com (mitra)
  if not exists (select 1 from auth.users where email = 'mitra@wismaku.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      mitra_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mitra@wismaku.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Mitra WismaKu","role":"mitra"}',
      now(),
      now()
    );
  end if;

  -- Pastikan profil publik memiliki role yang tepat
  update public.profiles set role = 'superadmin', name = 'Super Admin WismaKu' where email = 'admin@wismaku.com';
  update public.profiles set role = 'staff', name = 'Staff Operasional' where email = 'staff@wismaku.com';
  update public.profiles set role = 'mitra', name = 'Mitra WismaKu' where email = 'mitra@wismaku.com';
end $$;
