-- ========================================
-- LOCALE FILTERS SAMPLE DATA
-- ========================================
-- Inserts sample data for locales, country mappings, and catalog assignment rules

BEGIN;

-- ========================================
-- STEP 1: INSERT SAMPLE LOCALES
-- ========================================

-- Ensure we have the required regions and currencies first
-- (These should exist from previous migrations, but adding for completeness)

-- Insert sample currencies if not exists
INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) VALUES
('USD', 'US Dollar', '$', 2, true),
('CAD', 'Canadian Dollar', 'CA$', 2, true),
('EUR', 'Euro', '€', 2, true),
('GBP', 'British Pound', '£', 2, true),
('MXN', 'Mexican Peso', '$', 2, true),
('JPY', 'Japanese Yen', '¥', 0, true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample regions if not exists
INSERT INTO averis_pricing.regions (code, name, description, is_active) VALUES
('AMER', 'Americas', 'North, Central and South America', true),
('EMEA', 'Europe, Middle East & Africa', 'European, Middle Eastern and African markets', true),
('APAC', 'Asia Pacific', 'Asian and Pacific markets', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample market segments including Online
INSERT INTO averis_pricing.market_segments (code, name, description, is_active) VALUES
('Online', 'Online Direct', 'Direct-to-consumer online sales', true),
('Partner', 'Partner Channel', 'Authorized partner resellers', true),
('Reseller', 'Reseller Channel', 'Third-party resellers', true),
('Enterprise', 'Enterprise Direct', 'Large enterprise accounts', true),
('Retail', 'Retail Channel', 'Physical retail locations', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample locales
INSERT INTO averis_pricing.locales (
    code, language_code, country_code, region_id, currency_id, 
    name, native_name, is_rtl, date_format, number_format, is_active
) VALUES
-- Americas
('en_US', 'en', 'US', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'),
    'English (United States)', 'English (United States)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('en_CA', 'en', 'CA', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CAD'),
    'English (Canada)', 'English (Canada)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('fr_CA', 'fr', 'CA', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CAD'),
    'French (Canada)', 'Français (Canada)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('es_MX', 'es', 'MX', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MXN'),
    'Spanish (Mexico)', 'Español (México)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- EMEA
('en_GB', 'en', 'GB', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'GBP'),
    'English (United Kingdom)', 'English (United Kingdom)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('de_DE', 'de', 'DE', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'German (Germany)', 'Deutsch (Deutschland)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('fr_FR', 'fr', 'FR', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'French (France)', 'Français (France)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

-- APAC
('ja_JP', 'ja', 'JP', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APAC'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'JPY'),
    'Japanese (Japan)', '日本語（日本）', false, 'YYYY/MM/DD',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true)

ON CONFLICT (code) DO NOTHING;

-- ========================================
-- STEP 2: COUNTRY-REGION MAPPINGS
-- ========================================

INSERT INTO averis_pricing.country_region_mapping (
    country_code, country_name, region_id, default_locale_code, 
    default_currency_id, timezone, priority, is_active
) VALUES
-- Americas
('US', 'United States', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 'en_US',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'), 'America/New_York', 1, true),
    
('CA', 'Canada', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 'en_CA',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CAD'), 'America/Toronto', 1, true),
    
('MX', 'Mexico', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 'es_MX',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MXN'), 'America/Mexico_City', 1, true),

-- EMEA
('GB', 'United Kingdom', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 'en_GB',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'GBP'), 'Europe/London', 1, true),
    
('DE', 'Germany', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 'de_DE',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'), 'Europe/Berlin', 1, true),
    
('FR', 'France', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 'fr_FR',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'), 'Europe/Paris', 1, true),

-- APAC
('JP', 'Japan', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APAC'), 'ja_JP',
    (SELECT id FROM averis_pricing.currencies WHERE code = 'JPY'), 'Asia/Tokyo', 1, true)

ON CONFLICT (country_code) DO NOTHING;

-- ========================================
-- STEP 3: CREATE SAMPLE CATALOGS
-- ========================================

-- Insert sample catalogs for each region + Online segment
INSERT INTO averis_pricing.catalogs (
    code, name, region_id, market_segment_id, currency_id, 
    effective_from, priority, status, is_active
) VALUES
('AMER_Online', 'Americas Online Catalog',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.market_segments WHERE code = 'Online'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'),
    CURRENT_TIMESTAMP, 1, 'active', true),

('EMEA_Online', 'Europe Online Catalog',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.market_segments WHERE code = 'Online'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    CURRENT_TIMESTAMP, 1, 'active', true),

('APAC_Online', 'Asia Pacific Online Catalog',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APAC'),
    (SELECT id FROM averis_pricing.market_segments WHERE code = 'Online'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'JPY'),
    CURRENT_TIMESTAMP, 1, 'active', true)

ON CONFLICT (code) DO NOTHING;

-- ========================================
-- STEP 4: CATALOG ASSIGNMENT RULES
-- ========================================

-- Geographic default rules (highest priority)
INSERT INTO averis_pricing.catalog_assignment_rules (
    rule_name, rule_type, region_id, country_codes, market_segment_code,
    user_type, catalog_id, priority, is_default, is_active
) VALUES
-- Americas rules
('US Default Online', 'geo_default', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 
    ARRAY['US'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'AMER_Online'),
    10, false, true),

('Canada Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    ARRAY['CA'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'AMER_Online'),
    10, false, true),

('Mexico Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    ARRAY['MX'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'AMER_Online'),
    10, false, true),

-- EMEA rules
('UK Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    ARRAY['GB'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'EMEA_Online'),
    10, false, true),

('Germany Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    ARRAY['DE'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'EMEA_Online'),
    10, false, true),

('France Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    ARRAY['FR'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'EMEA_Online'),
    10, false, true),

-- APAC rules
('Japan Default Online', 'geo_default',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APAC'),
    ARRAY['JP'], 'Online', 'anonymous',
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'APAC_Online'),
    10, false, true),

-- Ultimate fallback rule
('Global Fallback', 'fallback', NULL, NULL, 'Online', NULL,
    (SELECT id FROM averis_pricing.catalogs WHERE code = 'AMER_Online'),
    1000, true, true);

-- ========================================
-- STEP 5: SAMPLE LOCALE TRANSFORMATION RULES
-- ========================================

-- Currency conversion rules
INSERT INTO averis_pricing.locale_transformation_rules (
    rule_name, locale_id, rule_type, source_field, transformation_type,
    transformation_logic, priority, is_automatic, is_active
) VALUES
-- Currency formatting for different locales
('USD Format', 
    (SELECT id FROM averis_pricing.locales WHERE code = 'en_US'),
    'financial', 'price', 'format',
    '{"format": "$#,##0.00", "round_to": 0.01, "symbol_before": true}',
    10, true, true),

('EUR Format', 
    (SELECT id FROM averis_pricing.locales WHERE code = 'de_DE'),
    'financial', 'price', 'format',
    '{"format": "#.##0,00 €", "round_to": 0.01, "symbol_before": false}',
    10, true, true),

('CAD Format', 
    (SELECT id FROM averis_pricing.locales WHERE code = 'en_CA'),
    'financial', 'price', 'format',
    '{"format": "CA$#,##0.00", "round_to": 0.05, "symbol_before": true}',
    10, true, true),

-- Tax calculation rules
('US Sales Tax', 
    (SELECT id FROM averis_pricing.locales WHERE code = 'en_US'),
    'regulatory', 'tax_rate', 'calculate',
    '{"base_rate": 0.00, "variable_by_state": true, "tax_inclusive": false}',
    20, true, true),

('German VAT', 
    (SELECT id FROM averis_pricing.locales WHERE code = 'de_DE'),
    'regulatory', 'tax_rate', 'calculate',
    '{"base_rate": 0.19, "tax_inclusive": true, "vat_number_required": true}',
    20, true, true);

-- ========================================
-- STEP 6: SAMPLE LOCALIZED CONTENT
-- ========================================

-- Add sample localized content for existing products
-- (This assumes products exist from previous migrations)

DO $$
DECLARE
    sample_product_id UUID;
BEGIN
    -- Get a sample product ID (first active product)
    SELECT id INTO sample_product_id 
    FROM averis_pricing.products 
    WHERE is_active = true 
    LIMIT 1;
    
    IF sample_product_id IS NOT NULL THEN
        -- Insert sample localized content for different languages
        INSERT INTO averis_pricing.product_locale_content (
            product_id, locale_id, name, description, short_description,
            marketing_copy, translation_status, approved_at
        ) VALUES
        -- German localization
        (sample_product_id,
            (SELECT id FROM averis_pricing.locales WHERE code = 'de_DE'),
            'Premium Widget (DE)', 'Ein hochwertiges Widget für professionelle Anwendungen.',
            'Hochwertiges Widget', 'Das beste Widget auf dem Markt!',
            'approved', CURRENT_TIMESTAMP),
            
        -- French localization
        (sample_product_id,
            (SELECT id FROM averis_pricing.locales WHERE code = 'fr_FR'),
            'Widget Premium (FR)', 'Un widget de haute qualité pour les applications professionnelles.',
            'Widget de haute qualité', 'Le meilleur widget du marché!',
            'approved', CURRENT_TIMESTAMP),
            
        -- Japanese localization
        (sample_product_id,
            (SELECT id FROM averis_pricing.locales WHERE code = 'ja_JP'),
            'プレミアムウィジェット', 'プロフェッショナル用途のための高品質ウィジェット。',
            '高品質ウィジェット', '市場で最高のウィジェット！',
            'approved', CURRENT_TIMESTAMP)
        
        ON CONFLICT (product_id, locale_id) DO NOTHING;
        
        RAISE NOTICE 'Added sample localized content for product %', sample_product_id;
    ELSE
        RAISE NOTICE 'No products found to add localized content';
    END IF;
END $$;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Uncomment these to verify the data was inserted correctly

-- SELECT 'Locales' as table_name, count(*) as record_count FROM averis_pricing.locales
-- UNION ALL
-- SELECT 'Country Mappings', count(*) FROM averis_pricing.country_region_mapping
-- UNION ALL
-- SELECT 'Assignment Rules', count(*) FROM averis_pricing.catalog_assignment_rules
-- UNION ALL
-- SELECT 'Transformation Rules', count(*) FROM averis_pricing.locale_transformation_rules
-- UNION ALL
-- SELECT 'Localized Content', count(*) FROM averis_pricing.product_locale_content;

-- Test the catalog assignment function
-- SELECT * FROM get_default_catalog_for_user('US', 'anonymous');
-- SELECT * FROM get_default_catalog_for_user('DE', 'anonymous');
-- SELECT * FROM get_default_catalog_for_user('XX', 'anonymous'); -- Should use fallback