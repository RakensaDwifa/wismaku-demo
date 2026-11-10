-- ============================================================================
-- 0016_refund_requests.sql
-- WismaKu: Sistem Dispute & Refund Desk (Tamu, Extranet Mitra, HQ Audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hotel_id text NOT NULL,
  guest_name text NOT NULL,
  email text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  bank_name text,
  account_number text,
  account_holder text,
  status text NOT NULL DEFAULT 'pending',
  hq_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_booking ON refund_requests (booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON refund_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_hotel ON refund_requests (hotel_id);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tamu read own refund requests" ON refund_requests;
CREATE POLICY "Tamu read own refund requests"
ON refund_requests FOR SELECT
USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin());

DROP POLICY IF EXISTS "Tamu insert own refund requests" ON refund_requests;
CREATE POLICY "Tamu insert own refund requests"
ON refund_requests FOR INSERT
WITH CHECK (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin());

DROP POLICY IF EXISTS "Mitra read hotel refund requests" ON refund_requests;
CREATE POLICY "Mitra read hotel refund requests"
ON refund_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM hotels
    WHERE hotels.id = refund_requests.hotel_id
      AND hotels.partner_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Admin manage refund requests" ON refund_requests;
CREATE POLICY "Admin manage refund requests"
ON refund_requests FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
