-- ========================================
-- LOCALE FILTERS MIGRATION
-- ========================================
-- Adds locale support for product descriptions and financial transformations
-- Includes automatic catalog assignment based on user geography and segments

BEGIN;

-- ========================================
-- STEP 1: CREATE LOCALE FRAMEWORK
-- ========================================

-- Locale definitions (language + country combinations)
CREATE TABLE IF NOT EXISTS averis_pricing.locales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- en_US, fr_CA, de_DE, es_MX
    language_code VARCHAR(3) NOT NULL, -- en, fr, de, es
    country_code VARCHAR(3) NOT NULL, -- US, CA, DE, MX
    region_id UUID NOT NULL REFERENCES averis_pricing.regions(id),
    currency_id UUID NOT NULL REFERENCES averis_pricing.currencies(id),
    name VARCHAR(255) NOT NULL, -- English (United States)
    native_name VARCHAR(255), -- English (United States)
    is_rtl BOOLEAN DEFAULT false, -- Right-to-left languages
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    number_format JSONB DEFAULT '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for locale table
CREATE INDEX IF NOT EXISTS idx_locales_code ON averis_pricing.locales(code);
CREATE INDEX IF NOT EXISTS idx_locales_region ON averis_pricing.locales(region_id);
CREATE INDEX IF NOT EXISTS idx_locales_language ON averis_pricing.locales(language_code);
CREATE INDEX IF NOT EXISTS idx_locales_country ON averis_pricing.locales(country_code);

-- ========================================
-- STEP 2: PRODUCT LOCALE CONTENT
-- ========================================

-- Locale-specific product descriptions and content
CREATE TABLE IF NOT EXISTS averis_pricing.product_locale_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES averis_pricing.products(id) ON DELETE CASCADE,
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id) ON DELETE CASCADE,
    
    -- Localized content
    name VARCHAR(500),
    description TEXT,
    short_description TEXT,
    marketing_copy TEXT,
    technical_specs JSONB DEFAULT '{}',
    features TEXT[],
    benefits TEXT[],
    
    -- SEO and metadata
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT[],
    
    -- Content metadata
    content_version INTEGER DEFAULT 1,
    reviewed_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    translation_status VARCHAR(50) DEFAULT 'pending' CHECK (translation_status IN ('pending', 'in_progress', 'review', 'approved', 'rejected')),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT unique_product_locale_content UNIQUE(product_id, locale_id)
);

-- Create indexes for product locale content
CREATE INDEX IF NOT EXISTS idx_product_locale_content_product ON averis_pricing.product_locale_content(product_id);
CREATE INDEX IF NOT EXISTS idx_product_locale_content_locale ON averis_pricing.product_locale_content(locale_id);
CREATE INDEX IF NOT EXISTS idx_product_locale_content_status ON averis_pricing.product_locale_content(translation_status);

-- ========================================
-- STEP 3: PRODUCT LOCALE FINANCIALS
-- ========================================

-- Locale-specific financial transformations and pricing
CREATE TABLE IF NOT EXISTS averis_pricing.product_locale_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES averis_pricing.products(id) ON DELETE CASCADE,
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id) ON DELETE CASCADE,
    
    -- Base financial data (in catalog's base currency)
    base_price DECIMAL(15,4) NOT NULL,
    base_cost DECIMAL(15,4),
    
    -- Currency conversion
    currency_conversion_rate DECIMAL(15,6) DEFAULT 1.0,
    conversion_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Locale-specific pricing
    local_price DECIMAL(15,4), -- After conversion and adjustments
    local_cost DECIMAL(15,4),
    
    -- Tax and regulatory calculations
    tax_rate DECIMAL(8,4) DEFAULT 0.0000,
    tax_amount DECIMAL(15,4) DEFAULT 0.0000,
    tax_included_price DECIMAL(15,4),
    regulatory_fees DECIMAL(15,4) DEFAULT 0.0000,
    environmental_fees DECIMAL(15,4) DEFAULT 0.0000,
    
    -- Localization rules
    price_rounding_rules JSONB DEFAULT '{"type": "standard", "precision": 0.01, "direction": "nearest"}',
    display_format JSONB DEFAULT '{"show_tax_inclusive": false, "show_savings": true, "currency_symbol_position": "before"}',
    
    -- Promotional pricing
    promotional_price DECIMAL(15,4),
    promotion_start_date TIMESTAMP WITH TIME ZONE,
    promotion_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Validity and audit
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT unique_product_locale_catalog_financials UNIQUE(product_id, locale_id, catalog_id)
);

-- Create indexes for product locale financials
CREATE INDEX IF NOT EXISTS idx_product_locale_financials_product ON averis_pricing.product_locale_financials(product_id);
CREATE INDEX IF NOT EXISTS idx_product_locale_financials_locale ON averis_pricing.product_locale_financials(locale_id);
CREATE INDEX IF NOT EXISTS idx_product_locale_financials_catalog ON averis_pricing.product_locale_financials(catalog_id);
CREATE INDEX IF NOT EXISTS idx_product_locale_financials_effective ON averis_pricing.product_locale_financials(effective_from, effective_to);

-- ========================================
-- STEP 4: GEOGRAPHIC CATALOG ASSIGNMENT
-- ========================================

-- Country-to-region mapping for automatic catalog assignment
CREATE TABLE IF NOT EXISTS averis_pricing.country_region_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) NOT NULL, -- ISO 3166-1 alpha-2: US, CA, DE, FR
    country_name VARCHAR(255) NOT NULL,
    region_id UUID NOT NULL REFERENCES averis_pricing.regions(id),
    default_locale_code VARCHAR(10) NOT NULL,
    default_currency_id UUID REFERENCES averis_pricing.currencies(id),
    timezone VARCHAR(50), -- America/New_York, Europe/Berlin
    priority INTEGER DEFAULT 1, -- For countries that span regions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for country region mapping
CREATE INDEX IF NOT EXISTS idx_country_region_mapping_country ON averis_pricing.country_region_mapping(country_code);
CREATE INDEX IF NOT EXISTS idx_country_region_mapping_region ON averis_pricing.country_region_mapping(region_id);

-- ========================================
-- STEP 5: CATALOG ASSIGNMENT RULES
-- ========================================

-- Rules for automatic catalog assignment based on various criteria
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_assignment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('geo_default', 'user_segment', 'business_rules', 'fallback')),
    description TEXT,
    
    -- Geographic targeting
    region_id UUID REFERENCES averis_pricing.regions(id),
    country_codes TEXT[], -- ['US', 'CA'] for multi-country rules
    exclude_country_codes TEXT[], -- Countries to exclude
    
    -- User segment detection
    market_segment_code VARCHAR(10) DEFAULT 'Online',
    user_type VARCHAR(50), -- 'anonymous', 'authenticated', 'business'
    user_roles TEXT[], -- For authenticated users with specific roles
    customer_tier VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum'
    
    -- Business logic conditions
    min_order_value DECIMAL(15,2),
    company_size VARCHAR(50), -- 'small', 'medium', 'enterprise'
    industry_codes VARCHAR(10)[], -- Industry classifications
    
    -- Target assignment
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id),
    locale_code VARCHAR(10), -- Override default locale if needed
    
    -- Rule execution
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    is_default BOOLEAN DEFAULT false, -- True for fallback rules
    conditions_logic VARCHAR(10) DEFAULT 'AND' CHECK (conditions_logic IN ('AND', 'OR')),
    
    -- Validity
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for catalog assignment rules
CREATE INDEX IF NOT EXISTS idx_catalog_assignment_rules_region ON averis_pricing.catalog_assignment_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_catalog_assignment_rules_catalog ON averis_pricing.catalog_assignment_rules(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_assignment_rules_priority ON averis_pricing.catalog_assignment_rules(priority);
CREATE INDEX IF NOT EXISTS idx_catalog_assignment_rules_effective ON averis_pricing.catalog_assignment_rules(effective_from, effective_to);

-- ========================================
-- STEP 6: LOCALE TRANSFORMATION RULES
-- ========================================

-- Automated transformation rules for locale-specific content and pricing
CREATE TABLE IF NOT EXISTS averis_pricing.locale_transformation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('description', 'financial', 'regulatory', 'cultural')),
    
    -- Rule configuration
    source_field VARCHAR(255) NOT NULL, -- Which field to transform
    transformation_type VARCHAR(50) NOT NULL, -- 'translate', 'convert', 'format', 'calculate'
    transformation_logic JSONB NOT NULL, -- Detailed transformation rules
    
    -- Applicability filters
    applies_to_categories TEXT[], -- Product categories
    applies_to_brands TEXT[], -- Brand restrictions
    applies_to_price_range JSONB, -- {"min": 10.00, "max": 1000.00}
    
    -- Execution settings
    priority INTEGER DEFAULT 10,
    is_automatic BOOLEAN DEFAULT true, -- Auto-apply vs manual trigger
    requires_approval BOOLEAN DEFAULT false,
    
    -- Performance and caching
    cache_duration_hours INTEGER DEFAULT 24,
    batch_processing BOOLEAN DEFAULT false,
    
    -- Status and audit
    is_active BOOLEAN DEFAULT true,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for transformation rules
CREATE INDEX IF NOT EXISTS idx_locale_transformation_rules_locale ON averis_pricing.locale_transformation_rules(locale_id);
CREATE INDEX IF NOT EXISTS idx_locale_transformation_rules_type ON averis_pricing.locale_transformation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_locale_transformation_rules_priority ON averis_pricing.locale_transformation_rules(priority);

-- ========================================
-- STEP 7: ENHANCE CUSTOMER CONTEXT
-- ========================================

-- Add locale and catalog context to customer sessions
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'detected_country') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN detected_country VARCHAR(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'detected_region_id') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN detected_region_id UUID REFERENCES averis_pricing.regions(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'assigned_catalog_id') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN assigned_catalog_id UUID REFERENCES averis_pricing.catalogs(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'preferred_locale_code') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN preferred_locale_code VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'catalog_assignment_method') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN catalog_assignment_method VARCHAR(50) DEFAULT 'auto';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'averis_customer' AND table_name = 'customers' AND column_name = 'locale_preferences') THEN
        ALTER TABLE averis_customer.customers ADD COLUMN locale_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- ========================================
-- STEP 8: UTILITY FUNCTIONS
-- ========================================

-- Function to get default catalog for a user based on geography and profile
CREATE OR REPLACE FUNCTION get_default_catalog_for_user(
    user_country_code VARCHAR(3),
    user_type VARCHAR(50) DEFAULT 'anonymous',
    user_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    customer_tier VARCHAR(50) DEFAULT NULL
) RETURNS TABLE (
    catalog_id UUID,
    catalog_code VARCHAR(50),
    locale_code VARCHAR(10),
    assignment_method VARCHAR(50),
    region_code VARCHAR(10)
) AS $$
BEGIN
    -- Try to find specific rule match (highest priority first)
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        COALESCE(car.locale_code, crm.default_locale_code),
        'rule_based'::VARCHAR(50),
        r.code
    FROM averis_pricing.catalog_assignment_rules car
    JOIN averis_pricing.catalogs c ON c.id = car.catalog_id
    JOIN averis_pricing.regions r ON r.id = c.region_id
    LEFT JOIN averis_pricing.country_region_mapping crm ON crm.region_id = car.region_id AND crm.country_code = user_country_code
    WHERE car.is_active = true
        AND (car.country_codes IS NULL OR user_country_code = ANY(car.country_codes))
        AND (car.exclude_country_codes IS NULL OR NOT(user_country_code = ANY(car.exclude_country_codes)))
        AND (car.user_type IS NULL OR car.user_type = user_type)
        AND (car.user_roles IS NULL OR user_roles && car.user_roles)
        AND (car.customer_tier IS NULL OR car.customer_tier = customer_tier)
        AND (car.effective_from <= CURRENT_TIMESTAMP)
        AND (car.effective_to IS NULL OR car.effective_to >= CURRENT_TIMESTAMP)
    ORDER BY car.priority ASC
    LIMIT 1;
    
    -- If no rule found, use region + Online segment default
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            c.id,
            c.code,
            crm.default_locale_code,
            'geo_default'::VARCHAR(50),
            r.code
        FROM averis_pricing.country_region_mapping crm
        JOIN averis_pricing.catalogs c ON c.region_id = crm.region_id
        JOIN averis_pricing.market_segments ms ON ms.id = c.market_segment_id
        JOIN averis_pricing.regions r ON r.id = c.region_id
        WHERE crm.country_code = user_country_code
            AND ms.code = 'Online'
            AND c.is_active = true
            AND crm.is_active = true
        ORDER BY crm.priority ASC
        LIMIT 1;
    END IF;
    
    -- Ultimate fallback: first active Online catalog
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            c.id,
            c.code,
            'en_US'::VARCHAR(10),
            'fallback'::VARCHAR(50),
            r.code
        FROM averis_pricing.catalogs c
        JOIN averis_pricing.market_segments ms ON ms.id = c.market_segment_id
        JOIN averis_pricing.regions r ON r.id = c.region_id
        WHERE ms.code = 'Online'
            AND c.is_active = true
        ORDER BY c.created_at ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get localized product data
CREATE OR REPLACE FUNCTION get_localized_product(
    product_uuid UUID,
    locale_code_param VARCHAR(10),
    catalog_id_param UUID DEFAULT NULL
) RETURNS TABLE (
    product_id UUID,
    sku VARCHAR(255),
    name VARCHAR(500),
    description TEXT,
    localized_name VARCHAR(500),
    localized_description TEXT,
    localized_short_description TEXT,
    base_price DECIMAL(15,4),
    local_price DECIMAL(15,4),
    tax_included_price DECIMAL(15,4),
    currency_code VARCHAR(3),
    display_format JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.sku_code,
        p.name,
        p.description,
        COALESCE(plc.name, p.name) as localized_name,
        COALESCE(plc.description, p.description) as localized_description,
        plc.short_description as localized_short_description,
        plf.base_price,
        plf.local_price,
        plf.tax_included_price,
        cur.code as currency_code,
        COALESCE(plf.display_format, '{}') as display_format
    FROM averis_pricing.products p
    LEFT JOIN averis_pricing.locales l ON l.code = locale_code_param
    LEFT JOIN averis_pricing.product_locale_content plc ON plc.product_id = p.id AND plc.locale_id = l.id
    LEFT JOIN averis_pricing.product_locale_financials plf ON plf.product_id = p.id AND plf.locale_id = l.id 
        AND (catalog_id_param IS NULL OR plf.catalog_id = catalog_id_param)
    LEFT JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
    WHERE p.id = product_uuid
        AND p.is_active = true
        AND (plf.effective_from IS NULL OR plf.effective_from <= CURRENT_TIMESTAMP)
        AND (plf.effective_to IS NULL OR plf.effective_to >= CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ========================================
-- POST-MIGRATION SETUP
-- ========================================

-- After running this migration:
-- 1. Insert sample locale data
-- 2. Set up country-region mappings
-- 3. Create default catalog assignment rules
-- 4. Update API services to use new locale filtering
-- 5. Test locale-aware product retrieval