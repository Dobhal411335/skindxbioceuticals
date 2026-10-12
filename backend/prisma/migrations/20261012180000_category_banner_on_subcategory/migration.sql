-- Banners now belong to subcategories (parent_id IS NOT NULL).
-- Clear leftover banners from root categories so storefront/admin semantics match.
UPDATE "categories"
SET
  "banner_url" = NULL,
  "banner_public_id" = NULL
WHERE "parent_id" IS NULL
  AND (
    "banner_url" IS NOT NULL
    OR ("banner_public_id" IS NOT NULL AND BTRIM("banner_public_id") <> '')
  );
