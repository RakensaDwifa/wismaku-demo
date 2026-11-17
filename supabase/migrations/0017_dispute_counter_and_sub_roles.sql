-- ============================================================================
-- 0017_dispute_counter_and_sub_roles.sql
-- WismaKu: Fitur Sanggah Dispute Mitra & Sub-Role Mitra (Owner vs Frontdesk)
-- ============================================================================

-- 1. Tambah kolom sanggah dispute pada tabel refund_requests
ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS partner_response text,
  ADD COLUMN IF NOT EXISTS partner_evidence_url text,
  ADD COLUMN IF NOT EXISTS partner_responded_at timestamptz;

-- 2. Tambah kolom sub_role pada tabel profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sub_role text DEFAULT 'owner' CHECK (sub_role IN ('owner', 'frontdesk'));

-- 3. Tambah kolom sub_role pada tabel partners (jika ada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS sub_role text DEFAULT 'owner';
  END IF;
END $$;

-- 4. RLS Policy: Mitra dapat mengupdate tanggapan sanggahan pada refund hotel miliknya
DROP POLICY IF EXISTS "Mitra update own hotel refund response" ON refund_requests;
CREATE POLICY "Mitra update own hotel refund response"
ON refund_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM hotels
    WHERE hotels.id = refund_requests.hotel_id
      AND hotels.partner_email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM hotels
    WHERE hotels.id = refund_requests.hotel_id
      AND hotels.partner_email = (auth.jwt() ->> 'email')
  )
);
