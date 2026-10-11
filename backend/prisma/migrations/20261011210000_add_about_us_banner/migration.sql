-- CreateTable
CREATE TABLE "about_us_banner_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "promo_label" TEXT NOT NULL DEFAULT '',
    "promo_heading" TEXT NOT NULL DEFAULT '',
    "promo_subheading" TEXT NOT NULL DEFAULT '',
    "promo_button_label" TEXT NOT NULL DEFAULT '',
    "promo_button_url" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_us_banner_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_us_about_cards" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "heading" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "button_label" TEXT NOT NULL,
    "button_url" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_us_about_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_us_highlight_items" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "heading" TEXT NOT NULL,
    "button_label" TEXT NOT NULL,
    "button_url" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_us_highlight_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_us_text_slides" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "heading" TEXT NOT NULL,
    "subheading" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_us_text_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_us_banner_configs_site_id_key" ON "about_us_banner_configs"("site_id");

-- CreateIndex
CREATE INDEX "about_us_about_cards_config_id_sort_order_idx" ON "about_us_about_cards"("config_id", "sort_order");

-- CreateIndex
CREATE INDEX "about_us_highlight_items_config_id_sort_order_idx" ON "about_us_highlight_items"("config_id", "sort_order");

-- CreateIndex
CREATE INDEX "about_us_text_slides_config_id_sort_order_idx" ON "about_us_text_slides"("config_id", "sort_order");

-- AddForeignKey
ALTER TABLE "about_us_banner_configs" ADD CONSTRAINT "about_us_banner_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_us_about_cards" ADD CONSTRAINT "about_us_about_cards_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "about_us_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_us_highlight_items" ADD CONSTRAINT "about_us_highlight_items_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "about_us_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_us_text_slides" ADD CONSTRAINT "about_us_text_slides_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "about_us_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
