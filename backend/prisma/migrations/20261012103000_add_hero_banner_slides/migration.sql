-- CreateEnum
CREATE TYPE "HeroBannerLayoutType" AS ENUM ('FULL_WIDTH', 'SPLIT_DUAL', 'MULTI_IMAGE');

-- CreateTable
CREATE TABLE "hero_banner_slides" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "layout_type" "HeroBannerLayoutType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mobile_image_url" TEXT NOT NULL DEFAULT '',
    "mobile_image_public_id" TEXT NOT NULL DEFAULT '',
    "desktop_image_url" TEXT NOT NULL DEFAULT '',
    "desktop_image_public_id" TEXT NOT NULL DEFAULT '',
    "mini_heading" TEXT NOT NULL DEFAULT '',
    "main_heading" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "button_label" TEXT NOT NULL DEFAULT '',
    "button_url" TEXT NOT NULL DEFAULT '',
    "button2_label" TEXT NOT NULL DEFAULT '',
    "button2_url" TEXT NOT NULL DEFAULT '',
    "left_image_url" TEXT NOT NULL DEFAULT '',
    "left_image_public_id" TEXT NOT NULL DEFAULT '',
    "right_image_url" TEXT NOT NULL DEFAULT '',
    "right_image_public_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banner_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_banner_grid_images" (
    "id" UUID NOT NULL,
    "slide_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "alt" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banner_grid_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_banner_slides_site_id_order_idx" ON "hero_banner_slides"("site_id", "order");

-- CreateIndex
CREATE INDEX "hero_banner_slides_site_id_active_order_idx" ON "hero_banner_slides"("site_id", "active", "order");

-- CreateIndex
CREATE INDEX "hero_banner_grid_images_slide_id_order_idx" ON "hero_banner_grid_images"("slide_id", "order");

-- AddForeignKey
ALTER TABLE "hero_banner_slides" ADD CONSTRAINT "hero_banner_slides_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_banner_grid_images" ADD CONSTRAINT "hero_banner_grid_images_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "hero_banner_slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
