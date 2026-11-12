-- AlterTable
ALTER TABLE "blogs"
ADD COLUMN "gallery_images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "videos" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "extra_description" TEXT NOT NULL DEFAULT '';
