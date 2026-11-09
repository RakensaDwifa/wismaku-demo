-- ============================================================================
-- 0013_storage_buckets.sql
-- WismaKu: Bucket Penyimpanan Supabase Media Properti (hotel-assets) &
--          Kwitansi Transfer Payout Mitra (payout-receipts)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('hotel-assets', 'hotel-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payout-receipts', 'payout-receipts', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for WismaKu Assets'
  ) THEN
    CREATE POLICY "Public Access for WismaKu Assets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('hotel-assets', 'payout-receipts'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload WismaKu Assets'
  ) THEN
    CREATE POLICY "Authenticated Upload WismaKu Assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('hotel-assets', 'payout-receipts'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Update WismaKu Assets'
  ) THEN
    CREATE POLICY "Authenticated Update WismaKu Assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id IN ('hotel-assets', 'payout-receipts'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Delete WismaKu Assets'
  ) THEN
    CREATE POLICY "Authenticated Delete WismaKu Assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id IN ('hotel-assets', 'payout-receipts'));
  END IF;
END $$;
