CREATE TABLE "clinical_confidence_configs" (
  "id" UUID NOT NULL,
  "site_id" UUID NOT NULL,
  "badge_text" TEXT NOT NULL DEFAULT '',
  "heading" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "button1_label" TEXT NOT NULL DEFAULT '',
  "button1_url" TEXT NOT NULL DEFAULT '',
  "button2_label" TEXT NOT NULL DEFAULT '',
  "button2_url" TEXT NOT NULL DEFAULT '',
  "background_image_url" TEXT NOT NULL DEFAULT '',
  "background_image_public_id" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_confidence_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_confidence_cards" (
  "id" UUID NOT NULL,
  "config_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL DEFAULT '',
  "image_public_id" TEXT NOT NULL DEFAULT '',
  "heading" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "button_label" TEXT NOT NULL DEFAULT '',
  "button_url" TEXT NOT NULL DEFAULT '',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_confidence_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_confidence_configs_site_id_key" ON "clinical_confidence_configs"("site_id");
CREATE INDEX "clinical_confidence_cards_config_id_sort_order_idx" ON "clinical_confidence_cards"("config_id", "sort_order");
ALTER TABLE "clinical_confidence_configs" ADD CONSTRAINT "clinical_confidence_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_confidence_cards" ADD CONSTRAINT "clinical_confidence_cards_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "clinical_confidence_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
