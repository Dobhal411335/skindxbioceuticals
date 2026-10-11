-- DropIndex
DROP INDEX IF EXISTS "gallery_items_site_id_order_idx";

-- DropIndex
DROP INDEX IF EXISTS "gallery_items_site_id_active_order_idx";

-- DropIndex
DROP INDEX IF EXISTS "gallery_items_site_id_media_type_order_idx";

-- AlterTable
ALTER TABLE "gallery_items" DROP COLUMN IF EXISTS "title",
DROP COLUMN IF EXISTS "caption",
DROP COLUMN IF EXISTS "order";

-- CreateIndex
CREATE INDEX "gallery_items_site_id_created_at_idx" ON "gallery_items"("site_id", "created_at");

-- CreateIndex
CREATE INDEX "gallery_items_site_id_active_created_at_idx" ON "gallery_items"("site_id", "active", "created_at");

-- CreateIndex
CREATE INDEX "gallery_items_site_id_media_type_created_at_idx" ON "gallery_items"("site_id", "media_type", "created_at");
