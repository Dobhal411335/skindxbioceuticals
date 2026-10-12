-- Product logo/banner image for Product Gallery admin section.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "banner_public_id" TEXT;
