-- AlterEnum: allow text cards in the lookbook gallery
ALTER TYPE "GalleryMediaType" ADD VALUE 'TEXT_CARD';

-- AlterTable: media URL may be empty for TEXT_CARD; add click + text-card fields
ALTER TABLE "gallery_items" ALTER COLUMN "media_url" SET DEFAULT '';

ALTER TABLE "gallery_items"
ADD COLUMN "click_url" TEXT NOT NULL DEFAULT '',
ADD COLUMN "heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "button_label" TEXT NOT NULL DEFAULT '',
ADD COLUMN "button_url" TEXT NOT NULL DEFAULT '';
