-- Multiple specializations plus contact, location, and qualification details.
ALTER TABLE "doctor_profiles" ADD COLUMN "specializations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "doctor_profiles"
SET "specializations" = ARRAY["specialization"]
WHERE btrim("specialization") <> '';

ALTER TABLE "doctor_profiles" DROP COLUMN "specialization";

ALTER TABLE "doctor_profiles" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "education" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "degree" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "work_history" TEXT NOT NULL DEFAULT '';
ALTER TABLE "doctor_profiles" ADD COLUMN "work_days" TEXT NOT NULL DEFAULT '';
