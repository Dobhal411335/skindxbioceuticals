-- Site-scope coupons: add site_id, backfill, unique (site_id, code)

ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "site_id" UUID;

UPDATE "coupons" c
SET "site_id" = s.id
FROM "sites" s
WHERE c."site_id" IS NULL
  AND s.code = 'IN';

UPDATE "coupons" c
SET "site_id" = s.id
FROM (
  SELECT id
  FROM "sites"
  ORDER BY "created_at" ASC
  LIMIT 1
) s
WHERE c."site_id" IS NULL;

DELETE FROM "coupons" WHERE "site_id" IS NULL;

ALTER TABLE "coupons" ALTER COLUMN "site_id" SET NOT NULL;

DROP INDEX IF EXISTS "coupons_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_site_id_code_key" ON "coupons"("site_id", "code");
CREATE INDEX IF NOT EXISTS "coupons_site_id_idx" ON "coupons"("site_id");
CREATE INDEX IF NOT EXISTS "coupons_site_id_is_active_idx" ON "coupons"("site_id", "is_active");

ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_site_id_fkey";
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
