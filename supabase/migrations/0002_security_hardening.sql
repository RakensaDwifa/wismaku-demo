-- ============================================================================
-- WismaKu security hardening & schema alignment
-- ============================================================================

-- 1. Selaraskan skema public.members dengan service registerMember (name, email)
alter table public.members
  add column if not exists name text,
  add column if not exists email text;

-- 2. Set default auth.uid() pada kolom user_id agar insert dari klien
--    (seperti toggleFavorite({ hotel_id })) otomatis terikat ke sesi aktif.
alter table public.members alter column user_id set default auth.uid();
alter table public.favorites alter column user_id set default auth.uid();
alter table public.bookings alter column user_id set default auth.uid();
alter table public.reviews alter column user_id set default auth.uid();

-- 3. Batasi baca kupon publik hanya untuk kupon yang aktif dan belum kadaluarsa
drop policy if exists "coupons public read" on public.coupons;
create policy "coupons public read" on public.coupons
  for select
  using (active = true and (valid_until is null or valid_until > now()));

-- 4. Cegah duplikasi ulasan per (hotel_id, user_id) di level database
create unique index if not exists reviews_hotel_user_unique_idx
  on public.reviews (hotel_id, user_id)
  where user_id is not null;

-- 5. Izinkan pendaftaran partner tanpa login (user_id is null) sesuai kontrak aplikasi,
--    namun tetap kunci user_id = auth.uid() bila sudah login.
drop policy if exists "partners self insert" on public.partners;
create policy "partners self insert" on public.partners
  for insert
  with check ((auth.uid() is null and user_id is null) or auth.uid() = user_id);

-- 6. Kunci kolom metadata profil yang tidak boleh diubah klien (provider, email, joined_at)
create or replace function public.protect_profile_immutable_columns()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.provider := old.provider;
  new.joined_at := old.joined_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_immutable on public.profiles;
create trigger profiles_protect_immutable
  before update on public.profiles
  for each row execute function public.protect_profile_immutable_columns();

-- 7. Tegakkan integritas harga dan transisi status booking di server
-- ponytail: validasi penuh harga kamar terhadap JSONB room_types katalog dapat
-- ditambahkan saat skema room_types dinormalisasi ke tabel terpisah.
create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
as $$
declare
  expected_total numeric(12,2);
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.paid_at := null;
    new.payment_method := null;
    expected_total := greatest(
      0,
      (new.room_price::numeric * new.nights * new.rooms)
        - coalesce(new.coupon_discount, 0)
        - coalesce(new.member_discount, 0)
    );
    new.total_price := expected_total;
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
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_enforce_integrity on public.bookings;
create trigger bookings_enforce_integrity
  before insert or update on public.bookings
  for each row execute function public.enforce_booking_integrity();
