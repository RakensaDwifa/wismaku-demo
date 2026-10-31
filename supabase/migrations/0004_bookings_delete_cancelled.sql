-- ============================================================================
-- WismaKu allow booking owner to delete own cancelled bookings only
-- ============================================================================

drop policy if exists "bookings self delete cancelled" on public.bookings;
create policy "bookings self delete cancelled" on public.bookings
  for delete
  using (auth.uid() = user_id and status = 'cancelled');
