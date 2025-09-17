-- ========================================
-- AVERIS DATABASE: TABLE DEFINITIONS
-- ========================================
-- Creates all tables with proper relationships and constraints

-- ========================================
-- AVERIS_SYSTEM SCHEMA TABLES
-- ========================================

-- System users table (internal employees/system accounts)
CREATE TABLE IF NOT EXISTS averis_system.users (
    id SERIAL PRIMARY KEY,
    stytch_user_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    roles JSONB DEFAULT '["user"]'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Data dictionary for system-wide metadata
CREATE TABLE IF NOT EXISTS averis_system.data_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_schema VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    maintenance_role VARCHAR(100),
    schemas_present JSONB DEFAULT '[]'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_schema, table_name, column_name)
);

-- System audit logs
CREATE TABLE IF NOT EXISTS averis_system.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_schema VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);

-- System messages for cross-service communication
CREATE TABLE IF NOT EXISTS averis_system.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(100) NOT NULL,
    source_system VARCHAR(100) NOT NULL,
    target_system VARCHAR(100),
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- AVERIS_CUSTOMER SCHEMA TABLES
-- ========================================

-- External customers with graduated disclosure levels
CREATE TABLE IF NOT EXISTS averis_customer.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stytch_user_id VARCHAR(255) UNIQUE,
    customer_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(200),
    disclosure_level VARCHAR(20) DEFAULT 'cold' CHECK (disclosure_level IN ('cold', 'warm', 'hot')),
    customer_data JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer staging for ingest processing
CREATE TABLE IF NOT EXISTS averis_customer_staging.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_customer_id UUID NOT NULL,
    customer_data JSONB NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- AVERIS_PRICING SCHEMA TABLES
-- ========================================

-- Geographic regions
CREATE TABLE IF NOT EXISTS averis_pricing.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market segments (sales channels)
CREATE TABLE IF NOT EXISTS averis_pricing.market_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Currencies
CREATE TABLE IF NOT EXISTS averis_pricing.currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Countries
CREATE TABLE IF NOT EXISTS averis_pricing.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    region_id UUID REFERENCES averis_pricing.regions(id),
    currency_id UUID REFERENCES averis_pricing.currencies(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing catalogs
CREATE TABLE IF NOT EXISTS averis_pricing.catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    region_id UUID REFERENCES averis_pricing.regions(id),
    market_segment_id UUID REFERENCES averis_pricing.market_segments(id),
    currency_id UUID REFERENCES averis_pricing.currencies(id),
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products in catalogs with pricing
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    base_price DECIMAL(15,4),
    list_price DECIMAL(15,4),
    currency_id UUID REFERENCES averis_pricing.currencies(id),
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    pricing_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(catalog_id, product_id)
);

-- Simplified products table for pricing context
CREATE TABLE IF NOT EXISTS averis_pricing.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    brand VARCHAR(200),
    manufacturer VARCHAR(200),
    category_path TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    is_active BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- AVERIS_PRODUCT SCHEMA TABLES (Master Data)
-- ========================================

-- Product categories hierarchy
CREATE TABLE IF NOT EXISTS averis_product.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES averis_product.categories(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT, -- Materialized path for hierarchy queries
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product attribute definitions
CREATE TABLE IF NOT EXISTS averis_product.attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'date', 'json')),
    validation_rules JSONB DEFAULT '{}'::jsonb,
    is_required BOOLEAN DEFAULT FALSE,
    category_id UUID REFERENCES averis_product.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main products table (system of record)
CREATE TABLE IF NOT EXISTS averis_product.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    type VARCHAR(100),
    categorization JSONB DEFAULT '[]'::jsonb,
    base_price DECIMAL(10,4) DEFAULT 0,
    cost_price DECIMAL(10,4) DEFAULT 0,
    license_required_flag BOOLEAN DEFAULT FALSE,
    seat_based_pricing_flag BOOLEAN DEFAULT FALSE,
    web_display_flag BOOLEAN DEFAULT FALSE,
    ava_tax_code VARCHAR(50),
    can_be_fulfilled_flag BOOLEAN DEFAULT FALSE,
    contract_item_flag BOOLEAN DEFAULT FALSE,
    slug VARCHAR(200) DEFAULT '',
    long_description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated', 'archived')),
    available_flag BOOLEAN DEFAULT TRUE,
    pricing JSONB DEFAULT '[]'::jsonb,
    approvals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(500) DEFAULT 'system',
    updated_by VARCHAR(500) DEFAULT 'system',
    synced_at TIMESTAMP WITH TIME ZONE,
    source_version VARCHAR(50) DEFAULT '1.0',
    
    -- Legacy fields for backward compatibility
    brand VARCHAR(200),
    manufacturer VARCHAR(200),
    category_id UUID REFERENCES averis_product.categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Workflow approval tracking
    marketing_approved BOOLEAN DEFAULT FALSE,
    marketing_approved_by INTEGER,
    marketing_approved_at TIMESTAMP WITH TIME ZONE,
    
    legal_approved BOOLEAN DEFAULT FALSE,
    legal_approved_by INTEGER,
    legal_approved_at TIMESTAMP WITH TIME ZONE,
    
    finance_approved BOOLEAN DEFAULT FALSE,
    finance_approved_by INTEGER,
    finance_approved_at TIMESTAMP WITH TIME ZONE,
    
    salesops_approved BOOLEAN DEFAULT FALSE,
    salesops_approved_by INTEGER,
    salesops_approved_at TIMESTAMP WITH TIME ZONE,
    
    contracts_approved BOOLEAN DEFAULT FALSE,
    contracts_approved_by INTEGER,
    contracts_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Flexible attributes as JSONB (legacy)
    attributes JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields (legacy)
    launched_by INTEGER,
    launched_at TIMESTAMP WITH TIME ZONE,
    
    -- Add check constraints
    CONSTRAINT ck_products_base_price_non_negative CHECK (base_price >= 0),
    CONSTRAINT ck_products_cost_price_non_negative CHECK (cost_price >= 0)
);

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS averis_product.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES averis_product.products(id) ON DELETE CASCADE,
    variant_sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(200) NOT NULL,
    variant_attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- AVERIS_PRODUCT_STAGING SCHEMA TABLES
-- ========================================

-- Staging categories (read-only copy)
CREATE TABLE IF NOT EXISTS averis_product_staging.categories (
    id UUID PRIMARY KEY,
    parent_id UUID,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staging products (read-optimized)
CREATE TABLE IF NOT EXISTS averis_product_staging.products (
    id UUID PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    type VARCHAR(100),
    categorization JSONB DEFAULT '[]'::jsonb,
    base_price DECIMAL(10,4) DEFAULT 0,
    cost_price DECIMAL(10,4) DEFAULT 0,
    license_required_flag BOOLEAN DEFAULT FALSE,
    seat_based_pricing_flag BOOLEAN DEFAULT FALSE,
    web_display_flag BOOLEAN DEFAULT FALSE,
    ava_tax_code VARCHAR(50),
    can_be_fulfilled_flag BOOLEAN DEFAULT FALSE,
    contract_item_flag BOOLEAN DEFAULT FALSE,
    slug VARCHAR(200) DEFAULT '',
    long_description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'deprecated', 'archived')),
    available_flag BOOLEAN DEFAULT TRUE,
    pricing JSONB DEFAULT '[]'::jsonb,
    approvals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(500) DEFAULT 'system',
    updated_by VARCHAR(500) DEFAULT 'system',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_version VARCHAR(50) DEFAULT '1.0',
    
    -- Legacy fields for backward compatibility
    brand VARCHAR(200),
    manufacturer VARCHAR(200),
    category_id UUID,
    category_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    launched_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- AVERIS_ECOMM SCHEMA TABLES
-- ========================================

-- E-commerce shopping carts
CREATE TABLE IF NOT EXISTS averis_ecomm.shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    session_id VARCHAR(255),
    cart_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- E-commerce orders
CREATE TABLE IF NOT EXISTS averis_ecomm.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID,
    customer_email VARCHAR(255),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    order_data JSONB DEFAULT '{}'::jsonb,
    total_amount DECIMAL(15,4),
    currency_code VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

-- System users trigger
CREATE TRIGGER update_averis_system_users_updated_at 
    BEFORE UPDATE ON averis_system.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data dictionary trigger
CREATE TRIGGER update_averis_system_data_dictionary_updated_at 
    BEFORE UPDATE ON averis_system.data_dictionary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Customers trigger
CREATE TRIGGER update_averis_customer_customers_updated_at 
    BEFORE UPDATE ON averis_customer.customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pricing tables triggers
CREATE TRIGGER update_averis_pricing_regions_updated_at 
    BEFORE UPDATE ON averis_pricing.regions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_market_segments_updated_at 
    BEFORE UPDATE ON averis_pricing.market_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_currencies_updated_at 
    BEFORE UPDATE ON averis_pricing.currencies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_countries_updated_at 
    BEFORE UPDATE ON averis_pricing.countries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_catalogs_updated_at 
    BEFORE UPDATE ON averis_pricing.catalogs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_catalog_products_updated_at 
    BEFORE UPDATE ON averis_pricing.catalog_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_pricing_products_updated_at 
    BEFORE UPDATE ON averis_pricing.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product tables triggers
CREATE TRIGGER update_averis_product_categories_updated_at 
    BEFORE UPDATE ON averis_product.categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_product_attributes_updated_at 
    BEFORE UPDATE ON averis_product.attributes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_product_products_updated_at 
    BEFORE UPDATE ON averis_product.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_product_product_variants_updated_at 
    BEFORE UPDATE ON averis_product.product_variants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- E-commerce triggers
CREATE TRIGGER update_averis_ecomm_shopping_carts_updated_at 
    BEFORE UPDATE ON averis_ecomm.shopping_carts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_averis_ecomm_orders_updated_at 
    BEFORE UPDATE ON averis_ecomm.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- System users indexes
CREATE INDEX IF NOT EXISTS idx_averis_system_users_stytch_user_id ON averis_system.users(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_averis_system_users_email ON averis_system.users(email);
CREATE INDEX IF NOT EXISTS idx_averis_system_users_status ON averis_system.users(status);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_stytch_user_id ON averis_customer.customers(stytch_user_id);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_email ON averis_customer.customers(email);
CREATE INDEX IF NOT EXISTS idx_averis_customer_customers_customer_number ON averis_customer.customers(customer_number);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalogs_code ON averis_pricing.catalogs(code);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalogs_region_id ON averis_pricing.catalogs(region_id);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalogs_status ON averis_pricing.catalogs(status);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalogs_is_active ON averis_pricing.catalogs(is_active);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalog_products_catalog_id ON averis_pricing.catalog_products(catalog_id);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_catalog_products_product_id ON averis_pricing.catalog_products(product_id);
CREATE INDEX IF NOT EXISTS idx_averis_pricing_products_sku ON averis_pricing.products(sku);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_averis_product_products_sku ON averis_product.products(sku);
CREATE INDEX IF NOT EXISTS idx_averis_product_products_status ON averis_product.products(status);
CREATE INDEX IF NOT EXISTS idx_averis_product_products_category_id ON averis_product.products(category_id);
CREATE INDEX IF NOT EXISTS idx_averis_product_products_brand ON averis_product.products(brand);

-- Product staging indexes
CREATE INDEX IF NOT EXISTS idx_averis_product_staging_products_sku ON averis_product_staging.products(sku);
CREATE INDEX IF NOT EXISTS idx_averis_product_staging_products_status ON averis_product_staging.products(status);

-- Set table permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_system TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_customer TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_customer_staging TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_pricing TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_product TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_product_staging TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_ecomm TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_erp TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA averis_oms TO postgres;