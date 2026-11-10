-- ============================================================================
-- 0015_room_blackout_dates.sql
-- WismaKu: Tabel Manajemen Allotment & Blackout Dates Kamar Offline / Renovasi
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id text NOT NULL,
  room_type_id text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  blocked_qty integer NOT NULL DEFAULT 1,
  reason text DEFAULT 'Tamu Offline / Walk-in',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blackout_dates_hotel ON room_blackout_dates (hotel_id, start_date, end_date);

ALTER TABLE room_blackout_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Blackout Dates" ON room_blackout_dates;
CREATE POLICY "Public Read Blackout Dates"
ON room_blackout_dates FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Manage Blackout Dates" ON room_blackout_dates;
CREATE POLICY "Manage Blackout Dates"
ON room_blackout_dates FOR ALL
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = room_blackout_dates.hotel_id 
      AND hotels.partner_email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = room_blackout_dates.hotel_id 
      AND hotels.partner_email = (auth.jwt() ->> 'email')
  )
);
