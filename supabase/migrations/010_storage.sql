-- ============================================================================
-- 010: Storage Buckets and Policies
-- ============================================================================
-- This migration creates Supabase Storage buckets and policies for file uploads.
--
-- Dependencies: 003_tables.sql (tables must exist for references)
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
--
-- NOTE: This migration is Supabase-specific. It will be skipped on standard
-- PostgreSQL where the storage schema does not exist.
-- ============================================================================

DO $$
BEGIN
  -- Check if storage schema exists (Supabase-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE NOTICE 'Storage schema does not exist - skipping Supabase Storage migration (not running on Supabase)';
    RETURN;
  END IF;

  -- ============================================================================
  -- STORAGE BUCKETS (only run on Supabase)
  -- ============================================================================

  -- Create restaurant logos bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'restaurant-logos',
    'restaurant-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ) ON CONFLICT (id) DO NOTHING;

  -- Create product images bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ) ON CONFLICT (id) DO NOTHING;

  -- Create attachments bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'attachments',
    'attachments',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
  ) ON CONFLICT (id) DO NOTHING;

  -- Create profile pictures bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'profile-pictures',
    'profile-pictures',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================================
  -- STORAGE POLICIES
  -- ============================================================================

  -- Restaurant logos bucket policies
  DROP POLICY IF EXISTS restaurant_logos_public_select ON storage.objects;
  CREATE POLICY restaurant_logos_public_select ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'restaurant-logos');

  DROP POLICY IF EXISTS restaurant_logos_authenticated_insert ON storage.objects;
  CREATE POLICY restaurant_logos_authenticated_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'restaurant-logos'
      AND auth.uid() IS NOT NULL
    );

  DROP POLICY IF EXISTS restaurant_logos_owner_update ON storage.objects;
  CREATE POLICY restaurant_logos_owner_update ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'restaurant-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS restaurant_logos_owner_delete ON storage.objects;
  CREATE POLICY restaurant_logos_owner_delete ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'restaurant-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Product images bucket policies
  DROP POLICY IF EXISTS product_images_public_select ON storage.objects;
  CREATE POLICY product_images_public_select ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS product_images_authenticated_insert ON storage.objects;
  CREATE POLICY product_images_authenticated_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'product-images'
      AND auth.uid() IS NOT NULL
    );

  DROP POLICY IF EXISTS product_images_owner_update ON storage.objects;
  CREATE POLICY product_images_owner_update ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'product-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS product_images_owner_delete ON storage.objects;
  CREATE POLICY product_images_owner_delete ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'product-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Attachments bucket policies
  DROP POLICY IF EXISTS attachments_authenticated_select ON storage.objects;
  CREATE POLICY attachments_authenticated_select ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'attachments'
      AND auth.uid() IS NOT NULL
    );

  DROP POLICY IF EXISTS attachments_authenticated_insert ON storage.objects;
  CREATE POLICY attachments_authenticated_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'attachments'
      AND auth.uid() IS NOT NULL
    );

  DROP POLICY IF EXISTS attachments_owner_update ON storage.objects;
  CREATE POLICY attachments_owner_update ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS attachments_owner_delete ON storage.objects;
  CREATE POLICY attachments_owner_delete ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Profile pictures bucket policies
  DROP POLICY IF EXISTS profile_pictures_public_select ON storage.objects;
  CREATE POLICY profile_pictures_public_select ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'profile-pictures');

  DROP POLICY IF EXISTS profile_pictures_authenticated_insert ON storage.objects;
  CREATE POLICY profile_pictures_authenticated_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-pictures'
      AND auth.uid() IS NOT NULL
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS profile_pictures_owner_update ON storage.objects;
  CREATE POLICY profile_pictures_owner_update ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile-pictures'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS profile_pictures_owner_delete ON storage.objects;
  CREATE POLICY profile_pictures_owner_delete ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-pictures'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );

  RAISE NOTICE 'Storage buckets and policies created successfully';
END $$;
