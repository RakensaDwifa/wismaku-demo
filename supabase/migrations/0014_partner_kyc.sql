-- ============================================================================
-- 0014_partner_kyc.sql
-- WismaKu: Kolom KYC Legalitas Mitra (KTP, NIB/NPWP, Approval Status) &
--          Storage Bucket Dokumen Legalitas (partner-documents)
-- ============================================================================

ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unsubmitted',
  ADD COLUMN IF NOT EXISTS id_card_number text,
  ADD COLUMN IF NOT EXISTS nib_or_npwp text,
  ADD COLUMN IF NOT EXISTS id_card_url text,
  ADD COLUMN IF NOT EXISTS business_doc_url text,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz;

UPDATE partners
SET kyc_status = 'approved'
WHERE status = 'approved' AND kyc_status = 'unsubmitted';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('partner-documents', 'partner-documents', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for Partner Documents'
  ) THEN
    CREATE POLICY "Public Access for Partner Documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'partner-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload Partner Documents'
  ) THEN
    CREATE POLICY "Authenticated Upload Partner Documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'partner-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Update Partner Documents'
  ) THEN
    CREATE POLICY "Authenticated Update Partner Documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'partner-documents');
  END IF;
END $$;

-- RLS kebijakan partners self read & update
DROP POLICY IF EXISTS "partners self read" ON partners;
CREATE POLICY "partners self read"
ON partners FOR SELECT
USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin());

DROP POLICY IF EXISTS "partners self update" ON partners;
CREATE POLICY "partners self update"
ON partners FOR UPDATE
USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin())
WITH CHECK (auth.uid() = user_id OR email = (auth.jwt() ->> 'email') OR is_admin());

