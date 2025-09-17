-- ========================================
-- CONSOLIDATED COMMERCE DATABASE INITIALIZATION
-- ========================================
-- This script creates all schemas and tables for:
-- 1. Product MDM (product_mdm schema)
-- 2. Pricing MDM (pricing_mdm schema)  
-- 3. E-commerce (ecommerce schema)
-- 4. Shared audit schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all schemas
CREATE SCHEMA IF NOT EXISTS averis_product;
CREATE SCHEMA IF NOT EXISTS averis_pricing;
CREATE SCHEMA IF NOT EXISTS averis_ecomm;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default search path
ALTER DATABASE commerce_db SET search_path TO product_mdm, pricing_mdm, ecommerce, public;

-- ========================================
-- SHARED TRIGGER FUNCTIONS
-- ========================================

-- Updated_at trigger function (shared across all schemas)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- PRODUCT MDM SCHEMA
-- ========================================

-- Product categories table
CREATE TABLE IF NOT EXISTS averis_product.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES averis_product.categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Product attributes table
CREATE TABLE IF NOT EXISTS averis_product.attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'date', 'json')),
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Products table - Complete schema with all API-required fields
CREATE TABLE IF NOT EXISTS averis_product.products (
    -- Core Product Information
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES averis_product.categories(id),
    brand VARCHAR(255),
    manufacturer VARCHAR(255),
    
    -- Product Classification
    type VARCHAR(100),
    categorization JSONB DEFAULT '[]',
    
    -- Pricing & Financial
    base_price DECIMAL(15,4) DEFAULT 0.00,
    cost_price DECIMAL(15,4) DEFAULT 0.00,
    
    -- License & Permissions
    license_required_flag BOOLEAN DEFAULT false,
    
    -- Seat-Based Pricing
    seat_based_pricing_flag BOOLEAN DEFAULT false,
    
    -- Sales & Marketing Flags
    web_display_flag BOOLEAN DEFAULT true,
    
    -- Tax & Accounting
    ava_tax_code VARCHAR(50),
    
    -- Operations & Fulfillment
    can_be_fulfilled_flag BOOLEAN DEFAULT true,
    
    -- Contract Management
    contract_item_flag BOOLEAN DEFAULT false,
    
    -- E-commerce Specific
    slug VARCHAR(255),
    long_description TEXT,
    
    -- System & Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'discontinued')),
    available_flag BOOLEAN DEFAULT true,
    pricing JSONB DEFAULT '[]',
    approvals JSONB DEFAULT '[]',
    
    -- Flexible attributes storage
    attributes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- System fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Product variants table
CREATE TABLE IF NOT EXISTS averis_product.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES averis_product.products(id) ON DELETE CASCADE,
    variant_sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    attributes JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Product MDM Users table (if not exists from previous setup)
CREATE TABLE IF NOT EXISTS averis_product.users (
    id SERIAL PRIMARY KEY,
    stytch_user_id VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Dictionary table - defines metadata for all product fields
CREATE TABLE IF NOT EXISTS averis_product.data_dictionary (
    id SERIAL PRIMARY KEY,
    column_name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Field requirements and validation
    required_for_active BOOLEAN DEFAULT false,
    max_length INTEGER,
    min_length INTEGER,
    validation_pattern TEXT,
    allowed_values JSONB,
    
    -- Maintenance and permissions
    maintenance_role VARCHAR(50) DEFAULT 'system',
    
    -- Schema presence flags
    in_product_mdm BOOLEAN DEFAULT false,
    in_pricing_mdm BOOLEAN DEFAULT false,
    in_ecommerce BOOLEAN DEFAULT false,
    
    -- Display and organization
    sort_order INTEGER DEFAULT 0,
    is_system_field BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    
    -- Standard audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system',
    updated_by VARCHAR(255) DEFAULT 'system'
);

-- ========================================
-- PRICING MDM SCHEMA
-- ========================================

-- Currencies table
CREATE TABLE IF NOT EXISTS averis_pricing.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Regions table
CREATE TABLE IF NOT EXISTS averis_pricing.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- AMER, EMEA, APAC
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_currency_id UUID REFERENCES averis_pricing.currencies(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Market segments table
CREATE TABLE IF NOT EXISTS averis_pricing.market_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- Direct, Partner, Reseller
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Catalogs table (Region + Market Segment combinations)
CREATE TABLE IF NOT EXISTS averis_pricing.catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- AMER_Direct, EMEA_Partner, etc.
    name VARCHAR(255) NOT NULL,
    region_id UUID NOT NULL REFERENCES averis_pricing.regions(id),
    market_segment_id UUID NOT NULL REFERENCES averis_pricing.market_segments(id),
    currency_id UUID NOT NULL REFERENCES averis_pricing.currencies(id),
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT unique_region_segment UNIQUE (region_id, market_segment_id)
);

-- Products table - synced from product-mdm via messaging
CREATE TABLE IF NOT EXISTS averis_pricing.products (
    -- Core product identification (synced from product-mdm)
    id UUID PRIMARY KEY, -- Same ID as product-mdm
    sku_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    brand VARCHAR(255),
    manufacturer VARCHAR(255),
    
    -- Pricing-relevant attributes
    unit_of_measure VARCHAR(50),
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length, width, height, unit}
    
    -- Product lifecycle status
    lifecycle_status VARCHAR(50) DEFAULT 'active' CHECK (lifecycle_status IN ('draft', 'active', 'inactive', 'discontinued')),
    
    -- Sync metadata
    source_system VARCHAR(50) DEFAULT 'product-mdm',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_version INTEGER DEFAULT 1,
    
    -- Standard audit fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system',
    updated_by VARCHAR(255) DEFAULT 'system'
);

-- Catalog products junction table  
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id),
    product_id UUID NOT NULL REFERENCES averis_pricing.products(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(catalog_id, product_id)
);

-- Base prices table - foundational pricing by catalog
CREATE TABLE IF NOT EXISTS averis_pricing.base_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id),
    product_id UUID NOT NULL REFERENCES averis_pricing.products(id),
    
    -- Pricing details
    list_price DECIMAL(15,4) NOT NULL,
    cost_price DECIMAL(15,4),
    margin_percentage DECIMAL(5,2),
    
    -- Quantity breaks
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,
    
    -- Temporal validity
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval')),
    approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard audit fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT unique_catalog_product_dates UNIQUE (catalog_id, product_id, effective_from)
);

-- Discount types table
CREATE TABLE IF NOT EXISTS averis_pricing.discount_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- VOLUME, SEASONAL, PROMOTIONAL, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN ('percentage', 'fixed_amount', 'tiered')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Pricing MDM Users table
CREATE TABLE IF NOT EXISTS averis_pricing.users (
    id SERIAL PRIMARY KEY,
    stytch_user_id VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- E-COMMERCE SCHEMA
-- ========================================

-- Categories for navigation and filtering
CREATE TABLE IF NOT EXISTS averis_ecomm.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES averis_ecomm.categories(id),
    slug VARCHAR(255) UNIQUE NOT NULL, -- For SEO-friendly URLs
    display_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table optimized for e-commerce display
CREATE TABLE IF NOT EXISTS averis_ecomm.products (
    -- Core product identification (synced from product-mdm)
    id UUID PRIMARY KEY, -- Same ID as product-mdm
    sku VARCHAR(255) UNIQUE NOT NULL,
    
    -- Display information
    name VARCHAR(500) NOT NULL,
    display_name VARCHAR(500), -- Marketing/display override
    short_description VARCHAR(1000),
    long_description TEXT,
    category_id UUID REFERENCES averis_ecomm.categories(id),
    
    -- E-commerce specific fields
    slug VARCHAR(255) UNIQUE, -- SEO-friendly URL
    brand VARCHAR(255),
    tags TEXT[], -- Array of tags for search/filtering
    
    -- Product specifications for display
    specifications JSONB DEFAULT '{}', -- Key technical specs
    features TEXT[], -- Array of feature bullets
    
    -- Media and assets
    primary_image_url TEXT,
    image_urls TEXT[], -- Array of product image URLs
    video_url TEXT,
    document_urls JSONB DEFAULT '{}', -- Manuals, datasheets, etc.
    
    -- Inventory and availability
    stock_status VARCHAR(50) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    backorder_allowed BOOLEAN DEFAULT false,
    expected_restock_date DATE,
    
    -- Product dimensions for shipping
    weight DECIMAL(10,3),
    length DECIMAL(10,2),
    width DECIMAL(10,2), 
    height DECIMAL(10,2),
    dimension_unit VARCHAR(10) DEFAULT 'cm',
    weight_unit VARCHAR(10) DEFAULT 'kg',
    
    -- Search and SEO
    search_keywords TEXT[],
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Product lifecycle
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'discontinued')),
    launch_date DATE,
    end_of_life_date DATE,
    
    -- Customer engagement
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Sync metadata
    source_system VARCHAR(50) DEFAULT 'product-mdm',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_version INTEGER DEFAULT 1,
    
    -- Standard audit fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system',
    updated_by VARCHAR(255) DEFAULT 'system'
);

-- Customer sessions for anonymous shopping
CREATE TABLE IF NOT EXISTS averis_ecomm.customer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID, -- NULL for anonymous sessions
    
    -- Session preferences
    region_code VARCHAR(10) DEFAULT 'AMER',
    channel_code VARCHAR(10) DEFAULT 'DIRECT',
    language_code VARCHAR(5) DEFAULT 'en',
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Session tracking
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT true
);

-- Shopping carts
CREATE TABLE IF NOT EXISTS averis_ecomm.shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES averis_ecomm.customer_sessions(id) ON DELETE CASCADE,
    
    -- Cart totals (will be calculated)
    item_count INTEGER DEFAULT 0,
    subtotal DECIMAL(15,4) DEFAULT 0.00,
    tax_amount DECIMAL(15,4) DEFAULT 0.00,
    shipping_amount DECIMAL(15,4) DEFAULT 0.00,
    discount_amount DECIMAL(15,4) DEFAULT 0.00,
    total_amount DECIMAL(15,4) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'USD',
    
    -- Cart lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- COMPREHENSIVE AUDIT SCHEMA
-- ========================================

-- Product audit log (Product MDM)
CREATE TABLE IF NOT EXISTS audit.product_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing audit log (Pricing MDM)
CREATE TABLE IF NOT EXISTS audit.pricing_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    ip_address INET
);

-- E-commerce audit log
CREATE TABLE IF NOT EXISTS audit.ecommerce_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    ip_address INET
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Product MDM indexes
CREATE INDEX IF NOT EXISTS idx_product_mdm_products_sku ON averis_product.products(sku);
CREATE INDEX IF NOT EXISTS idx_product_mdm_products_category ON averis_product.products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_mdm_products_status ON averis_product.products(status);
CREATE INDEX IF NOT EXISTS idx_product_mdm_products_brand ON averis_product.products(brand);
CREATE INDEX IF NOT EXISTS idx_product_mdm_variants_product_id ON averis_product.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_mdm_variants_sku ON averis_product.product_variants(variant_sku);
CREATE INDEX IF NOT EXISTS idx_product_mdm_categories_parent ON averis_product.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_mdm_users_stytch ON averis_product.users(stytch_user_id);

-- Pricing MDM indexes
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_products_sku ON averis_pricing.products(sku_code);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_products_lifecycle_status ON averis_pricing.products(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_products_sync ON averis_pricing.products(last_sync_at, source_system);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_catalogs_region_segment ON averis_pricing.catalogs(region_id, market_segment_id);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_catalogs_code ON averis_pricing.catalogs(code);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_base_prices_catalog_product ON averis_pricing.base_prices(catalog_id, product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_base_prices_effective_dates ON averis_pricing.base_prices(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_catalog_products_catalog ON averis_pricing.catalog_products(catalog_id);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_catalog_products_product ON averis_pricing.catalog_products(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_mdm_users_stytch ON averis_pricing.users(stytch_user_id);

-- E-commerce indexes
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_sku ON averis_ecomm.products(sku);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_category ON averis_ecomm.products(category_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_status ON averis_ecomm.products(status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_brand ON averis_ecomm.products(brand);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_stock_status ON averis_ecomm.products(stock_status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_rating ON averis_ecomm.products(rating_average);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_tags ON averis_ecomm.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_slug ON averis_ecomm.products(slug);
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_parent ON averis_ecomm.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_slug ON averis_ecomm.categories(slug);
CREATE INDEX IF NOT EXISTS idx_ecommerce_sessions_token ON averis_ecomm.customer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_ecommerce_carts_session ON averis_ecomm.shopping_carts(session_id);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_product_table_record ON audit.product_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_pricing_table_record ON audit.pricing_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_ecommerce_table_record ON audit.ecommerce_audit(table_name, record_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Apply updated_at triggers to Product MDM tables
CREATE TRIGGER update_product_mdm_categories_updated_at BEFORE UPDATE ON averis_product.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_mdm_attributes_updated_at BEFORE UPDATE ON averis_product.attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_mdm_products_updated_at BEFORE UPDATE ON averis_product.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_mdm_variants_updated_at BEFORE UPDATE ON averis_product.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_mdm_users_updated_at BEFORE UPDATE ON averis_product.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_mdm_data_dictionary_updated_at BEFORE UPDATE ON averis_product.data_dictionary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at triggers to Pricing MDM tables
CREATE TRIGGER update_pricing_mdm_currencies_updated_at BEFORE UPDATE ON averis_pricing.currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_regions_updated_at BEFORE UPDATE ON averis_pricing.regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_market_segments_updated_at BEFORE UPDATE ON averis_pricing.market_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_catalogs_updated_at BEFORE UPDATE ON averis_pricing.catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_products_updated_at BEFORE UPDATE ON averis_pricing.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_base_prices_updated_at BEFORE UPDATE ON averis_pricing.base_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_discount_types_updated_at BEFORE UPDATE ON averis_pricing.discount_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_catalog_products_updated_at BEFORE UPDATE ON averis_pricing.catalog_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_mdm_users_updated_at BEFORE UPDATE ON averis_pricing.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at triggers to E-commerce tables
CREATE TRIGGER update_ecommerce_categories_updated_at BEFORE UPDATE ON averis_ecomm.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ecommerce_products_updated_at BEFORE UPDATE ON averis_ecomm.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ecommerce_sessions_updated_at BEFORE UPDATE ON averis_ecomm.customer_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ecommerce_carts_updated_at BEFORE UPDATE ON averis_ecomm.shopping_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INITIAL REFERENCE DATA
-- ========================================

-- Insert default currencies for Pricing MDM
INSERT INTO averis_pricing.currencies (code, name, symbol) VALUES 
    ('USD', 'US Dollar', '$'),
    ('EUR', 'Euro', '€'),
    ('GBP', 'British Pound', '£'),
    ('JPY', 'Japanese Yen', '¥'),
    ('AUD', 'Australian Dollar', 'A$'),
    ('CAD', 'Canadian Dollar', 'C$')
ON CONFLICT (code) DO NOTHING;

-- Insert regions for Pricing MDM
INSERT INTO averis_pricing.regions (code, name, description, default_currency_id) VALUES 
    ('AMER', 'Americas', 'North and South America', (SELECT id FROM averis_pricing.currencies WHERE code = 'USD')),
    ('EMEA', 'Europe, Middle East & Africa', 'Europe, Middle East and Africa', (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR')),
    ('APAC', 'Asia Pacific', 'Asia Pacific region', (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'))
ON CONFLICT (code) DO NOTHING;

-- Insert market segments for Pricing MDM
INSERT INTO averis_pricing.market_segments (code, name, description) VALUES 
    ('DIRECT', 'Direct Sales', 'Direct to customer sales'),
    ('PARTNER', 'Partner Sales', 'Sales through channel partners'),
    ('RESELLER', 'Reseller', 'Sales through reseller network')
ON CONFLICT (code) DO NOTHING;

-- Insert default catalogs (Region + Market Segment combinations) for Pricing MDM
INSERT INTO averis_pricing.catalogs (code, name, region_id, market_segment_id, currency_id) 
SELECT 
    r.code || '_' || ms.code as code,
    r.name || ' ' || ms.name as name,
    r.id as region_id,
    ms.id as market_segment_id,
    r.default_currency_id as currency_id
FROM averis_pricing.regions r
CROSS JOIN averis_pricing.market_segments ms
ON CONFLICT (code) DO NOTHING;

-- Insert default discount types for Pricing MDM
INSERT INTO averis_pricing.discount_types (code, name, description, calculation_method) VALUES 
    ('VOLUME', 'Volume Discount', 'Discount based on quantity purchased', 'tiered'),
    ('SEASONAL', 'Seasonal Discount', 'Seasonal promotional discounts', 'percentage'),
    ('PROMOTIONAL', 'Promotional Discount', 'General promotional discounts', 'percentage'),
    ('CLEARANCE', 'Clearance Discount', 'Clearance and end-of-life discounts', 'percentage'),
    ('EARLY_PAYMENT', 'Early Payment Discount', 'Discount for early payment', 'percentage'),
    ('LOYALTY', 'Loyalty Discount', 'Customer loyalty program discounts', 'percentage')
ON CONFLICT (code) DO NOTHING;

-- Insert sample categories for E-commerce
INSERT INTO averis_ecomm.categories (name, description, slug, display_order) VALUES
    ('Electronics', 'Electronic devices and components', 'electronics', 1),
    ('Software', 'Software products and licenses', 'software', 2),
    ('Accessories', 'Product accessories and add-ons', 'accessories', 3),
    ('Services', 'Professional and support services', 'services', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert default user for Product MDM
INSERT INTO averis_product.users (stytch_user_id, first_name, last_name, email, roles) VALUES
    ('user-test-c7765655-24d8-4848-be8e-0f065b81cac6', 'Test', 'User', 'test@example.com', ARRAY['admin', 'product_manager'])
ON CONFLICT (stytch_user_id) DO NOTHING;

-- Insert default user for Pricing MDM  
INSERT INTO averis_pricing.users (stytch_user_id, first_name, last_name, email, roles) VALUES
    ('user-test-c7765655-24d8-4848-be8e-0f065b81cac6', 'Test', 'User', 'test@example.com', ARRAY['admin', 'pricing_manager'])
ON CONFLICT (stytch_user_id) DO NOTHING;

-- Insert sample data dictionary entries
INSERT INTO averis_product.data_dictionary (
    column_name, display_name, data_type, description, category,
    required_for_active, max_length, min_length, validation_pattern, allowed_values,
    maintenance_role, in_product_mdm, in_pricing_mdm, in_ecommerce,
    sort_order, is_system_field, is_editable
) VALUES
    -- Basic Information
    ('id', 'Product ID', 'UUID', 'Unique identifier for the product', 'Basic Information',
     true, null, null, null, null,
     'system', true, true, true,
     1, true, false),
    ('sku', 'SKU', 'VARCHAR', 'Stock Keeping Unit - unique product identifier for inventory', 'Basic Information',
     true, 100, 3, '^[A-Z0-9-]+$', null,
     'product_marketing', true, true, true,
     2, false, true),
    ('name', 'Product Name', 'VARCHAR', 'Official product name for marketing and sales', 'Basic Information',
     true, 255, 5, null, null,
     'product_marketing', true, true, true,
     3, false, true),
    ('description', 'Description', 'TEXT', 'Detailed product description for customer-facing content', 'Basic Information',
     true, 2000, 50, null, null,
     'product_marketing', true, false, true,
     4, false, true),
     
    -- Pricing Information  
    ('list_price', 'List Price', 'DECIMAL', 'Manufacturer suggested retail price', 'Pricing',
     true, null, null, '^[0-9]+\\.?[0-9]*$', null,
     'product_finance', false, true, true,
     10, false, true),
    ('cost_price', 'Cost Price', 'DECIMAL', 'Internal cost price for margin calculations', 'Pricing',
     true, null, null, '^[0-9]+\\.?[0-9]*$', null,
     'product_finance', false, true, false,
     11, false, true),
     
    -- Legal Information
    ('regulatory_status', 'Regulatory Status', 'VARCHAR', 'Current regulatory approval status', 'Legal & Compliance',
     true, 50, null, null, '["Approved", "Pending", "Under Review", "Rejected", "Not Required"]',
     'product_legal', true, false, false,
     20, false, true),
     
    -- Sales Information
    ('sales_channel', 'Sales Channel', 'VARCHAR', 'Primary sales channel for this product', 'Sales & Distribution',
     true, 100, null, null, '["Online", "Retail", "Wholesale", "Direct Sales", "Partner"]',
     'product_salesops', true, true, true,
     30, false, true),
     
    -- System Fields
    ('status', 'Status', 'VARCHAR', 'Current product status in the system', 'System',
     true, 50, null, null, '["Draft", "Active", "Inactive", "Discontinued"]',
     'system', true, true, true,
     100, true, false),
    ('created_at', 'Created Date', 'TIMESTAMP', 'Timestamp when the product was created', 'System',
     true, null, null, null, null,
     'system', true, false, false,
     101, true, false),
    ('updated_at', 'Last Updated', 'TIMESTAMP', 'Timestamp when the product was last modified', 'System',
     true, null, null, null, null,
     'system', true, false, false,
     102, true, false)
ON CONFLICT (column_name) DO NOTHING;

-- Add comments for clarity
COMMENT ON DATABASE commerce_db IS 'Consolidated commerce database with separate schemas for Product MDM, Pricing MDM, and E-commerce';
COMMENT ON SCHEMA product_mdm IS 'Product Master Data Management schema - authoritative product information';
COMMENT ON SCHEMA pricing_mdm IS 'Pricing Master Data Management schema - catalog pricing and promotions';
COMMENT ON SCHEMA ecommerce IS 'E-commerce schema - optimized for product display and shopping cart functionality';
COMMENT ON SCHEMA audit IS 'Audit schema - comprehensive audit logging across all domains';