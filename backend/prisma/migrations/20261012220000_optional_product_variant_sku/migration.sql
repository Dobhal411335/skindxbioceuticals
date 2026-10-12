-- Price/quantity offers no longer invent a SKU by default; allow NULL while keeping uniqueness for set values.
ALTER TABLE "product_variants" ALTER COLUMN "sku" DROP NOT NULL;
