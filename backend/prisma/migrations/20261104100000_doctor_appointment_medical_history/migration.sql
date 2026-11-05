-- Optional previous medical history image attachment on doctor appointment requests.
ALTER TABLE "doctor_appointments" ADD COLUMN "medical_history_image_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_appointments" ADD COLUMN "medical_history_image_public_id" TEXT NOT NULL DEFAULT '';
