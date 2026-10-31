-- ============================================================================
-- WismaKu: kedaluwarsa pesanan pending (expires_at + job pembatalan otomatis)
-- ============================================================================

-- 1. Kolom batas waktu pembayaran. Pesanan lama yang masih pending diberi
--    jendela 1 jam sejak migrasi ini dijalankan.
alter table public.bookings
  add column if not exists expires_at timestamptz;

update public.bookings
  set expires_at = now() + interval '1 hour'
  where status = 'pending' and expires_at is null;

-- 2. Server menetapkan expires_at saat INSERT; klien tidak boleh mengubahnya.
create or replace function public.enforce_booking_integrity()
returns trigger
language plpgsql
as $$
declare
  expected_total numeric(12,2);
  is_privileged boolean;
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.paid_at := null;
    new.payment_method := null;
    new.snap_token := null;
    new.midtrans_order_id := null;
    new.expires_at := now() + interval '1 hour';
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

    is_privileged := current_user in ('service_role', 'postgres', 'supabase_admin')
      or coalesce(auth.role(), '') = 'service_role';

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

-- 3. Pembatalan otomatis. Toleransi 10 menit setelah expires_at memberi ruang
--    bagi webhook Midtrans yang terlambat sebelum pesanan dibatalkan.
create or replace function public.expire_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.bookings
    set status = 'cancelled'
    where status = 'pending'
      and expires_at is not null
      and expires_at < now() - interval '10 minutes';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_pending_bookings() from public, anon, authenticated;

-- 4. Jadwalkan tiap 5 menit via pg_cron.
create extension if not exists pg_cron;

select cron.unschedule('expire-pending-bookings')
  where exists (select 1 from cron.job where jobname = 'expire-pending-bookings');

select cron.schedule(
  'expire-pending-bookings',
  '*/5 * * * *',
  $$select public.expire_pending_bookings()$$
);
