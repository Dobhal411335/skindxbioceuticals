-- CreateTable
CREATE TABLE "promo_banner_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_banner_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_banner_items" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "button_url" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_banner_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_banner_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "section_label" TEXT NOT NULL DEFAULT '',
    "section_heading" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_banner_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_banner_items" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "button_url" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_banner_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_banner_configs_site_id_key" ON "promo_banner_configs"("site_id");

-- CreateIndex
CREATE INDEX "promo_banner_items_config_id_sort_order_idx" ON "promo_banner_items"("config_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "collection_banner_configs_site_id_key" ON "collection_banner_configs"("site_id");

-- CreateIndex
CREATE INDEX "collection_banner_items_config_id_sort_order_idx" ON "collection_banner_items"("config_id", "sort_order");

-- AddForeignKey
ALTER TABLE "promo_banner_configs" ADD CONSTRAINT "promo_banner_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_banner_items" ADD CONSTRAINT "promo_banner_items_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "promo_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_banner_configs" ADD CONSTRAINT "collection_banner_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_banner_items" ADD CONSTRAINT "collection_banner_items_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "collection_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
