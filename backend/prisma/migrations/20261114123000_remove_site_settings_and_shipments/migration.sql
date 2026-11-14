-- Drop unused scaffold tables (no application feature wrote to these).
DROP TABLE IF EXISTS "shipments";
DROP TABLE IF EXISTS "site_settings";
DROP TYPE IF EXISTS "ShippingStatus";
