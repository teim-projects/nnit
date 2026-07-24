-- Remove inventory from django_migrations table
DELETE FROM django_migrations WHERE app = 'inventory';

-- Drop inventory tables if they exist
DROP TABLE IF EXISTS amc_amcsparepart;
DROP TABLE IF EXISTS quotation_quotation_terms_conditions;
DROP TABLE IF EXISTS invoice_invoice_terms_conditions;
DROP TABLE IF EXISTS inventory_termsconditions;
DROP TABLE IF EXISTS inventory_termsconditiontype;
DROP TABLE IF EXISTS inventory_inventoryitem;
