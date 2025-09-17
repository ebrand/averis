-- ========================================
-- COMPLIANCE AND DENIED PARTIES ENHANCEMENT
-- ========================================
-- Adds compliance screening for international trade regulations
-- Including denied parties lists, sanctions, and export controls

BEGIN;

-- Create compliance screening tables
CREATE TABLE IF NOT EXISTS averis_pricing.compliance_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL, -- OFAC SDN, EU Sanctions, etc.
    list_type VARCHAR(50) NOT NULL, -- DENIED_PARTY, SANCTIONS, EXPORT_CONTROL
    source_authority VARCHAR(100) NOT NULL, -- US Treasury OFAC, EU, UN, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- List metadata
    last_updated TIMESTAMPTZ,
    next_update_due TIMESTAMPTZ,
    update_frequency_days INTEGER DEFAULT 1, -- How often to refresh
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create denied parties entries
CREATE TABLE IF NOT EXISTS averis_pricing.denied_parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    compliance_list_id UUID NOT NULL REFERENCES averis_pricing.compliance_lists(id),
    
    -- Entity identification
    entity_name TEXT NOT NULL,
    entity_type VARCHAR(50), -- INDIVIDUAL, COMPANY, ORGANIZATION, VESSEL, etc.
    aliases TEXT[], -- Alternative names/spellings
    
    -- Geographic data
    country_codes CHAR(2)[], -- Countries associated with this entity
    addresses TEXT[], -- Known addresses
    
    -- Additional identifiers
    identification_numbers TEXT[], -- SSN, Tax ID, Registration numbers, etc.
    dates_of_birth DATE[], -- For individuals
    
    -- Screening metadata
    risk_level VARCHAR(20) DEFAULT 'HIGH', -- HIGH, MEDIUM, LOW
    screening_notes TEXT,
    
    -- Compliance data
    list_reference VARCHAR(100), -- External reference number
    effective_date DATE,
    expiry_date DATE, -- If applicable
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast screening lookups
CREATE INDEX idx_denied_parties_entity_name ON averis_pricing.denied_parties USING gin(entity_name gin_trgm_ops);
CREATE INDEX idx_denied_parties_aliases ON averis_pricing.denied_parties USING gin(aliases);
CREATE INDEX idx_denied_parties_countries ON averis_pricing.denied_parties USING gin(country_codes);
CREATE INDEX idx_denied_parties_active ON averis_pricing.denied_parties(is_active);
CREATE INDEX idx_denied_parties_list ON averis_pricing.denied_parties(compliance_list_id);

-- Country compliance profiles
CREATE TABLE IF NOT EXISTS averis_pricing.country_compliance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES averis_pricing.countries(code),
    
    -- Trade restrictions
    has_trade_sanctions BOOLEAN DEFAULT false,
    has_export_restrictions BOOLEAN DEFAULT false,
    requires_export_license BOOLEAN DEFAULT false,
    
    -- Screening requirements  
    requires_denied_party_screening BOOLEAN DEFAULT true,
    screening_threshold_amount DECIMAL(15,4), -- Minimum order value requiring screening
    
    -- Restricted product categories (if any)
    restricted_categories TEXT[], -- Product categories that cannot be shipped
    
    -- Risk assessment
    compliance_risk_level VARCHAR(20) DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    last_risk_assessment DATE,
    
    -- Regulatory notes
    regulatory_notes TEXT,
    special_requirements TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(country_code)
);

-- Compliance screening results log
CREATE TABLE IF NOT EXISTS averis_pricing.compliance_screenings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Screening context
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    order_id VARCHAR(255), -- External order reference
    
    -- Geographic context
    billing_country_code CHAR(2) REFERENCES averis_pricing.countries(code),
    shipping_country_code CHAR(2) REFERENCES averis_pricing.countries(code),
    
    -- Screening data
    customer_name TEXT,
    customer_address TEXT,
    screening_query TEXT, -- What was searched
    
    -- Results
    screening_status VARCHAR(20) NOT NULL, -- PASS, FAIL, REVIEW, PENDING
    matches_found INTEGER DEFAULT 0,
    risk_score INTEGER, -- 0-100 risk assessment
    
    -- Matches details (if any)
    matched_entities JSONB, -- Details of any matches found
    
    -- Decision data
    reviewed_by VARCHAR(255),
    review_notes TEXT,
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    screening_duration_ms INTEGER, -- Performance tracking
    api_provider VARCHAR(100), -- Which screening service was used
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for screening history and compliance reporting
CREATE INDEX idx_screenings_user ON averis_pricing.compliance_screenings(user_id);
CREATE INDEX idx_screenings_order ON averis_pricing.compliance_screenings(order_id);
CREATE INDEX idx_screenings_status ON averis_pricing.compliance_screenings(screening_status);
CREATE INDEX idx_screenings_shipping_country ON averis_pricing.compliance_screenings(shipping_country_code);
CREATE INDEX idx_screenings_created ON averis_pricing.compliance_screenings(created_at);

-- Enhanced user preferences with compliance context
ALTER TABLE averis_pricing.user_locale_preferences 
ADD COLUMN IF NOT EXISTS billing_country_id UUID REFERENCES averis_pricing.countries(id),
ADD COLUMN IF NOT EXISTS compliance_screening_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_screening_id UUID REFERENCES averis_pricing.compliance_screenings(id),
ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(20) DEFAULT 'UNKNOWN'; -- CLEARED, FLAGGED, PENDING, UNKNOWN

-- ========================================
-- POPULATE SAMPLE COMPLIANCE DATA
-- ========================================

-- Insert major compliance lists
INSERT INTO averis_pricing.compliance_lists (list_name, list_type, source_authority, description) VALUES
('OFAC SDN List', 'DENIED_PARTY', 'US Treasury OFAC', 'US Office of Foreign Assets Control Specially Designated Nationals List'),
('OFAC Consolidated Sanctions', 'SANCTIONS', 'US Treasury OFAC', 'US consolidated sanctions and blocked persons'),
('EU Consolidated List', 'SANCTIONS', 'European Union', 'EU consolidated list of persons, groups and entities subject to EU financial sanctions'),
('UN Security Council Sanctions', 'SANCTIONS', 'United Nations', 'UN Security Council consolidated sanctions list'),
('Commerce Entity List', 'EXPORT_CONTROL', 'US Department of Commerce', 'US Bureau of Industry and Security Entity List'),
('DDTC Debarred List', 'DENIED_PARTY', 'US State Department', 'US Directorate of Defense Trade Controls Debarred Parties List')

ON CONFLICT DO NOTHING;

-- Set country compliance profiles
INSERT INTO averis_pricing.country_compliance (
    country_code, 
    has_trade_sanctions, 
    has_export_restrictions, 
    requires_export_license,
    compliance_risk_level,
    regulatory_notes
) VALUES
-- High-risk countries (examples - not comprehensive)
('IR', true, true, true, 'HIGH', 'Subject to comprehensive US and EU sanctions'),
('KP', true, true, true, 'HIGH', 'Subject to UN and multilateral sanctions'),
('SY', true, true, true, 'HIGH', 'Subject to comprehensive sanctions'),

-- Medium-risk countries (require careful screening)
('RU', true, true, false, 'HIGH', 'Subject to sectoral sanctions and export controls'),
('CN', false, true, false, 'MEDIUM', 'Export controls on technology and dual-use items'),
('CU', true, false, false, 'MEDIUM', 'US trade embargo with limited exceptions'),

-- Standard compliance countries
('US', false, false, false, 'LOW', 'Standard US domestic commerce rules'),
('CA', false, false, false, 'LOW', 'Standard compliance requirements'),
('GB', false, false, false, 'LOW', 'Standard compliance requirements'),
('FR', false, false, false, 'LOW', 'Standard EU compliance requirements'),
('DE', false, false, false, 'LOW', 'Standard EU compliance requirements'),
('JP', false, false, false, 'LOW', 'Standard compliance requirements'),
('AU', false, false, false, 'LOW', 'Standard compliance requirements'),
('SG', false, false, false, 'LOW', 'Standard compliance requirements'),
('BR', false, false, false, 'MEDIUM', 'Standard compliance with import restrictions'),
('MX', false, false, false, 'LOW', 'Standard compliance requirements')

ON CONFLICT (country_code) DO UPDATE SET
    has_trade_sanctions = EXCLUDED.has_trade_sanctions,
    has_export_restrictions = EXCLUDED.has_export_restrictions,
    compliance_risk_level = EXCLUDED.compliance_risk_level,
    regulatory_notes = EXCLUDED.regulatory_notes,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- COMPLIANCE FUNCTIONS
-- ========================================

-- Function to check if shipping to a country requires compliance screening
CREATE OR REPLACE FUNCTION requires_compliance_screening(
    shipping_country_code CHAR(2),
    order_value DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    country_compliance RECORD;
BEGIN
    SELECT * INTO country_compliance
    FROM averis_pricing.country_compliance cc
    WHERE cc.country_code = shipping_country_code
    AND cc.is_active = true;
    
    -- If no compliance profile, default to requiring screening
    IF country_compliance IS NULL THEN
        RETURN true;
    END IF;
    
    -- Always screen for high-risk countries
    IF country_compliance.compliance_risk_level = 'HIGH' THEN
        RETURN true;
    END IF;
    
    -- Check if order value exceeds threshold
    IF order_value IS NOT NULL AND country_compliance.screening_threshold_amount IS NOT NULL THEN
        RETURN order_value >= country_compliance.screening_threshold_amount;
    END IF;
    
    -- Default to the country's screening requirement
    RETURN country_compliance.requires_denied_party_screening;
END;
$$ LANGUAGE plpgsql;

-- Function to perform basic denied party screening (mock implementation)
CREATE OR REPLACE FUNCTION screen_denied_parties(
    customer_name TEXT,
    customer_address TEXT DEFAULT NULL,
    shipping_country CHAR(2) DEFAULT NULL
)
RETURNS TABLE(
    screening_passed BOOLEAN,
    matches_found INTEGER,
    risk_score INTEGER,
    screening_details JSONB
) AS $$
DECLARE
    match_count INTEGER := 0;
    risk_score_val INTEGER := 0;
    details JSONB := '{}';
BEGIN
    -- Simple fuzzy matching against denied parties
    -- In production, this would use sophisticated matching algorithms
    SELECT COUNT(*)
    INTO match_count
    FROM averis_pricing.denied_parties dp
    WHERE dp.is_active = true
    AND (
        similarity(LOWER(dp.entity_name), LOWER(customer_name)) > 0.7
        OR customer_name ILIKE '%' || dp.entity_name || '%'
        OR dp.aliases && ARRAY[customer_name]
        OR (shipping_country = ANY(dp.country_codes))
    );
    
    -- Calculate risk score
    risk_score_val := CASE 
        WHEN match_count > 0 THEN 95
        WHEN shipping_country IN ('IR', 'KP', 'SY') THEN 75
        WHEN shipping_country IN ('RU', 'CU') THEN 50
        ELSE 5
    END;
    
    -- Build response details
    details := jsonb_build_object(
        'customer_name', customer_name,
        'shipping_country', shipping_country,
        'screening_timestamp', CURRENT_TIMESTAMP,
        'algorithm_version', '1.0'
    );
    
    RETURN QUERY
    SELECT 
        (match_count = 0 AND risk_score_val < 75), -- screening_passed
        match_count, -- matches_found
        risk_score_val, -- risk_score
        details; -- screening_details
END;
$$ LANGUAGE plpgsql;

-- Enhanced locale selection with compliance checking
CREATE OR REPLACE FUNCTION get_locale_with_compliance_check(
    user_id_param VARCHAR(255) DEFAULT NULL,
    session_id_param VARCHAR(255) DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    shipping_country_code CHAR(2) DEFAULT NULL,
    order_value DECIMAL DEFAULT NULL
)
RETURNS TABLE(
    country_code CHAR(2),
    locale_code VARCHAR(10),
    locale_id UUID,
    is_detected BOOLEAN,
    is_overridden BOOLEAN,
    compliance_screening_required BOOLEAN,
    compliance_risk_level VARCHAR(20),
    can_ship_to_country BOOLEAN,
    compliance_notes TEXT
) AS $$
DECLARE
    effective_country CHAR(2);
    effective_locale UUID;
    user_pref RECORD;
    compliance_info RECORD;
    screening_required BOOLEAN := false;
BEGIN
    -- Get user's effective locale using existing function
    SELECT * INTO user_pref FROM get_effective_locale_for_user(
        user_id_param, session_id_param, ip_address_param
    ) LIMIT 1;
    
    effective_country := COALESCE(shipping_country_code, user_pref.country_code);
    
    -- Get compliance information for the shipping country
    SELECT 
        cc.compliance_risk_level,
        cc.has_trade_sanctions,
        cc.regulatory_notes,
        NOT cc.has_trade_sanctions as can_ship
    INTO compliance_info
    FROM averis_pricing.country_compliance cc
    WHERE cc.country_code = effective_country;
    
    -- Check if screening is required
    screening_required := requires_compliance_screening(effective_country, order_value);
    
    RETURN QUERY
    SELECT 
        user_pref.country_code,
        user_pref.locale_code,
        user_pref.locale_id,
        user_pref.is_detected,
        user_pref.is_overridden,
        screening_required,
        COALESCE(compliance_info.compliance_risk_level, 'MEDIUM'),
        COALESCE(compliance_info.can_ship, true),
        compliance_info.regulatory_notes;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show compliance-enhanced country information
SELECT 
    'Country Compliance Overview' as summary,
    c.code as country,
    c.name as country_name,
    r.code as region,
    cc.compliance_risk_level,
    cc.has_trade_sanctions,
    cc.has_export_restrictions,
    cc.requires_denied_party_screening,
    cc.regulatory_notes
FROM averis_pricing.countries c
JOIN averis_pricing.regions r ON r.id = c.region_id
LEFT JOIN averis_pricing.country_compliance cc ON cc.country_code = c.code
WHERE c.is_active = true
ORDER BY 
    cc.compliance_risk_level DESC NULLS LAST,
    c.name;

-- Show high-risk shipping destinations
SELECT 
    'High-Risk Shipping Destinations' as summary,
    c.code as country,
    c.name as country_name,
    cc.compliance_risk_level,
    cc.regulatory_notes
FROM averis_pricing.countries c
JOIN averis_pricing.country_compliance cc ON cc.country_code = c.code
WHERE cc.compliance_risk_level = 'HIGH'
AND c.is_active = true
ORDER BY c.name;

-- Test compliance screening function
SELECT 
    'Sample Compliance Screening Test' as summary,
    * 
FROM screen_denied_parties('Test Customer', '123 Main St', 'US');

-- Test locale with compliance
SELECT 
    'Locale Selection with Compliance' as summary,
    *
FROM get_locale_with_compliance_check(
    'user123', 
    NULL, 
    '192.168.1.1'::INET, 
    'RU', 
    5000.00
);