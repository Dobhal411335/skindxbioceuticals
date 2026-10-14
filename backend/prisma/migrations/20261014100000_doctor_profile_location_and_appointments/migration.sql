-- AlterTable: replace consultancy type with location fields
ALTER TABLE "doctor_profiles" ADD COLUMN "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';

ALTER TABLE "doctor_profiles" DROP COLUMN "consultancy_type";

DROP TYPE "DoctorConsultancyType";

ALTER TABLE "doctor_profiles" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "doctor_profiles" ALTER COLUMN "city" DROP DEFAULT;

-- CreateEnum
CREATE TYPE "DoctorAppointmentStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "doctor_appointments" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "problem" TEXT NOT NULL,
    "status" "DoctorAppointmentStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_appointments_site_id_scheduled_at_idx" ON "doctor_appointments"("site_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "doctor_appointments_site_id_doctor_id_scheduled_at_idx" ON "doctor_appointments"("site_id", "doctor_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "doctor_appointments_site_id_status_idx" ON "doctor_appointments"("site_id", "status");

-- AddForeignKey
ALTER TABLE "doctor_appointments" ADD CONSTRAINT "doctor_appointments_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_appointments" ADD CONSTRAINT "doctor_appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
