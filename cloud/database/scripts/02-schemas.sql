-- ========================================
-- AVERIS DATABASE: SCHEMA DEFINITIONS
-- ========================================
-- Creates all Averis schemas with proper ownership and permissions

-- Core system schema for platform-wide data
CREATE SCHEMA IF NOT EXISTS averis_system;
COMMENT ON SCHEMA averis_system IS 'Internal platform management - users, data dictionary, audit logs, system settings';

-- Customer domain schema
CREATE SCHEMA IF NOT EXISTS averis_customer;
COMMENT ON SCHEMA averis_customer IS 'Customer lifecycle management with graduated disclosure levels';

-- Product schemas (source of truth + staging)
CREATE SCHEMA IF NOT EXISTS averis_product;
COMMENT ON SCHEMA averis_product IS 'Product master data - authoritative source of truth';

CREATE SCHEMA IF NOT EXISTS averis_product_staging;
COMMENT ON SCHEMA averis_product_staging IS 'Read-optimized product cache for consumer systems';

-- Business domain schemas
CREATE SCHEMA IF NOT EXISTS averis_pricing;
COMMENT ON SCHEMA averis_pricing IS 'Pricing and catalog management system';

CREATE SCHEMA IF NOT EXISTS averis_ecomm;
COMMENT ON SCHEMA averis_ecomm IS 'Customer-facing e-commerce functionality';

CREATE SCHEMA IF NOT EXISTS averis_erp;
COMMENT ON SCHEMA averis_erp IS 'Enterprise resource planning functionality';

CREATE SCHEMA IF NOT EXISTS averis_oms;
COMMENT ON SCHEMA averis_oms IS 'Order management system functionality';

-- Customer staging schema for message processing
CREATE SCHEMA IF NOT EXISTS averis_customer_staging;
COMMENT ON SCHEMA averis_customer_staging IS 'Customer data staging for ingest processing';

-- Grant usage permissions on all schemas to postgres user (for development)
GRANT USAGE ON SCHEMA averis_system TO postgres;
GRANT USAGE ON SCHEMA averis_customer TO postgres;
GRANT USAGE ON SCHEMA averis_product TO postgres;
GRANT USAGE ON SCHEMA averis_product_staging TO postgres;
GRANT USAGE ON SCHEMA averis_pricing TO postgres;
GRANT USAGE ON SCHEMA averis_ecomm TO postgres;
GRANT USAGE ON SCHEMA averis_erp TO postgres;
GRANT USAGE ON SCHEMA averis_oms TO postgres;
GRANT USAGE ON SCHEMA averis_customer_staging TO postgres;

-- Grant all privileges on all schemas (for development environment)
GRANT ALL PRIVILEGES ON SCHEMA averis_system TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_customer TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_product TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_product_staging TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_pricing TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_ecomm TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_erp TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_oms TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA averis_customer_staging TO postgres;