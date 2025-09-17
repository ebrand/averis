-- ========================================
-- AVERIS PLATFORM SCHEMA MIGRATION
-- ========================================
-- This migration renames all schemas to use averis_ prefix
-- and consolidates user management into averis_system

BEGIN;

-- ========================================
-- STEP 1: CREATE NEW SCHEMAS
-- ========================================

CREATE SCHEMA IF NOT EXISTS averis_system;
CREATE SCHEMA IF NOT EXISTS averis_customer;
CREATE SCHEMA IF NOT EXISTS averis_product;
CREATE SCHEMA IF NOT EXISTS averis_product_staging;
CREATE SCHEMA IF NOT EXISTS averis_pricing;
CREATE SCHEMA IF NOT EXISTS averis_ecomm;

-- ========================================
-- STEP 2: MIGRATE USERS TO AVERIS_SYSTEM
-- ========================================

-- Move and enhance the users table from customer_mdm to averis_system
CREATE TABLE averis_system.users (
    id SERIAL PRIMARY KEY,
    stytch_user_id VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Enhanced role management
    roles TEXT[] DEFAULT ARRAY['user'],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    
    -- Security & compliance
    last_login TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    
    -- User preferences and profile
    preferences JSONB DEFAULT '{}',
    profile_data JSONB DEFAULT '{}',
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Migrate existing user data if customer_mdm.users exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'customer_mdm' AND table_name = 'users') THEN
        INSERT INTO averis_system.users (
            stytch_user_id, first_name, last_name, email, roles, status,
            last_login, preferences, created_at, updated_at
        )
        SELECT 
            stytch_user_id, first_name, last_name, email, 
            -- Convert JSONB roles to TEXT[] if needed
            CASE 
                WHEN roles IS NULL THEN ARRAY['user']
                WHEN jsonb_typeof(roles) = 'array' THEN 
                    ARRAY(SELECT jsonb_array_elements_text(roles))
                ELSE ARRAY['user']
            END as roles,
            status, last_login, preferences, created_at, updated_at
        FROM customer_mdm.users;
        
        RAISE NOTICE 'Migrated % users from customer_mdm.users', (SELECT count(*) FROM customer_mdm.users);
    ELSE
        RAISE NOTICE 'No customer_mdm.users table found to migrate';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_averis_system_users_stytch ON averis_system.users(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_averis_system_users_email ON averis_system.users(email);
CREATE INDEX IF NOT EXISTS idx_averis_system_users_status ON averis_system.users(status);

-- Add update trigger
CREATE TRIGGER update_averis_system_users_updated_at 
    BEFORE UPDATE ON averis_system.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 3: CREATE AVERIS_CUSTOMER SCHEMA
-- ========================================

-- Customer lifecycle management with graduated disclosure
CREATE TABLE averis_customer.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Graduated disclosure tracking
    disclosure_level VARCHAR(20) DEFAULT 'cold' CHECK (disclosure_level IN ('cold', 'warm', 'hot')),
    visitor_flag BOOLEAN DEFAULT true,
    
    -- Cold level (anonymous visitor)
    visitor_cookie VARCHAR(255) UNIQUE,
    session_data JSONB DEFAULT '{}', -- Cart, preferences, telemetry
    
    -- Warm level (checkout/contact)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Hot level (authenticated customer)  
    stytch_user_id VARCHAR(255) UNIQUE, -- Links to Stytch for authentication
    email_verified BOOLEAN DEFAULT false,
    
    -- Customer data
    billing_address JSONB,
    shipping_addresses JSONB DEFAULT '[]',
    
    -- Business intelligence
    customer_segment VARCHAR(50),
    lifetime_value DECIMAL(15,2) DEFAULT 0.00,
    acquisition_channel VARCHAR(100),
    
    -- Privacy & consent
    marketing_consent BOOLEAN DEFAULT false,
    data_processing_consent BOOLEAN DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Lifecycle tracking
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_visitor_cookie ON averis_customer.customers(visitor_cookie);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_email ON averis_customer.customers(email);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_stytch ON averis_customer.customers(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_status ON averis_customer.customers(status);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_disclosure ON averis_customer.customers(disclosure_level);

-- Customer update trigger
CREATE TRIGGER update_averis_customer_customers_updated_at 
    BEFORE UPDATE ON averis_customer.customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 4: MIGRATE SCHEMA CONTENTS
-- ========================================

-- Function to migrate table data between schemas
CREATE OR REPLACE FUNCTION migrate_table_to_schema(
    source_schema TEXT,
    target_schema TEXT,
    table_name TEXT
) RETURNS void AS $$
BEGIN
    -- Check if source table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = source_schema AND table_name = table_name) THEN
        -- Create table in target schema with same structure
        EXECUTE format('CREATE TABLE %I.%I AS SELECT * FROM %I.%I', 
                      target_schema, table_name, source_schema, table_name);
        
        -- Copy constraints and indexes (simplified version)
        RAISE NOTICE 'Migrated table %s.%s to %s.%s', source_schema, table_name, target_schema, table_name;
    ELSE
        RAISE NOTICE 'Source table %s.%s does not exist, skipping migration', source_schema, table_name;
    END IF;
END $$ LANGUAGE plpgsql;

-- Migrate product_mdm -> averis_product
SELECT migrate_table_to_schema('product_mdm', 'averis_product', 'products');
SELECT migrate_table_to_schema('product_mdm', 'averis_product', 'categories');
SELECT migrate_table_to_schema('product_mdm', 'averis_product', 'attributes');
SELECT migrate_table_to_schema('product_mdm', 'averis_product', 'product_variants');

-- Move data_dictionary to averis_system
SELECT migrate_table_to_schema('product_mdm', 'averis_system', 'data_dictionary');

-- Migrate pricing_mdm -> averis_pricing
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'currencies');
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'regions');
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'market_segments');
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'catalogs');
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'catalog_products');
SELECT migrate_table_to_schema('pricing_mdm', 'averis_pricing', 'base_prices');

-- Migrate ecommerce -> averis_ecomm
SELECT migrate_table_to_schema('ecommerce', 'averis_ecomm', 'products');
SELECT migrate_table_to_schema('ecommerce', 'averis_ecomm', 'categories');

-- Migrate product_cache -> averis_product_staging (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'product_cache') THEN
        PERFORM migrate_table_to_schema('product_cache', 'averis_product_staging', 'products');
        RAISE NOTICE 'Migrated product_cache to averis_product_staging';
    END IF;
END $$;

-- ========================================
-- STEP 5: UPDATE SEARCH PATH
-- ========================================

-- Set new default search path for the database
ALTER DATABASE commerce_db SET search_path TO averis_system, averis_product, averis_pricing, averis_ecomm, averis_customer, averis_product_staging, public;

-- ========================================
-- STEP 6: CREATE SYSTEM TABLES
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

-- User-Customer correlation (for employees who are also customers)
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
-- POST-MIGRATION NOTES
-- ========================================

-- After this migration:
-- 1. Update all application configs to use new schema names
-- 2. Update API services to reference averis_system.users
-- 3. Remove old schema references from connection strings
-- 4. Test all services with new schema structure
-- 5. Drop old schemas once migration is verified

-- Schema mapping:
-- customer_mdm.users -> averis_system.users (migrated)
-- product_mdm.* -> averis_product.*
-- pricing_mdm.* -> averis_pricing.*
-- ecommerce.* -> averis_ecomm.*
-- product_cache.* -> averis_product_staging.*