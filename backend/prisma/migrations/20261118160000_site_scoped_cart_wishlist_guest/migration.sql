-- Dual-site commerce: cart, wishlist, and guest checkout sessions are per site.
-- Existing rows are backfilled to the IN site (previous hardcoded ecommerce scope).

-- Carts
ALTER TABLE "carts" ADD COLUMN "site_id" UUID;

UPDATE "carts" c
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'IN' AND c."site_id" IS NULL;

ALTER TABLE "carts" ALTER COLUMN "site_id" SET NOT NULL;

DROP INDEX IF EXISTS "carts_user_id_key";
CREATE UNIQUE INDEX "carts_user_id_site_id_key" ON "carts"("user_id", "site_id");
CREATE INDEX "carts_site_id_idx" ON "carts"("site_id");

ALTER TABLE "carts"
  ADD CONSTRAINT "carts_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Wishlists
ALTER TABLE "wishlists" ADD COLUMN "site_id" UUID;

UPDATE "wishlists" w
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'IN' AND w."site_id" IS NULL;

ALTER TABLE "wishlists" ALTER COLUMN "site_id" SET NOT NULL;

DROP INDEX IF EXISTS "wishlists_user_id_key";
CREATE UNIQUE INDEX "wishlists_user_id_site_id_key" ON "wishlists"("user_id", "site_id");
CREATE INDEX "wishlists_site_id_idx" ON "wishlists"("site_id");

ALTER TABLE "wishlists"
  ADD CONSTRAINT "wishlists_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Guest checkout sessions
ALTER TABLE "guest_checkout_sessions" ADD COLUMN "site_id" UUID;

UPDATE "guest_checkout_sessions" g
SET "site_id" = s."id"
FROM "sites" s
WHERE s."code" = 'IN' AND g."site_id" IS NULL;

ALTER TABLE "guest_checkout_sessions" ALTER COLUMN "site_id" SET NOT NULL;

CREATE INDEX "guest_checkout_sessions_site_id_idx" ON "guest_checkout_sessions"("site_id");

ALTER TABLE "guest_checkout_sessions"
  ADD CONSTRAINT "guest_checkout_sessions_site_id_fkey"
  FOREIGN KEY ("site_id") REFERENCES "sites"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
