-- Phase 1 catalog: site-scoped categories with banners + productCode/subcategory on products.

-- Drop global unique on categories.slug before adding site scope
DROP INDEX IF EXISTS "categories_slug_key";

-- Categories: site scope + banner fields
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "site_id" UUID;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "banner_public_id" TEXT;

-- Products: product code + optional subcategory link
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_code" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subcategory_id" UUID;

-- Backfill product_code for any existing rows (deterministic from id)
UPDATE "products"
SET "product_code" = 'LEGACY-' || REPLACE("id"::text, '-', '')
WHERE "product_code" IS NULL OR "product_code" = '';

ALTER TABLE "products" ALTER COLUMN "product_code" SET NOT NULL;

-- Remove orphan/global categories that cannot be site-scoped (table should be empty in early envs)
DELETE FROM "product_categories";
DELETE FROM "categories" WHERE "site_id" IS NULL;

-- If any categories remain without site_id (shouldn't), assign to first active site
UPDATE "categories" c
SET "site_id" = s.id
FROM (SELECT id FROM "sites" WHERE "is_active" = true ORDER BY "created_at" ASC LIMIT 1) s
WHERE c."site_id" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "site_id" SET NOT NULL;

-- Indexes / constraints
CREATE UNIQUE INDEX "categories_site_id_slug_key" ON "categories"("site_id", "slug");
CREATE INDEX "categories_site_id_idx" ON "categories"("site_id");
CREATE INDEX "categories_site_id_parent_id_idx" ON "categories"("site_id", "parent_id");
CREATE INDEX "categories_site_id_is_active_sort_order_idx" ON "categories"("site_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "products_site_id_product_code_key" ON "products"("site_id", "product_code");
CREATE INDEX "products_subcategory_id_idx" ON "products"("subcategory_id");
CREATE INDEX "products_site_id_status_idx" ON "products"("site_id", "status");

-- Foreign keys
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categories"
  DROP CONSTRAINT IF EXISTS "categories_parent_id_fkey";

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_subcategory_id_fkey"
  FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
