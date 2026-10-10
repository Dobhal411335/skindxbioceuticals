-- Fix schema integrity + multi-site support
-- Bug 1: sites / site_memberships / site_id on products, orders, enquiries
-- Bug 2: inventory_items.created_at
-- Bug 3: cart_items composite FK (variant must belong to product)
-- Bug 4: wishlist unique on (wishlist_id, product_id) — avoids NULL duplicate hole
-- Bug 5: allow multiple shipments per order via parcel_number

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN');

-- Create sites before required site_id FKs
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- Foundational site rows for .in storefront and .com content/enquiry site
INSERT INTO "sites" ("id", "code", "name", "domain", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'IN', 'India Ecommerce Storefront', 'skindxbioceuticals.in', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'COM', 'Global Content & Enquiry Site', 'skindxbioceuticals.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "site_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "role" "SiteRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_memberships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_memberships_site_id_idx" ON "site_memberships"("site_id");
CREATE UNIQUE INDEX "site_memberships_user_id_site_id_key" ON "site_memberships"("user_id", "site_id");

ALTER TABLE "site_memberships"
  ADD CONSTRAINT "site_memberships_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "site_memberships"
  ADD CONSTRAINT "site_memberships_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop constraints that will be replaced
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_variant_id_fkey";
DROP INDEX "products_slug_key";
DROP INDEX "shipments_order_id_key";
DROP INDEX "wishlist_items_wishlist_id_product_id_variant_id_key";

-- Bug 2: inventory created_at
ALTER TABLE "inventory_items"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Bug 5: multi-parcel shipments
ALTER TABLE "shipments"
  ADD COLUMN "parcel_number" INTEGER NOT NULL DEFAULT 1;

-- Add site_id with temporary default from IN site, then drop default
ALTER TABLE "products"
  ADD COLUMN "site_id" UUID;

ALTER TABLE "orders"
  ADD COLUMN "site_id" UUID;

ALTER TABLE "enquiries"
  ADD COLUMN "site_id" UUID;

UPDATE "products" p
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'IN' AND p."site_id" IS NULL;

UPDATE "orders" o
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'IN' AND o."site_id" IS NULL;

UPDATE "enquiries" e
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'COM' AND e."site_id" IS NULL;

ALTER TABLE "products" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "enquiries" ALTER COLUMN "site_id" SET NOT NULL;

-- Indexes / uniques
CREATE UNIQUE INDEX "product_variants_id_product_id_key" ON "product_variants"("id", "product_id");
CREATE INDEX "products_site_id_idx" ON "products"("site_id");
CREATE UNIQUE INDEX "products_site_id_slug_key" ON "products"("site_id", "slug");
CREATE INDEX "orders_site_id_idx" ON "orders"("site_id");
CREATE INDEX "enquiries_site_id_idx" ON "enquiries"("site_id");
CREATE INDEX "shipments_order_id_idx" ON "shipments"("order_id");
CREATE UNIQUE INDEX "shipments_order_id_parcel_number_key" ON "shipments"("order_id", "parcel_number");
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- Foreign keys
ALTER TABLE "products"
  ADD CONSTRAINT "products_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enquiries"
  ADD CONSTRAINT "enquiries_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bug 3: composite FK — variant must belong to the same product
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_variant_id_product_id_fkey"
  FOREIGN KEY ("variant_id", "product_id") REFERENCES "product_variants"("id", "product_id") ON DELETE CASCADE ON UPDATE CASCADE;
