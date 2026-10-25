ALTER TABLE "about_us_banner_configs"
ADD COLUMN "services_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN "services_view_all_label" TEXT NOT NULL DEFAULT '',
ADD COLUMN "services_view_all_url" TEXT NOT NULL DEFAULT '';

CREATE TABLE "about_us_services" (
  "id" UUID NOT NULL,
  "config_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL DEFAULT '',
  "image_public_id" TEXT NOT NULL DEFAULT '',
  "button_label" TEXT NOT NULL,
  "heading" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "doctor_image_url" TEXT NOT NULL DEFAULT '',
  "doctor_image_public_id" TEXT NOT NULL DEFAULT '',
  "doctor_name" TEXT NOT NULL DEFAULT '',
  "doctor_designation" TEXT NOT NULL DEFAULT '',
  "doctor_button_label" TEXT NOT NULL DEFAULT '',
  "doctor_button_url" TEXT NOT NULL DEFAULT '',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "about_us_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "about_us_service_highlights" (
  "id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "about_us_service_highlights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "about_us_services_config_id_sort_order_idx" ON "about_us_services"("config_id", "sort_order");
CREATE INDEX "about_us_service_highlights_service_id_sort_order_idx" ON "about_us_service_highlights"("service_id", "sort_order");
ALTER TABLE "about_us_services" ADD CONSTRAINT "about_us_services_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "about_us_banner_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "about_us_service_highlights" ADD CONSTRAINT "about_us_service_highlights_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "about_us_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
