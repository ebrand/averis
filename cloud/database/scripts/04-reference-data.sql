-- ========================================
-- AVERIS DATABASE: REFERENCE DATA
-- ========================================
-- Loads essential reference data required by all Averis systems

-- ========================================
-- GEOGRAPHIC REGIONS
-- ========================================
INSERT INTO averis_pricing.regions (id, code, name, description, is_active) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'AMER', 'Americas', 'North and South America regions', true),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'EMEA', 'Europe, Middle East & Africa', 'Europe, Middle East, and Africa regions', true),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'APAC', 'Asia Pacific', 'Asia Pacific regions', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- MARKET SEGMENTS (Sales Channels)
-- ========================================
INSERT INTO averis_pricing.market_segments (id, code, name, description, is_active) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001'::uuid, 'ENTERPRISE', 'Enterprise', 'Large enterprise customers', true),
    ('660e8400-e29b-41d4-a716-446655440002'::uuid, 'SMB', 'Small & Medium Business', 'Small and medium business customers', true),
    ('660e8400-e29b-41d4-a716-446655440003'::uuid, 'RETAIL', 'Retail', 'Retail channel customers', true),
    ('660e8400-e29b-41d4-a716-446655440004'::uuid, 'PARTNER', 'Partner Channel', 'Channel partner customers', true),
    ('660e8400-e29b-41d4-a716-446655440005'::uuid, 'DIRECT', 'Direct Sales', 'Direct sales channel', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- CURRENCIES
-- ========================================
INSERT INTO averis_pricing.currencies (id, code, name, symbol, decimal_places, is_active) VALUES 
    ('770e8400-e29b-41d4-a716-446655440001'::uuid, 'USD', 'US Dollar', '$', 2, true),
    ('770e8400-e29b-41d4-a716-446655440002'::uuid, 'EUR', 'Euro', '€', 2, true),
    ('770e8400-e29b-41d4-a716-446655440003'::uuid, 'GBP', 'British Pound', '£', 2, true),
    ('770e8400-e29b-41d4-a716-446655440004'::uuid, 'JPY', 'Japanese Yen', '¥', 0, true),
    ('770e8400-e29b-41d4-a716-446655440005'::uuid, 'CAD', 'Canadian Dollar', 'C$', 2, true),
    ('770e8400-e29b-41d4-a716-446655440006'::uuid, 'AUD', 'Australian Dollar', 'A$', 2, true),
    ('770e8400-e29b-41d4-a716-446655440007'::uuid, 'CHF', 'Swiss Franc', 'Fr', 2, true),
    ('770e8400-e29b-41d4-a716-446655440008'::uuid, 'CNY', 'Chinese Yuan', '¥', 2, true),
    ('770e8400-e29b-41d4-a716-446655440009'::uuid, 'INR', 'Indian Rupee', '₹', 2, true),
    ('770e8400-e29b-41d4-a716-446655440010'::uuid, 'RUB', 'Russian Ruble', '₽', 2, false)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    decimal_places = EXCLUDED.decimal_places,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- COUNTRIES
-- ========================================
INSERT INTO averis_pricing.countries (id, code, name, region_id, currency_id, is_active) VALUES 
    -- Americas
    ('880e8400-e29b-41d4-a716-446655440001'::uuid, 'US', 'United States', 
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440002'::uuid, 'CA', 'Canada', 
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440005'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440003'::uuid, 'MX', 'Mexico', 
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440004'::uuid, 'BR', 'Brazil', 
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid, true),
     
    -- EMEA
    ('880e8400-e29b-41d4-a716-446655440005'::uuid, 'GB', 'United Kingdom', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440003'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440006'::uuid, 'DE', 'Germany', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440007'::uuid, 'FR', 'France', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440008'::uuid, 'IT', 'Italy', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440009'::uuid, 'ES', 'Spain', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440010'::uuid, 'NL', 'Netherlands', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440011'::uuid, 'CH', 'Switzerland', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440007'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440012'::uuid, 'RU', 'Russia', 
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440010'::uuid, false),
     
    -- APAC
    ('880e8400-e29b-41d4-a716-446655440013'::uuid, 'JP', 'Japan', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440004'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440014'::uuid, 'CN', 'China', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440008'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440015'::uuid, 'AU', 'Australia', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440006'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440016'::uuid, 'IN', 'India', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440009'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440017'::uuid, 'SG', 'Singapore', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid, true),
    ('880e8400-e29b-41d4-a716-446655440018'::uuid, 'KR', 'South Korea', 
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region_id = EXCLUDED.region_id,
    currency_id = EXCLUDED.currency_id,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- PRODUCT CATEGORIES
-- ========================================
INSERT INTO averis_product.categories (id, parent_id, code, name, description, level, path, is_active) VALUES 
    -- Level 1 (Root categories)
    ('990e8400-e29b-41d4-a716-446655440001'::uuid, NULL, 'HARDWARE', 'Hardware', 'Physical hardware products', 1, '/HARDWARE', true),
    ('990e8400-e29b-41d4-a716-446655440002'::uuid, NULL, 'SOFTWARE', 'Software', 'Software products and licenses', 1, '/SOFTWARE', true),
    ('990e8400-e29b-41d4-a716-446655440003'::uuid, NULL, 'SERVICES', 'Services', 'Professional and support services', 1, '/SERVICES', true),
    
    -- Level 2 (Hardware subcategories)
    ('990e8400-e29b-41d4-a716-446655440004'::uuid, '990e8400-e29b-41d4-a716-446655440001'::uuid, 'COMPUTERS', 'Computers', 'Desktop and laptop computers', 2, '/HARDWARE/COMPUTERS', true),
    ('990e8400-e29b-41d4-a716-446655440005'::uuid, '990e8400-e29b-41d4-a716-446655440001'::uuid, 'NETWORKING', 'Networking', 'Network equipment and accessories', 2, '/HARDWARE/NETWORKING', true),
    ('990e8400-e29b-41d4-a716-446655440006'::uuid, '990e8400-e29b-41d4-a716-446655440001'::uuid, 'STORAGE', 'Storage', 'Storage devices and solutions', 2, '/HARDWARE/STORAGE', true),
    
    -- Level 2 (Software subcategories)
    ('990e8400-e29b-41d4-a716-446655440007'::uuid, '990e8400-e29b-41d4-a716-446655440002'::uuid, 'PRODUCTIVITY', 'Productivity', 'Productivity and office software', 2, '/SOFTWARE/PRODUCTIVITY', true),
    ('990e8400-e29b-41d4-a716-446655440008'::uuid, '990e8400-e29b-41d4-a716-446655440002'::uuid, 'SECURITY', 'Security', 'Security software and solutions', 2, '/SOFTWARE/SECURITY', true),
    ('990e8400-e29b-41d4-a716-446655440009'::uuid, '990e8400-e29b-41d4-a716-446655440002'::uuid, 'DEVELOPMENT', 'Development', 'Development tools and platforms', 2, '/SOFTWARE/DEVELOPMENT', true),
    
    -- Level 2 (Services subcategories)
    ('990e8400-e29b-41d4-a716-446655440010'::uuid, '990e8400-e29b-41d4-a716-446655440003'::uuid, 'CONSULTING', 'Consulting', 'Professional consulting services', 2, '/SERVICES/CONSULTING', true),
    ('990e8400-e29b-41d4-a716-446655440011'::uuid, '990e8400-e29b-41d4-a716-446655440003'::uuid, 'SUPPORT', 'Support', 'Technical support services', 2, '/SERVICES/SUPPORT', true),
    ('990e8400-e29b-41d4-a716-446655440012'::uuid, '990e8400-e29b-41d4-a716-446655440003'::uuid, 'TRAINING', 'Training', 'Training and education services', 2, '/SERVICES/TRAINING', true)
ON CONFLICT (code) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    path = EXCLUDED.path,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- DATA DICTIONARY ENTRIES
-- ========================================
INSERT INTO averis_system.data_dictionary (
    table_schema, table_name, column_name, display_name, description, data_type, is_required, maintenance_role, schemas_present
) VALUES 
    -- Product table columns
    ('averis_product', 'products', 'sku', 'SKU', 'Stock Keeping Unit - unique product identifier', 'VARCHAR(100)', true, 'product_marketing', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'name', 'Product Name', 'Display name of the product', 'VARCHAR(500)', true, 'product_marketing', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'description', 'Description', 'Detailed product description', 'TEXT', false, 'product_marketing', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'brand', 'Brand', 'Product brand name', 'VARCHAR(200)', false, 'product_marketing', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'manufacturer', 'Manufacturer', 'Product manufacturer', 'VARCHAR(200)', false, 'product_salesops', '["ProductMDM", "PricingMDM"]'),
    ('averis_product', 'products', 'category_id', 'Category', 'Product category classification', 'UUID', false, 'product_marketing', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'status', 'Status', 'Current product lifecycle status', 'VARCHAR(50)', true, 'product_launch', '["ProductMDM"]'),
    ('averis_product', 'products', 'is_active', 'Active Flag', 'Whether the product is currently active', 'BOOLEAN', true, 'product_launch', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    ('averis_product', 'products', 'available_flag', 'Available Flag', 'Whether the product is available for sale', 'BOOLEAN', true, 'product_salesops', '["ProductMDM", "PricingMDM", "Ecommerce"]'),
    
    -- Catalog table columns
    ('averis_pricing', 'catalogs', 'code', 'Catalog Code', 'Unique catalog identifier code', 'VARCHAR(50)', true, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'name', 'Catalog Name', 'Display name of the catalog', 'VARCHAR(200)', true, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'region_id', 'Region', 'Geographic region for this catalog', 'UUID', false, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'market_segment_id', 'Market Segment', 'Sales channel or market segment', 'UUID', false, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'currency_id', 'Currency', 'Base currency for catalog pricing', 'UUID', false, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'effective_from', 'Effective From', 'Date when catalog becomes effective', 'TIMESTAMP', false, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'effective_to', 'Effective To', 'Date when catalog expires', 'TIMESTAMP', false, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'status', 'Status', 'Current catalog status', 'VARCHAR(50)', true, 'catalog_amer', '["PricingMDM"]'),
    ('averis_pricing', 'catalogs', 'is_default', 'Default Catalog', 'Whether this is the default catalog for its scope', 'BOOLEAN', true, 'catalog_amer', '["PricingMDM"]'),
    
    -- Customer table columns
    ('averis_customer', 'customers', 'customer_number', 'Customer Number', 'Unique customer identifier', 'VARCHAR(50)', false, 'user_admin', '["CustomerMDM", "Ecommerce"]'),
    ('averis_customer', 'customers', 'first_name', 'First Name', 'Customer first name', 'VARCHAR(100)', false, 'user_admin', '["CustomerMDM", "Ecommerce"]'),
    ('averis_customer', 'customers', 'last_name', 'Last Name', 'Customer last name', 'VARCHAR(100)', false, 'user_admin', '["CustomerMDM", "Ecommerce"]'),
    ('averis_customer', 'customers', 'email', 'Email Address', 'Customer email address', 'VARCHAR(255)', false, 'user_admin', '["CustomerMDM", "Ecommerce"]'),
    ('averis_customer', 'customers', 'company_name', 'Company Name', 'Customer company name', 'VARCHAR(200)', false, 'user_admin', '["CustomerMDM", "Ecommerce"]'),
    ('averis_customer', 'customers', 'disclosure_level', 'Disclosure Level', 'Customer authentication and data disclosure level', 'VARCHAR(20)', true, 'user_admin', '["CustomerMDM"]')
ON CONFLICT (table_schema, table_name, column_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    data_type = EXCLUDED.data_type,
    is_required = EXCLUDED.is_required,
    maintenance_role = EXCLUDED.maintenance_role,
    schemas_present = EXCLUDED.schemas_present,
    updated_at = CURRENT_TIMESTAMP;