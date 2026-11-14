-- Drop unused product logo/banner columns (gallery images remain on product_gallery_images).
ALTER TABLE "products" DROP COLUMN IF EXISTS "banner_url";
ALTER TABLE "products" DROP COLUMN IF EXISTS "banner_public_id";
