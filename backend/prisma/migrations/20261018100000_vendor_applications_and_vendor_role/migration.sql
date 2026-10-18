-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VENDOR';

-- CreateEnum
CREATE TYPE "VendorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable
CREATE TABLE "vendor_applications" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "industry_category" TEXT NOT NULL,
    "year_of_establishment" TEXT NOT NULL,
    "legal_structure" TEXT NOT NULL,
    "is_gst_registered" BOOLEAN NOT NULL DEFAULT false,
    "gst_number" TEXT,
    "pan_number" TEXT NOT NULL,
    "msme_number" TEXT,
    "gst_certificate" JSONB,
    "pan_card" JSONB,
    "msme_certificate" JSONB,
    "cancelled_cheque" JSONB,
    "product_catalog" JSONB,
    "business_card" JSONB,
    "aadhaar_upload" JSONB,
    "authorized_person_photo" JSONB,
    "contact_person" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "alternate_mobile" TEXT,
    "email" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "delivery_capability" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "quality_certifications" TEXT,
    "return_policy" TEXT,
    "aadhaar_number" TEXT,
    "referred_by" TEXT,
    "additional_notes" TEXT,
    "notes" TEXT,
    "status" "VendorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "password_hash" TEXT,
    "password_plain" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_applications_site_id_status_idx" ON "vendor_applications"("site_id", "status");

-- CreateIndex
CREATE INDEX "vendor_applications_site_id_is_active_idx" ON "vendor_applications"("site_id", "is_active");

-- CreateIndex
CREATE INDEX "vendor_applications_user_id_idx" ON "vendor_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_applications_site_id_email_key" ON "vendor_applications"("site_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_applications_site_id_mobile_key" ON "vendor_applications"("site_id", "mobile");

-- AddForeignKey
ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
