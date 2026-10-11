-- CreateTable
CREATE TABLE "company_basic_infos" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL DEFAULT '',
    "company_domain_name" TEXT NOT NULL DEFAULT '',
    "contact_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whatsapp_number" TEXT NOT NULL DEFAULT '',
    "main_logo_url" TEXT NOT NULL DEFAULT '',
    "main_logo_public_id" TEXT NOT NULL DEFAULT '',
    "footer_logo_url" TEXT NOT NULL DEFAULT '',
    "footer_logo_public_id" TEXT NOT NULL DEFAULT '',
    "mobile_ui_logo_url" TEXT NOT NULL DEFAULT '',
    "mobile_ui_logo_public_id" TEXT NOT NULL DEFAULT '',
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "office_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "google_address" TEXT NOT NULL DEFAULT '',
    "google_url" TEXT NOT NULL DEFAULT '',
    "google_link" TEXT NOT NULL DEFAULT '',
    "facebook_link" TEXT NOT NULL DEFAULT '',
    "instagram_link" TEXT NOT NULL DEFAULT '',
    "youtube_link" TEXT NOT NULL DEFAULT '',
    "google_map_link" TEXT NOT NULL DEFAULT '',
    "google_tracking_tag" TEXT NOT NULL DEFAULT '',
    "title_tag_for_main_landing_page" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_basic_infos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_basic_infos_site_id_key" ON "company_basic_infos"("site_id");

-- AddForeignKey
ALTER TABLE "company_basic_infos" ADD CONSTRAINT "company_basic_infos_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
