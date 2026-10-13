-- CreateTable
CREATE TABLE "popup_banner_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "mini_heading" TEXT NOT NULL DEFAULT '',
    "heading" TEXT NOT NULL DEFAULT '',
    "sub_description" TEXT NOT NULL DEFAULT '',
    "button_label" TEXT NOT NULL DEFAULT '',
    "button_url" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popup_banner_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "popup_banner_configs_site_id_key" ON "popup_banner_configs"("site_id");

-- AddForeignKey
ALTER TABLE "popup_banner_configs" ADD CONSTRAINT "popup_banner_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
