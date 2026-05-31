-- Multiple turf images support
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Backfill image_urls from existing image_url
UPDATE turfs
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR image_urls = '{}');

-- Helper for storage RLS
CREATE OR REPLACE FUNCTION public.is_turf_official()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'turf_official')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Turf images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('turf-images', 'turf-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view turf images" ON storage.objects;
DROP POLICY IF EXISTS "Officials can upload turf images" ON storage.objects;
DROP POLICY IF EXISTS "Officials can delete turf images" ON storage.objects;

-- Public read
CREATE POLICY "Anyone can view turf images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'turf-images');

-- Officials can upload
CREATE POLICY "Officials can upload turf images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'turf-images'
    AND public.is_turf_official()
  );

-- Officials can delete their uploads
CREATE POLICY "Officials can delete turf images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'turf-images'
    AND public.is_turf_official()
  );

-- Officials can update turf images (required by some storage operations)
CREATE POLICY "Officials can update turf images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'turf-images'
    AND public.is_turf_official()
  )
  WITH CHECK (
    bucket_id = 'turf-images'
    AND public.is_turf_official()
  );

-- Turf write access for officials
DROP POLICY IF EXISTS "Officials can insert turfs" ON turfs;
DROP POLICY IF EXISTS "Officials can update turfs" ON turfs;
DROP POLICY IF EXISTS "Officials can delete turfs" ON turfs;

CREATE POLICY "Officials can insert turfs"
  ON turfs FOR INSERT
  WITH CHECK (public.is_turf_official());

CREATE POLICY "Officials can update turfs"
  ON turfs FOR UPDATE
  USING (public.is_turf_official());

CREATE POLICY "Officials can delete turfs"
  ON turfs FOR DELETE
  USING (public.is_turf_official());

-- Allow turf officials to manage bookings like admins
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Officials can view all bookings"
  ON bookings FOR SELECT
  USING (public.is_turf_official());

DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
CREATE POLICY "Officials can update any booking"
  ON bookings FOR UPDATE
  USING (public.is_turf_official());

DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;
CREATE POLICY "Officials can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (public.is_turf_official() OR auth.uid() = user_id);
