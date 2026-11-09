-- ============================================================================
-- 0012_internal_rbac_hardening.sql
-- WismaKu: Hardening Kebijakan RLS Server, Kunci Payouts, Moderasi Ulasan,
--          Balasan Mitra, & Publikasi Realtime Internal HQ
-- ============================================================================

-- 1. Perbarui helper pengecekan hak akses admin & superadmin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
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
set search_path = public
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

-- 2. Kolom moderasi & balasan mitra pada public.reviews + status lead pada public.partners
alter table public.reviews
  add column if not exists is_hidden boolean not null default false,
  add column if not exists reply_text text,
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by text;

create index if not exists idx_reviews_is_hidden on public.reviews(is_hidden);

alter table public.partners
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected'));

-- 3. Perbarui proteksi profil: hanya superadmin / service_role yang dapat mengubah role
create or replace function public.protect_profile_immutable_columns()
returns trigger
language plpgsql
as $$
declare
  is_privileged boolean;
begin
  is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role'
    or public.is_superadmin();

  new.id := old.id;
  new.email := old.email;
  new.provider := old.provider;
  new.joined_at := old.joined_at;

  if not is_privileged and new.role is distinct from old.role then
    raise exception 'Peran akun hanya dapat diubah oleh Super Admin.';
  end if;

  return new;
end;
$$;

-- 4. Perbarui enforce_booking_integrity:
--    - Tetap SECURITY INVOKER agar current_user tidak ter-elevasi ke pemilik fungsi
--    - Pertahankan validasi harga dari hotels.room_types (JSONB) & members
--    - Konfirmasi pembayaran ('confirmed') tetap dikunci khusus server pembayaran (service_role)
--    - Admin/Mitra boleh menyelesaikan atau membatalkan pesanan; Superadmin boleh mengunci payout_id
--    - Hitung platform_fee & partner_net dari hotels.commission_rate saat confirmed/completed
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
  is_server boolean;
  is_admin_actor boolean;
  is_superadmin_actor boolean;
  is_hotel_partner boolean;
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

-- Backfill split komisi untuk pesanan confirmed/completed lama yang masih 0
update public.bookings b
set platform_fee = round(b.total_price * coalesce(h.commission_rate, 0.15)),
    partner_net = greatest(0, b.total_price - round(b.total_price * coalesce(h.commission_rate, 0.15)))
from public.hotels h
where h.id = b.hotel_id
  and b.status in ('confirmed', 'completed')
  and coalesce(b.total_price, 0) > 0
  and coalesce(b.platform_fee, 0) = 0
  and coalesce(b.partner_net, 0) = 0;

-- 5. Perbarui statistik ulasan agar mengecualikan ulasan yang ditangguhkan (is_hidden = true)
create or replace function public.recalc_hotel_review_stats(target_hotel_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
  avg_rating numeric(3,2);
begin
  if target_hotel_id is null then
    return;
  end if;

  select count(*)::int, coalesce(round(avg(rating)::numeric, 1), 0)
    into cnt, avg_rating
    from public.reviews
    where hotel_id = target_hotel_id
      and coalesce(is_hidden, false) = false;

  update public.hotels
  set review_count = cnt,
      rating = avg_rating
  where id = target_hotel_id;
end;
$$;

create or replace function public.handle_reviews_stats_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_hotel_review_stats(old.hotel_id);
    return old;
  elsif tg_op = 'INSERT' then
    perform public.recalc_hotel_review_stats(new.hotel_id);
    return new;
  elsif tg_op = 'UPDATE' then
    if old.rating is distinct from new.rating
       or old.hotel_id is distinct from new.hotel_id
       or old.is_hidden is distinct from new.is_hidden then
      if old.hotel_id is distinct from new.hotel_id then
        perform public.recalc_hotel_review_stats(old.hotel_id);
      end if;
      perform public.recalc_hotel_review_stats(new.hotel_id);
    end if;
    return new;
  end if;
  return null;
end;
$$;

-- Kunci kolom sensitif ulasan saat diubah oleh non-admin (mitra hanya boleh membalas, tamu hanya konten sendiri)
create or replace function public.enforce_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_actor boolean;
  is_hotel_partner boolean;
begin
  is_admin_actor := current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(auth.role(), '') = 'service_role'
    or public.is_admin();

  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.hotel_id := old.hotel_id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;

    if not is_admin_actor then
      new.is_hidden := old.is_hidden;

      is_hotel_partner := exists (
        select 1 from public.hotels h
         where h.id = old.hotel_id
           and h.partner_email = (auth.jwt() ->> 'email')
      );

      if is_hotel_partner and auth.uid() is distinct from old.user_id then
        -- Mitra hanya boleh memperbarui balasan resmi, bukan isi/rating ulasan tamu
        new.name := old.name;
        new.city := old.city;
        new.rating := old.rating;
        new.text := old.text;
      elsif auth.uid() = old.user_id then
        -- Tamu hanya boleh mengubah ulasan miliknya, bukan balasan mitra
        new.reply_text := old.reply_text;
        new.replied_at := old.replied_at;
        new.replied_by := old.replied_by;
      end if;
    end if;
  else
    if not is_admin_actor then
      new.is_hidden := false;
      new.reply_text := null;
      new.replied_at := null;
      new.replied_by := null;
    end if;
  end if;

  if new.user_id is not null then
    new.verified_guest := exists (
      select 1
      from public.bookings b
      where b.user_id = new.user_id
        and b.hotel_id = new.hotel_id
        and b.status in ('confirmed', 'completed')
    );
  else
    new.verified_guest := coalesce(new.verified_guest, false);
  end if;

  return new;
end;
$$;

-- 6. Kebijakan RLS Lengkap Lintas 3 Role (Tamu, Mitra, Internal HQ)

-- Profiles: baca milik sendiri atau admin; ubah role khusus superadmin
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select
  using (public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Bookings: admin dapat membaca semua & memperbarui (cancel/complete; lock payout oleh superadmin di trigger)
drop policy if exists "bookings admin read" on public.bookings;
create policy "bookings admin read" on public.bookings
  for select
  using (public.is_admin());

drop policy if exists "bookings admin update" on public.bookings;
create policy "bookings admin update" on public.bookings
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Partner Payouts: baca oleh mitra pemilik atau admin; tulis khusus superadmin
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
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Coupons: baca publik hanya kupon aktif, admin bisa baca semua; tulis khusus superadmin
drop policy if exists "coupons admin read" on public.coupons;
create policy "coupons admin read" on public.coupons
  for select
  using (public.is_admin());

drop policy if exists "coupons admin write" on public.coupons;
create policy "coupons admin write" on public.coupons
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Reviews: publik hanya melihat is_hidden = false; mitra pemilik hotel & admin tetap dapat melihat untuk transparansi
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select
  using (
    coalesce(is_hidden, false) = false
    or public.is_admin()
    or exists (
      select 1 from public.hotels h
      where h.id = reviews.hotel_id
        and h.partner_email = (auth.jwt() ->> 'email')
    )
  );

drop policy if exists "reviews partner reply" on public.reviews;
create policy "reviews partner reply" on public.reviews
  for update
  using (
    exists (
      select 1 from public.hotels h
      where h.id = reviews.hotel_id
        and h.partner_email = (auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.hotels h
      where h.id = reviews.hotel_id
        and h.partner_email = (auth.jwt() ->> 'email')
    )
  );

drop policy if exists "reviews admin update" on public.reviews;
create policy "reviews admin update" on public.reviews
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews
  for delete
  using (public.is_admin());

-- Partners (pendaftaran calon mitra): admin dapat membaca, memproses, dan menghapus data uji
drop policy if exists "partners admin read" on public.partners;
create policy "partners admin read" on public.partners
  for select
  using (public.is_admin());

drop policy if exists "partners admin update" on public.partners;
create policy "partners admin update" on public.partners
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "partners admin delete" on public.partners;
create policy "partners admin delete" on public.partners
  for delete
  using (public.is_admin());

-- Audit Logs: baca & tulis oleh admin/staff
drop policy if exists "audit_logs admin read" on public.audit_logs;
create policy "audit_logs admin read" on public.audit_logs
  for select
  using (public.is_admin());

drop policy if exists "audit_logs admin insert" on public.audit_logs;
create policy "audit_logs admin insert" on public.audit_logs
  for insert
  with check (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

-- 7. Sinkronisasi profil bootstrap agar seluruh akun internal memiliki baris di public.profiles
insert into public.profiles (id, name, email, provider, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'email',
  case
    when u.email = 'admin@wismaku.com' then 'superadmin'
    when u.email = 'staff@wismaku.com' then 'staff'
    when u.email = 'mitra@wismaku.com' then 'mitra'
    else coalesce(u.raw_user_meta_data->>'role', 'member')
  end
from auth.users u
on conflict (id) do update
set role = case
  when excluded.email = 'admin@wismaku.com' then 'superadmin'
  when excluded.email = 'staff@wismaku.com' then 'staff'
  when excluded.email = 'mitra@wismaku.com' then 'mitra'
  else public.profiles.role
end;

-- Bersihkan baris probe uji realtime jika sempat tertinggal
delete from public.partners where email = 'rt-probe@test.local';

-- 8. Aktifkan Supabase Realtime pada tabel bookings & partners untuk notifikasi langsung HQ
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
    ) then
      alter publication supabase_realtime add table public.bookings;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partners'
    ) then
      alter publication supabase_realtime add table public.partners;
    end if;

    alter table public.bookings replica identity full;
    alter table public.partners replica identity full;
  end if;
end $$;
