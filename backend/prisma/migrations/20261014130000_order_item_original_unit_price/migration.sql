-- Snapshot original/list unit price on order lines for thank-you / history display.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "original_unit_price" DECIMAL(12,2);
