-- ============================================================================
-- WismaKu reviews verified_guest badge & automatic hotel rating/count sync
-- ============================================================================

-- 1. Tambah kolom penanda Tamu Terverifikasi pada public.reviews
alter table public.reviews
  add column if not exists verified_guest boolean not null default false;

-- 2. Kunci kolom identitas ulasan saat UPDATE & isi verified_guest otomatis
--    berdasarkan riwayat pesanan berstatus 'confirmed' di hotel terkait.
create or replace function public.enforce_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.hotel_id := old.hotel_id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;

  if new.user_id is not null then
    new.verified_guest := exists (
      select 1
      from public.bookings b
      where b.user_id = new.user_id
        and b.hotel_id = new.hotel_id
        and b.status = 'confirmed'
    );
  else
    new.verified_guest := coalesce(new.verified_guest, false);
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_enforce_integrity on public.reviews;
create trigger reviews_enforce_integrity
  before insert or update on public.reviews
  for each row execute function public.enforce_review_integrity();

-- 3. Bila pesanan pengguna baru dikonfirmasi belakangan setelah mengulas,
--    otomatis tandai ulasannya pada hotel tersebut sebagai Tamu Terverifikasi.
create or replace function public.sync_review_verified_on_booking_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed'
     and old.status is distinct from 'confirmed'
     and new.hotel_id is not null then
    update public.reviews
    set verified_guest = true
    where user_id = new.user_id
      and hotel_id = new.hotel_id
      and verified_guest = false;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_sync_verified_review on public.bookings;
create trigger bookings_sync_verified_review
  after update of status on public.bookings
  for each row execute function public.sync_review_verified_on_booking_confirm();

-- 4. Hitung ulang hotels.review_count & hotels.rating murni dari public.reviews
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
    where hotel_id = target_hotel_id;

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
    if old.rating is distinct from new.rating or old.hotel_id is distinct from new.hotel_id then
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

drop trigger if exists reviews_sync_hotel_stats on public.reviews;
create trigger reviews_sync_hotel_stats
  after insert or update or delete on public.reviews
  for each row execute function public.handle_reviews_stats_sync();

-- 5. Backfill awal verified_guest & statistik seluruh hotel dari public.reviews
update public.reviews r
set verified_guest = exists (
  select 1
  from public.bookings b
  where b.user_id = r.user_id
    and b.hotel_id = r.hotel_id
    and b.status = 'confirmed'
)
where r.user_id is not null;

update public.hotels h
set review_count = coalesce(stats.cnt, 0),
    rating = coalesce(stats.avg_rating, 0)
from (
  select hotel_id,
         count(*)::int as cnt,
         round(avg(rating)::numeric, 1) as avg_rating
  from public.reviews
  group by hotel_id
) stats
where h.id = stats.hotel_id;

update public.hotels h
set review_count = 0,
    rating = 0
where not exists (
  select 1 from public.reviews r where r.hotel_id = h.id
);
