-- ========================================
-- AVERIS PLATFORM SCHEMA MIGRATION (FIXED)
-- ========================================
-- This migration creates new schemas and migrates essential data
-- Focus on core schema creation and user migration only

BEGIN;

-- ========================================
-- STEP 1: VERIFY SUCCESSFUL USER MIGRATION
-- ========================================

-- Check that averis_system.users was created and populated
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM averis_system.users;
    RAISE NOTICE 'Found % users in averis_system.users', user_count;
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'No users found in averis_system.users - migration may have failed';
    END IF;
END $$;

-- ========================================
-- STEP 2: MIGRATE ESSENTIAL TABLES DIRECTLY
-- ========================================

-- Migrate product_mdm.products to averis_product.products
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'product_mdm' AND table_name = 'products') THEN
        DROP TABLE IF EXISTS averis_product.products CASCADE;
        EXECUTE 'CREATE TABLE averis_product.products AS SELECT * FROM product_mdm.products';
        RAISE NOTICE 'Migrated product_mdm.products to averis_product.products';
    END IF;
END $$;

-- Migrate product_mdm.categories to averis_product.categories  
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'product_mdm' AND table_name = 'categories') THEN
        DROP TABLE IF EXISTS averis_product.categories CASCADE;
        EXECUTE 'CREATE TABLE averis_product.categories AS SELECT * FROM product_mdm.categories';
        RAISE NOTICE 'Migrated product_mdm.categories to averis_product.categories';
    END IF;
END $$;

-- Migrate product_mdm.data_dictionary to averis_system.data_dictionary
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'product_mdm' AND table_name = 'data_dictionary') THEN
        DROP TABLE IF EXISTS averis_system.data_dictionary CASCADE;
        EXECUTE 'CREATE TABLE averis_system.data_dictionary AS SELECT * FROM product_mdm.data_dictionary';
        RAISE NOTICE 'Migrated product_mdm.data_dictionary to averis_system.data_dictionary';
    END IF;
END $$;

-- Migrate pricing tables
DO $$
BEGIN
    -- Catalogs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'pricing_mdm' AND table_name = 'catalogs') THEN
        DROP TABLE IF EXISTS averis_pricing.catalogs CASCADE;
        EXECUTE 'CREATE TABLE averis_pricing.catalogs AS SELECT * FROM pricing_mdm.catalogs';
        RAISE NOTICE 'Migrated pricing_mdm.catalogs to averis_pricing.catalogs';
    END IF;
    
    -- Catalog products
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'pricing_mdm' AND table_name = 'catalog_products') THEN
        DROP TABLE IF EXISTS averis_pricing.catalog_products CASCADE;
        EXECUTE 'CREATE TABLE averis_pricing.catalog_products AS SELECT * FROM pricing_mdm.catalog_products';
        RAISE NOTICE 'Migrated pricing_mdm.catalog_products to averis_pricing.catalog_products';
    END IF;
END $$;

-- Migrate ecommerce tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'ecommerce' AND table_name = 'products') THEN
        DROP TABLE IF EXISTS averis_ecomm.products CASCADE;
        EXECUTE 'CREATE TABLE averis_ecomm.products AS SELECT * FROM ecommerce.products';
        RAISE NOTICE 'Migrated ecommerce.products to averis_ecomm.products';
    END IF;
END $$;

-- ========================================
-- STEP 3: UPDATE SEARCH PATH
-- ========================================

ALTER DATABASE commerce_db SET search_path TO averis_system, averis_product, averis_pricing, averis_ecomm, averis_customer, averis_product_staging, public;

-- ========================================
-- STEP 4: CREATE ESSENTIAL SYSTEM TABLES
-- ========================================

-- System audit log
CREATE TABLE IF NOT EXISTS averis_system.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES averis_system.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings  
CREATE TABLE IF NOT EXISTS averis_system.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Customer correlation
CREATE TABLE IF NOT EXISTS averis_system.user_customer_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES averis_system.users(id),
    customer_id UUID NOT NULL REFERENCES averis_customer.customers(id),
    correlation_type VARCHAR(50) DEFAULT 'employee_customer',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    UNIQUE(user_id, customer_id)
);

COMMIT;

-- ========================================
-- VERIFY MIGRATION SUCCESS
-- ========================================
\echo 'Averis schema migration completed successfully!'
\echo 'Verifying migration results:'

SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname LIKE 'averis_%' 
ORDER BY schemaname, tablename;

\echo 'User migration summary:'
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users
FROM averis_system.users;