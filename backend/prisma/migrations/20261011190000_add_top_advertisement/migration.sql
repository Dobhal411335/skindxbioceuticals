-- CreateEnum
CREATE TYPE "TopAdvertisementSection" AS ENUM ('ANNOUNCEMENT', 'UTILITY', 'BENEFIT');

-- CreateTable
CREATE TABLE "top_advertisement_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_advertisement_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_advertisement_items" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "section" "TopAdvertisementSection" NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_advertisement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "top_advertisement_configs_site_id_key" ON "top_advertisement_configs"("site_id");

-- CreateIndex
CREATE INDEX "top_advertisement_items_config_id_section_idx" ON "top_advertisement_items"("config_id", "section");

-- AddForeignKey
ALTER TABLE "top_advertisement_configs" ADD CONSTRAINT "top_advertisement_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_advertisement_items" ADD CONSTRAINT "top_advertisement_items_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "top_advertisement_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
