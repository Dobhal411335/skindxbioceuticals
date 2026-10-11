-- Idempotent cleanup for environments that applied the earlier top-advertisement
-- create migration when items still had description / icon_key / order.

DROP INDEX IF EXISTS "top_advertisement_items_config_id_section_order_idx";

ALTER TABLE "top_advertisement_items" DROP COLUMN IF EXISTS "description";
ALTER TABLE "top_advertisement_items" DROP COLUMN IF EXISTS "icon_key";
ALTER TABLE "top_advertisement_items" DROP COLUMN IF EXISTS "order";

CREATE INDEX IF NOT EXISTS "top_advertisement_items_config_id_section_idx" ON "top_advertisement_items"("config_id", "section");
