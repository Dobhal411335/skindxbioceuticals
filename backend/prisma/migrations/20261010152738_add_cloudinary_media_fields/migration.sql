/*
  Warnings:

  - You are about to drop the column `key` on the `media` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[public_id]` on the table `media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[asset_id]` on the table `media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "media_key_key";

-- AlterTable
ALTER TABLE "media" DROP COLUMN "key",
ADD COLUMN     "asset_id" TEXT,
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "feature" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "site_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "media_public_id_key" ON "media"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_id_key" ON "media"("asset_id");

-- CreateIndex
CREATE INDEX "media_site_id_idx" ON "media"("site_id");

-- CreateIndex
CREATE INDEX "media_feature_idx" ON "media"("feature");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
