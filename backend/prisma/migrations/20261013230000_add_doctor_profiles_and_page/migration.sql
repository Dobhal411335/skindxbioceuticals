-- CreateEnum
CREATE TYPE "DoctorConsultancyType" AS ENUM ('BY_APPOINTMENT', 'ONLINE');

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "consultancy_type" "DoctorConsultancyType" NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_public_id" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_page_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "about_heading" TEXT NOT NULL DEFAULT '',
    "about_description" TEXT NOT NULL DEFAULT '',
    "about_highlights" JSONB NOT NULL DEFAULT '[]',
    "about_button_label" TEXT NOT NULL DEFAULT '',
    "about_button_url" TEXT NOT NULL DEFAULT '',
    "about_image_url" TEXT NOT NULL DEFAULT '',
    "about_image_public_id" TEXT NOT NULL DEFAULT '',
    "about_secondary_image_url" TEXT NOT NULL DEFAULT '',
    "about_secondary_image_public_id" TEXT NOT NULL DEFAULT '',
    "experience_years" INTEGER,
    "services_heading" TEXT NOT NULL DEFAULT '',
    "services_subheading" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_service_items" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "icon_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "read_more_url" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_service_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_profiles_site_id_order_idx" ON "doctor_profiles"("site_id", "order");

-- CreateIndex
CREATE INDEX "doctor_profiles_site_id_active_order_idx" ON "doctor_profiles"("site_id", "active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_page_configs_site_id_key" ON "doctor_page_configs"("site_id");

-- CreateIndex
CREATE INDEX "doctor_service_items_config_id_order_idx" ON "doctor_service_items"("config_id", "order");

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_page_configs" ADD CONSTRAINT "doctor_page_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_service_items" ADD CONSTRAINT "doctor_service_items_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "doctor_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
