-- ==============================================================================
-- SHOPEE E-COMMERCE: ADMIN STORAGE PERMISSIONS FOR PRODUCT IMAGES (PHASE 10)
-- Migration: 20260929000002_admin_storage_permissions.sql
-- Description: Adds UPDATE and DELETE RLS policies on storage.objects for admins
-- ==============================================================================

-- Admin update policy for product images
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Admin delete policy for product images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());
