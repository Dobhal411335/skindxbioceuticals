-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "media_type" "GalleryMediaType" NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_public_id" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_items_site_id_order_idx" ON "gallery_items"("site_id", "order");

-- CreateIndex
CREATE INDEX "gallery_items_site_id_active_order_idx" ON "gallery_items"("site_id", "active", "order");

-- CreateIndex
CREATE INDEX "gallery_items_site_id_media_type_order_idx" ON "gallery_items"("site_id", "media_type", "order");

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
