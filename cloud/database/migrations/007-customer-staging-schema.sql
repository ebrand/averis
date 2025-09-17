-- ========================================
-- CUSTOMER STAGING SCHEMA MIGRATION
-- ========================================
-- Creates the customer staging schema and tables
-- to support customer data federation

BEGIN;

-- ========================================
-- CREATE CUSTOMER STAGING SCHEMA
-- ========================================

CREATE SCHEMA IF NOT EXISTS averis_customer_staging;

-- ========================================
-- CREATE CUSTOMER STAGING TABLES
-- ========================================

-- Customer staging table for federated customer data
CREATE TABLE averis_customer_staging.customers (
    id UUID PRIMARY KEY,
    
    -- Graduated disclosure tracking
    disclosure_level VARCHAR(20) DEFAULT 'cold' CHECK (disclosure_level IN ('cold', 'warm', 'hot')),
    visitor_flag BOOLEAN DEFAULT true,
    
    -- Cold level (anonymous visitor)
    visitor_cookie VARCHAR(255),
    session_data JSONB,
    
    -- Warm level (identified but not authenticated)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Hot level (fully authenticated)
    stytch_user_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    billing_address JSONB,
    shipping_addresses JSONB,
    
    -- Customer insights
    customer_segment VARCHAR(100),
    lifetime_value DECIMAL(10,2),
    acquisition_channel VARCHAR(100),
    
    -- Consent management
    marketing_consent BOOLEAN DEFAULT false,
    data_processing_consent BOOLEAN DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'deleted')),
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_staging_id ON averis_customer_staging.customers(id);
CREATE INDEX IF NOT EXISTS idx_customer_staging_email ON averis_customer_staging.customers(email);
CREATE INDEX IF NOT EXISTS idx_customer_staging_stytch ON averis_customer_staging.customers(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_staging_status ON averis_customer_staging.customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_staging_disclosure ON averis_customer_staging.customers(disclosure_level);
CREATE INDEX IF NOT EXISTS idx_customer_staging_visitor_cookie ON averis_customer_staging.customers(visitor_cookie);
CREATE INDEX IF NOT EXISTS idx_customer_staging_updated ON averis_customer_staging.customers(updated_at);

-- Create unique constraint on visitor_cookie where it's not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_staging_visitor_cookie_unique 
ON averis_customer_staging.customers(visitor_cookie) 
WHERE visitor_cookie IS NOT NULL;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON SCHEMA averis_customer_staging IS 'Customer staging schema for federated customer data synchronization';
COMMENT ON TABLE averis_customer_staging.customers IS 'Staging table for customer data synchronized from Customer MDM';
COMMENT ON COLUMN averis_customer_staging.customers.disclosure_level IS 'Customer data disclosure level: cold (anonymous), warm (identified), hot (authenticated)';
COMMENT ON COLUMN averis_customer_staging.customers.visitor_flag IS 'Indicates if this is still just a visitor (true) or an actual customer (false)';
COMMENT ON COLUMN averis_customer_staging.customers.visitor_cookie IS 'Unique cookie identifier for anonymous visitors';
COMMENT ON COLUMN averis_customer_staging.customers.session_data IS 'Session-related data in JSON format';

-- ========================================
-- UPDATE DATABASE SEARCH PATH
-- ========================================

-- Add customer staging to the search path
ALTER DATABASE commerce_db SET search_path TO 
averis_system, 
averis_product, 
averis_pricing, 
averis_ecomm, 
averis_customer, 
averis_product_staging,
averis_customer_staging,
public;

COMMIT;

-- Display success message
SELECT 'Customer staging schema and tables created successfully!' as result;