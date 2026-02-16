-- =====================================
-- Supabase Storage Setup & Policies
-- =====================================
-- این فایل را در SQL Editor پنل Supabase اجرا کنید

-- 1. Create Storage Buckets
-- =====================================

-- Create news-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];


-- 2. Storage Policies for news-images
-- =====================================

-- Allow public to view images
CREATE POLICY "Public can view news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload news images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update news images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news-images')
WITH CHECK (bucket_id = 'news-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete news images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'news-images');


-- 3. Storage Policies for videos
-- =====================================

-- Allow public to view videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to update videos
CREATE POLICY "Authenticated users can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Allow authenticated users to delete videos
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');


-- 4. Storage Policies for profile-images
-- =====================================

-- Allow public to view profile images
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload their profile images
CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 5. Helper Function for Image Optimization
-- =====================================

-- Function to get optimized image URL (placeholder for future enhancements)
CREATE OR REPLACE FUNCTION get_optimized_image_url(
  bucket_name TEXT,
  file_path TEXT,
  width INT DEFAULT NULL,
  height INT DEFAULT NULL,
  quality INT DEFAULT 80
)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Get public URL
  SELECT concat(
    current_setting('app.settings.storage_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  ) INTO base_url;
  
  -- In future, add transformation parameters
  -- For now, return base URL
  RETURN base_url;
END;
$$ LANGUAGE plpgsql;


-- 6. Clean up orphaned storage objects (Optional)
-- =====================================

-- Function to clean up storage objects not referenced in news table
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_objects()
RETURNS void AS $$
DECLARE
  object_record RECORD;
BEGIN
  -- This is a template function
  -- Implement logic to find and delete orphaned objects
  RAISE NOTICE 'Run cleanup manually or via cron job';
END;
$$ LANGUAGE plpgsql;


-- 7. Verify Buckets & Policies
-- =====================================

-- Check if buckets exist
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('news-images', 'videos', 'profile-images');

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;


-- 8. CORS Configuration (if needed)
-- =====================================
-- Note: CORS is typically configured in Supabase Dashboard under Settings > API
-- But you can also set it via SQL if you have the right permissions

-- Example CORS policy (adjust as needed)
/*
ALTER TABLE storage.objects 
SET (security_invoker = on);
*/

-- =====================================
-- Notes:
-- =====================================
-- 1. این اسکریپت را در SQL Editor پنل Supabase اجرا کنید
-- 2. مطمئن شوید که RLS (Row Level Security) فعال است
-- 3. بعد از اجرا، از بخش Storage در پنل Supabase بررسی کنید که bucket‌ها ایجاد شده‌اند
-- 4. برای تنظیمات CORS به Settings > API > CORS مراجعه کنید
-- 5. اگر خطای "policy already exists" دریافت کردید، نگران نباشید - یعنی قبلاً ایجاد شده
