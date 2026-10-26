-- Promo banners are now color-led content cards instead of image tiles.
ALTER TABLE "promo_banner_items"
  DROP COLUMN IF EXISTS "image_url",
  DROP COLUMN IF EXISTS "image_public_id";

ALTER TABLE "promo_banner_items"
  ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
