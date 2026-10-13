-- Landing-page product highlight flags (Recent / Featured / Best seller).
-- `is_featured` already exists; add recent + best-seller and supporting indexes.

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_recent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_best_seller" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "products_site_id_status_is_featured_idx"
  ON "products"("site_id", "status", "is_featured");

CREATE INDEX IF NOT EXISTS "products_site_id_status_is_recent_idx"
  ON "products"("site_id", "status", "is_recent");

CREATE INDEX IF NOT EXISTS "products_site_id_status_is_best_seller_idx"
  ON "products"("site_id", "status", "is_best_seller");
