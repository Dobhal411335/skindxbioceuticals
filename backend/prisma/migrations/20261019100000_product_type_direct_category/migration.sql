-- Product listing type: DIRECT (no subcategory) | CATEGORY (under subcategory).
-- Backfill: products with a subcategory become CATEGORY; otherwise DIRECT.

CREATE TYPE "ProductType" AS ENUM ('DIRECT', 'CATEGORY');

ALTER TABLE "products"
  ADD COLUMN "product_type" "ProductType" NOT NULL DEFAULT 'CATEGORY';

UPDATE "products"
SET "product_type" = CASE
  WHEN "subcategory_id" IS NULL THEN 'DIRECT'::"ProductType"
  ELSE 'CATEGORY'::"ProductType"
END;

CREATE INDEX "products_site_id_product_type_idx"
  ON "products"("site_id", "product_type");
