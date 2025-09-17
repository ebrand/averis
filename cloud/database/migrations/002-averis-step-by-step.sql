-- ========================================
-- AVERIS PLATFORM SCHEMA MIGRATION - STEP BY STEP
-- ========================================
-- Create schemas and core tables without complex migrations

-- ========================================
-- STEP 1: CREATE AVERIS SCHEMAS
-- ========================================

CREATE SCHEMA IF NOT EXISTS averis_system;
CREATE SCHEMA IF NOT EXISTS averis_customer;
CREATE SCHEMA IF NOT EXISTS averis_product;
CREATE SCHEMA IF NOT EXISTS averis_product_staging;
CREATE SCHEMA IF NOT EXISTS averis_pricing;
CREATE SCHEMA IF NOT EXISTS averis_ecomm;

\echo 'Created Averis schemas successfully'

-- ========================================
-- STEP 2: CREATE AVERIS_SYSTEM.USERS TABLE
-- ========================================

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

-- Create indexes
CREATE INDEX idx_averis_system_users_stytch ON averis_system.users(stytch_user_id);
CREATE INDEX idx_averis_system_users_email ON averis_system.users(email);
CREATE INDEX idx_averis_system_users_status ON averis_system.users(status);

-- Add update trigger
CREATE TRIGGER update_averis_system_users_updated_at 
    BEFORE UPDATE ON averis_system.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Created averis_system.users table'

-- ========================================
-- STEP 3: CREATE AVERIS_CUSTOMER.CUSTOMERS TABLE
-- ========================================

CREATE TABLE averis_customer.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Graduated disclosure tracking
    disclosure_level VARCHAR(20) DEFAULT 'cold' CHECK (disclosure_level IN ('cold', 'warm', 'hot')),
    visitor_flag BOOLEAN DEFAULT true,
    
    -- Cold level (anonymous visitor)
    visitor_cookie VARCHAR(255) UNIQUE,
    session_data JSONB DEFAULT '{}',
    
    -- Warm level (checkout/contact)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Hot level (authenticated customer)  
    stytch_user_id VARCHAR(255) UNIQUE,
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
CREATE INDEX idx_averis_customer_customers_visitor_cookie ON averis_customer.customers(visitor_cookie);
CREATE INDEX idx_averis_customer_customers_email ON averis_customer.customers(email);
CREATE INDEX idx_averis_customer_customers_stytch ON averis_customer.customers(stytch_user_id);
CREATE INDEX idx_averis_customer_customers_status ON averis_customer.customers(status);
CREATE INDEX idx_averis_customer_customers_disclosure ON averis_customer.customers(disclosure_level);

-- Customer update trigger
CREATE TRIGGER update_averis_customer_customers_updated_at 
    BEFORE UPDATE ON averis_customer.customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Created averis_customer.customers table'

-- ========================================
-- STEP 4: CREATE SYSTEM TABLES
-- ========================================

-- System audit log
CREATE TABLE averis_system.audit_logs (
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
CREATE TABLE averis_system.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Customer correlation (for employees who are also customers)
CREATE TABLE averis_system.user_customer_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES averis_system.users(id),
    customer_id UUID NOT NULL REFERENCES averis_customer.customers(id),
    correlation_type VARCHAR(50) DEFAULT 'employee_customer',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    UNIQUE(user_id, customer_id)
);

\echo 'Created system management tables'

-- ========================================
-- STEP 5: UPDATE SEARCH PATH
-- ========================================

ALTER DATABASE commerce_db SET search_path TO averis_system, averis_product, averis_pricing, averis_ecomm, averis_customer, averis_product_staging, public;

\echo 'Updated database search path'

\echo 'Averis schema foundation created successfully!'