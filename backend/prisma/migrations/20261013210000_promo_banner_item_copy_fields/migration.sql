-- Promo banner tiles: mini heading, heading, and CTA button label.

ALTER TABLE "promo_banner_items" ADD COLUMN "mini_heading" TEXT NOT NULL DEFAULT '';

ALTER TABLE "promo_banner_items" ADD COLUMN "heading" TEXT NOT NULL DEFAULT '';

ALTER TABLE "promo_banner_items" ADD COLUMN "button_label" TEXT NOT NULL DEFAULT '';
