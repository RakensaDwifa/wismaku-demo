-- ============================================================================
-- WismaKu Midtrans Snap Sandbox payment columns & server-only confirmation lock
-- ============================================================================

-- 1. Tambah kolom pelacakan transaksi Midtrans Snap pada public.bookings
alter table public.bookings
  add column if not exists snap_token text,
  add column if not exists midtrans_order_id text;

create unique index if not exists bookings_midtrans_order_id_idx
  on public.bookings (midtrans_order_id)
  where midtrans_order_id is not null;

-- 2. Kunci perubahan status 'confirmed' serta kolom pembayaran agar hanya dapat
--    diubah oleh server (service_role pada Edge Function), sementara pemilik
--    pesanan tetap dapat membatalkan pesanannya sendiri ('cancelled').
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
