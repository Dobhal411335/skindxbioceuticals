-- Careers page job applications and résumé metadata.

CREATE TYPE "CareerApplicationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED');

CREATE TABLE "career_applications" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL,
    "birth_month" INTEGER NOT NULL,
    "birth_day" INTEGER NOT NULL,
    "birth_year" INTEGER NOT NULL,
    "street_address" TEXT NOT NULL,
    "street_address_line_2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "linked_in" TEXT NOT NULL DEFAULT '',
    "position_applied" TEXT NOT NULL,
    "heard_about" TEXT NOT NULL,
    "available_start_date" DATE NOT NULL,
    "resume_url" TEXT NOT NULL,
    "resume_public_id" TEXT NOT NULL,
    "resume_file_name" TEXT NOT NULL,
    "resume_mime_type" TEXT NOT NULL,
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "career_applications_site_id_status_idx" ON "career_applications"("site_id", "status");
CREATE INDEX "career_applications_site_id_created_at_idx" ON "career_applications"("site_id", "created_at");
CREATE INDEX "career_applications_site_id_email_idx" ON "career_applications"("site_id", "email");

ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
