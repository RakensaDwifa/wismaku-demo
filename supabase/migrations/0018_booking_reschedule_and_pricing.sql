-- ============================================================================
-- 0018_booking_reschedule_and_pricing.sql
-- WismaKu: Fitur Reschedule Mandiri Tamu & Dynamic Pricing
-- ============================================================================

-- 1. Tambah kolom pencatatan perubahan jadwal (reschedule) pada tabel bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS original_check_in text,
  ADD COLUMN IF NOT EXISTS original_check_out text,
  ADD COLUMN IF NOT EXISTS reschedule_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz;

-- 2. Tambah kolom weekend_surcharge_percent pada tabel hotels & room_types
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS weekend_surcharge_percent numeric DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_types') THEN
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS weekend_surcharge_percent numeric DEFAULT 0;
  END IF;
END $$;

-- 3. RLS Policy: Tamu dapat memperbarui check-in dan check-out pesanannya sendiri
DROP POLICY IF EXISTS "Tamu update own booking reschedule" ON bookings;
CREATE POLICY "Tamu update own booking reschedule"
ON bookings FOR UPDATE
USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin())
WITH CHECK (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin());
