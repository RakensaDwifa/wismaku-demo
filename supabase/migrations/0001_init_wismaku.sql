-- ============================================================================
-- WismaKu initial schema
-- ============================================================================
-- Sengaja dibuat satu migrasi awal karena proyek sebelumnya tidak punya backend
-- sama sekali (semua data di localStorage). Tabel-tabel di bawah menggantikan
-- src/data/{hotels,cities,coupons}.js dan seluruh state pengguna yang tadinya
-- disimpan di browser.
--
-- Konvensi:
--   - PK hotel/city bertipe text (id lama dari mock data) supaya URL & detail
--     tetap stabil dan seed bisa di-upsert idempoten.
--   - PK pengguna bertipe uuid yang merujuk auth.users (cascade delete).
--   - RLS aktif di SEMUA tabel public. Kebijakan "self" memakai auth.uid().
--   - Tabel katalog (cities/hotels/coupons) bisa dibaca anon (read-only).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------------

create table public.cities (
  id text primary key,
  name text not null,
  slug text not null unique,
  image text,
  created_at timestamptz default now()
);

create table public.hotels (
  id text primary key,
  city_id text references public.cities(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  address text,
  area text,
  lat double precision,
  lng double precision,
  rating numeric(3,2),
  review_count int default 0,
  price_from int,
  original_price int,
  discount int,
  img text,
  amenities text[] default '{}',
  gallery text[] default '{}',
  policies jsonb default '{}'::jsonb,
  room_types jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.coupons (
  code text primary key,
  label text,
  discount_pct int not null check (discount_pct between 0 and 100),
  max_discount int,
  valid_until timestamptz,
  active boolean default true
);

-- ---------------------------------------------------------------------------
-- Pengguna & akun
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  provider text default 'email',
  avatar_url text,
  joined_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, provider, avatar_url)
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
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- WismaClub member (tanpa password — auth ditangani Supabase Auth)
create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_no text not null unique,
  joined_at timestamptz default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- Data per-pengguna (ter-scope RLS)
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id text not null references public.hotels(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, hotel_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id text references public.hotels(id) on delete set null,
  hotel_name text not null,
  hotel_img text,
  check_in date,
  check_out date,
  nights int not null check (nights >= 1),
  rooms int not null check (rooms >= 1),
  guests int not null default 0,
  room_type_id text not null,
  room_type_name text not null,
  room_price int not null,
  coupon_code text,
  coupon_discount numeric(12,2) default 0,
  member_discount numeric(12,2) default 0,
  total_price numeric(12,2) not null,
  guest_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null references public.hotels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  city text,
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 5 and 500),
  created_at timestamptz default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_name text not null,
  property_name text not null,
  city text not null,
  email text not null,
  submitted_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.hotels enable row level security;
alter table public.coupons enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.partners enable row level security;

-- katalog: baca publik
create policy "cities public read" on public.cities for select using (true);
create policy "hotels public read" on public.hotels for select using (true);
create policy "coupons public read" on public.coupons for select using (true);
create policy "reviews public read" on public.reviews for select using (true);

-- profiles: milik sendiri
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- members: milik sendiri
create policy "members self read" on public.members for select using (auth.uid() = user_id);
create policy "members self insert" on public.members for insert with check (auth.uid() = user_id);

-- favorites: milik sendiri
create policy "favorites self read" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites self insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites self delete" on public.favorites for delete using (auth.uid() = user_id);

-- bookings: milik sendiri
create policy "bookings self read" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings self insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings self update" on public.bookings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews: baca publik, tulis milik sendiri
create policy "reviews self insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews self update" on public.reviews for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews self delete" on public.reviews for delete using (auth.uid() = user_id);

-- partners: milik sendiri
create policy "partners self read" on public.partners for select using (auth.uid() = user_id);
create policy "partners self insert" on public.partners for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger hotels_touch before update on public.hotels
  for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
