-- Simplified Region-Locale Association Design
-- Eliminates the need for manual catalog-locale maintenance

-- 1. Enhanced region-locale association table
CREATE TABLE IF NOT EXISTS averis_pricing.region_locales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id UUID NOT NULL REFERENCES averis_pricing.regions(id),
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    
    -- Association metadata
    is_primary BOOLEAN DEFAULT false, -- Primary locale for the region
    is_fallback BOOLEAN DEFAULT false, -- Fallback when primary not available
    priority INTEGER DEFAULT 10, -- 1 = highest priority
    
    -- Automation settings (inherited by all catalogs in region)
    auto_translate BOOLEAN DEFAULT true,
    auto_currency_convert BOOLEAN DEFAULT true,
    require_human_review BOOLEAN DEFAULT false,
    
    -- Regional customizations
    market_segments TEXT[], -- Which market segments support this locale
    country_codes TEXT[], -- Which countries in region use this locale
    
    -- Quality and compliance
    content_approval_required BOOLEAN DEFAULT false,
    financial_approval_required BOOLEAN DEFAULT true,
    regulatory_compliance_level VARCHAR(50), -- strict, standard, relaxed
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    UNIQUE(region_id, locale_id)
);

-- 2. Function to get all locales for a catalog (through region inheritance)
CREATE OR REPLACE FUNCTION get_catalog_locales(catalog_id_param UUID)
RETURNS TABLE (
    locale_id UUID,
    locale_code VARCHAR(10),
    locale_name VARCHAR(255),
    currency_code VARCHAR(3),
    is_primary BOOLEAN,
    priority INTEGER,
    auto_translate BOOLEAN,
    auto_currency_convert BOOLEAN,
    market_segment_supported BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as locale_id,
        l.code as locale_code,
        l.name as locale_name,
        cur.code as currency_code,
        rl.is_primary,
        rl.priority,
        rl.auto_translate,
        rl.auto_currency_convert,
        (c.market_segment_id IS NULL OR 
         ms.code = ANY(rl.market_segments) OR 
         array_length(rl.market_segments, 1) IS NULL) as market_segment_supported
    FROM averis_pricing.catalogs c
    JOIN averis_pricing.region_locales rl ON rl.region_id = c.region_id
    JOIN averis_pricing.locales l ON l.id = rl.locale_id
    JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
    LEFT JOIN averis_pricing.market_segments ms ON ms.id = c.market_segment_id
    WHERE c.id = catalog_id_param
        AND rl.is_active = true
        AND l.is_active = true
        AND (rl.effective_from <= CURRENT_TIMESTAMP)
        AND (rl.effective_to IS NULL OR rl.effective_to >= CURRENT_TIMESTAMP)
    ORDER BY rl.priority ASC, rl.is_primary DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to automatically create localization jobs when product added to catalog
CREATE OR REPLACE FUNCTION auto_create_localization_jobs()
RETURNS TRIGGER AS $$
DECLARE
    catalog_locale RECORD;
    job_id UUID;
BEGIN
    -- When a product is added to a catalog, create localization jobs
    -- for all supported locales in that catalog's region
    
    FOR catalog_locale IN 
        SELECT * FROM get_catalog_locales(NEW.catalog_id)
        WHERE auto_translate = true OR auto_currency_convert = true
    LOOP
        -- Create translation job if auto_translate is enabled
        IF catalog_locale.auto_translate THEN
            INSERT INTO averis_pricing.translation_jobs (
                id, product_id, source_locale_id, target_locale_id,
                status, priority, human_review_required
            ) VALUES (
                uuid_generate_v4(),
                NEW.product_id,
                (SELECT id FROM averis_pricing.locales WHERE code = 'en_US'), -- Default source
                catalog_locale.locale_id,
                'pending',
                catalog_locale.priority,
                EXISTS(
                    SELECT 1 FROM averis_pricing.region_locales 
                    WHERE locale_id = catalog_locale.locale_id 
                    AND require_human_review = true
                )
            );
        END IF;
        
        -- Create currency conversion job if auto_currency_convert is enabled
        IF catalog_locale.auto_currency_convert THEN
            -- This would trigger currency conversion job creation
            -- (Implementation depends on your product-catalog association table)
            RAISE NOTICE 'Currency conversion job needed for product % locale %', 
                NEW.product_id, catalog_locale.locale_code;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Sample region-locale associations
INSERT INTO averis_pricing.region_locales (
    region_id, locale_id, is_primary, priority, auto_translate, auto_currency_convert, 
    market_segments, country_codes
) VALUES 
-- Americas region locales
((SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
 (SELECT id FROM averis_pricing.locales WHERE code = 'en_US'),
 true, 1, true, true, ARRAY['ONLINE', 'DIRECT', 'PARTNER'], ARRAY['US']),

-- EMEA region locales  
((SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
 (SELECT id FROM averis_pricing.locales WHERE code = 'fr_FR'),
 false, 2, true, true, ARRAY['ONLINE', 'RETAIL'], ARRAY['FR']),

((SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
 (SELECT id FROM averis_pricing.locales WHERE code = 'de_DE'),
 false, 3, true, true, ARRAY['ONLINE', 'DIRECT'], ARRAY['DE'])

ON CONFLICT (region_id, locale_id) DO UPDATE SET
    priority = EXCLUDED.priority,
    auto_translate = EXCLUDED.auto_translate,
    auto_currency_convert = EXCLUDED.auto_currency_convert,
    market_segments = EXCLUDED.market_segments,
    country_codes = EXCLUDED.country_codes,
    updated_at = CURRENT_TIMESTAMP;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_region_locales_region ON averis_pricing.region_locales(region_id);
CREATE INDEX IF NOT EXISTS idx_region_locales_locale ON averis_pricing.region_locales(locale_id);
CREATE INDEX IF NOT EXISTS idx_region_locales_priority ON averis_pricing.region_locales(priority);
CREATE INDEX IF NOT EXISTS idx_region_locales_active ON averis_pricing.region_locales(is_active, effective_from, effective_to);