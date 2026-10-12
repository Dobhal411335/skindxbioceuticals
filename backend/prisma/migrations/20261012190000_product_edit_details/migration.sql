-- Product edit details: size/color masters, gallery, videos, info, reviews, tags, highlights, tax, coupon, variant offer fields.

-- Product size chart + ensure description can hold rich HTML
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_chart_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_chart_public_id" TEXT;

-- ProductVariant offer-row fields (Price / Quantity section)
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "vendor_price" DECIMAL(12, 2);
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "size_label" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "color_label" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "weight_grams" INTEGER;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "profile_image_public_id" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "sub_images" JSONB;

CREATE TABLE IF NOT EXISTS "catalog_colors" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "catalog_tags" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_sizes" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_colors" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "color_id" UUID,
    "name" TEXT NOT NULL,
    "hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_gallery_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_videos" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_info_sections" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_info_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_editorial_reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_by_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "image_public_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_editorial_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_tags" (
    "product_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "product_highlights" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_highlights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_taxes" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "cgst" DECIMAL(5, 2) NOT NULL,
    "sgst" DECIMAL(5, 2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_taxes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_coupons" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_colors_site_id_hex_key" ON "catalog_colors"("site_id", "hex");
CREATE UNIQUE INDEX IF NOT EXISTS "catalog_colors_site_id_name_key" ON "catalog_colors"("site_id", "name");
CREATE INDEX IF NOT EXISTS "catalog_colors_site_id_idx" ON "catalog_colors"("site_id");

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_tags_site_id_name_key" ON "catalog_tags"("site_id", "name");
CREATE INDEX IF NOT EXISTS "catalog_tags_site_id_idx" ON "catalog_tags"("site_id");

CREATE UNIQUE INDEX IF NOT EXISTS "product_sizes_product_id_label_key" ON "product_sizes"("product_id", "label");
CREATE INDEX IF NOT EXISTS "product_sizes_product_id_sort_order_idx" ON "product_sizes"("product_id", "sort_order");

CREATE INDEX IF NOT EXISTS "product_colors_product_id_sort_order_idx" ON "product_colors"("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "product_gallery_images_product_id_sort_order_idx" ON "product_gallery_images"("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "product_videos_product_id_sort_order_idx" ON "product_videos"("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "product_info_sections_product_id_sort_order_idx" ON "product_info_sections"("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "product_editorial_reviews_product_id_sort_order_idx" ON "product_editorial_reviews"("product_id", "sort_order");
CREATE INDEX IF NOT EXISTS "product_highlights_product_id_sort_order_idx" ON "product_highlights"("product_id", "sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "product_taxes_product_id_key" ON "product_taxes"("product_id");
CREATE UNIQUE INDEX IF NOT EXISTS "product_coupons_product_id_key" ON "product_coupons"("product_id");
CREATE INDEX IF NOT EXISTS "product_coupons_coupon_id_idx" ON "product_coupons"("coupon_id");

ALTER TABLE "catalog_colors" DROP CONSTRAINT IF EXISTS "catalog_colors_site_id_fkey";
ALTER TABLE "catalog_colors" ADD CONSTRAINT "catalog_colors_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "catalog_tags" DROP CONSTRAINT IF EXISTS "catalog_tags_site_id_fkey";
ALTER TABLE "catalog_tags" ADD CONSTRAINT "catalog_tags_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_sizes" DROP CONSTRAINT IF EXISTS "product_sizes_product_id_fkey";
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_colors" DROP CONSTRAINT IF EXISTS "product_colors_product_id_fkey";
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_colors" DROP CONSTRAINT IF EXISTS "product_colors_color_id_fkey";
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "catalog_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_gallery_images" DROP CONSTRAINT IF EXISTS "product_gallery_images_product_id_fkey";
ALTER TABLE "product_gallery_images" ADD CONSTRAINT "product_gallery_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_videos" DROP CONSTRAINT IF EXISTS "product_videos_product_id_fkey";
ALTER TABLE "product_videos" ADD CONSTRAINT "product_videos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_info_sections" DROP CONSTRAINT IF EXISTS "product_info_sections_product_id_fkey";
ALTER TABLE "product_info_sections" ADD CONSTRAINT "product_info_sections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_editorial_reviews" DROP CONSTRAINT IF EXISTS "product_editorial_reviews_product_id_fkey";
ALTER TABLE "product_editorial_reviews" ADD CONSTRAINT "product_editorial_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_tags" DROP CONSTRAINT IF EXISTS "product_tags_product_id_fkey";
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_tags" DROP CONSTRAINT IF EXISTS "product_tags_tag_id_fkey";
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "catalog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_highlights" DROP CONSTRAINT IF EXISTS "product_highlights_product_id_fkey";
ALTER TABLE "product_highlights" ADD CONSTRAINT "product_highlights_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_taxes" DROP CONSTRAINT IF EXISTS "product_taxes_product_id_fkey";
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_coupons" DROP CONSTRAINT IF EXISTS "product_coupons_product_id_fkey";
ALTER TABLE "product_coupons" ADD CONSTRAINT "product_coupons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_coupons" DROP CONSTRAINT IF EXISTS "product_coupons_coupon_id_fkey";
ALTER TABLE "product_coupons" ADD CONSTRAINT "product_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
