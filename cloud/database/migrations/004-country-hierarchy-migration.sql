-- ========================================
-- COUNTRY-BASED HIERARCHY ENHANCEMENT
-- ========================================
-- Adds countries as intermediate layer: Region → Country → Locale
-- Enables IP-based auto-detection and cross-region shopping

BEGIN;

-- Create countries table
CREATE TABLE IF NOT EXISTS averis_pricing.countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code CHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 (US, CA, FR, etc.)
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL, -- Country name in local language
    region_id UUID NOT NULL REFERENCES averis_pricing.regions(id),
    default_locale_id UUID, -- Will be set after locales are updated
    is_active BOOLEAN DEFAULT true,
    
    -- Geographic and detection data
    continent VARCHAR(20), -- For broader geographic grouping
    phone_prefix VARCHAR(10), -- +1, +33, +49, etc.
    
    -- E-commerce specific
    supports_shipping BOOLEAN DEFAULT true,
    supports_billing BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create index for faster lookups
CREATE INDEX idx_countries_region_id ON averis_pricing.countries(region_id);
CREATE INDEX idx_countries_code ON averis_pricing.countries(code);
CREATE INDEX idx_countries_active ON averis_pricing.countries(is_active);

-- Create IP ranges table for country detection
CREATE TABLE IF NOT EXISTS averis_pricing.ip_country_ranges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES averis_pricing.countries(code),
    ip_start INET NOT NULL, -- Start IP address range
    ip_end INET NOT NULL,   -- End IP address range
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata for debugging/monitoring
    provider VARCHAR(50), -- Data source: MaxMind, IP2Location, etc.
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for IP range lookups (critical for performance)
CREATE INDEX idx_ip_ranges_country ON averis_pricing.ip_country_ranges(country_code);
CREATE INDEX idx_ip_ranges_start ON averis_pricing.ip_country_ranges(ip_start);
CREATE INDEX idx_ip_ranges_end ON averis_pricing.ip_country_ranges(ip_end);
CREATE INDEX idx_ip_ranges_active ON averis_pricing.ip_country_ranges(is_active);

-- Add country_id to locales table
ALTER TABLE averis_pricing.locales 
ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES averis_pricing.countries(id);

-- Create index for locale-country relationships
CREATE INDEX IF NOT EXISTS idx_locales_country_id ON averis_pricing.locales(country_id);

-- Update locales to include priority within country (for default selection)
ALTER TABLE averis_pricing.locales 
ADD COLUMN IF NOT EXISTS priority_in_country INTEGER DEFAULT 100;

-- Create index for priority ordering
CREATE INDEX IF NOT EXISTS idx_locales_country_priority ON averis_pricing.locales(country_id, priority_in_country);

-- Add constraint to ensure unique priority per country (optional - allows ties)
-- ALTER TABLE averis_pricing.locales 
-- ADD CONSTRAINT uq_locale_country_priority UNIQUE(country_id, priority_in_country);

-- Create user session preferences table
CREATE TABLE IF NOT EXISTS averis_pricing.user_locale_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- External user ID or session ID
    session_id VARCHAR(255), -- For anonymous users
    
    -- Detected vs Chosen preferences
    detected_country_id UUID REFERENCES averis_pricing.countries(id),
    detected_ip_address INET,
    chosen_country_id UUID REFERENCES averis_pricing.countries(id),
    chosen_locale_id UUID REFERENCES averis_pricing.locales(id),
    
    -- Override flags
    country_overridden BOOLEAN DEFAULT false, -- User manually changed country
    locale_overridden BOOLEAN DEFAULT false,  -- User manually changed locale
    
    -- Shopping context (for cross-region purchases)
    shopping_country_id UUID REFERENCES averis_pricing.countries(id), -- Where they're buying
    shipping_country_id UUID REFERENCES averis_pricing.countries(id), -- Where they're shipping
    
    -- Session metadata
    user_agent TEXT,
    referrer TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Indexes for session lookups
CREATE INDEX idx_user_preferences_user ON averis_pricing.user_locale_preferences(user_id);
CREATE INDEX idx_user_preferences_session ON averis_pricing.user_locale_preferences(session_id);
CREATE INDEX idx_user_preferences_detected_country ON averis_pricing.user_locale_preferences(detected_country_id);
CREATE INDEX idx_user_preferences_expires ON averis_pricing.user_locale_preferences(expires_at);

-- ========================================
-- POPULATE SAMPLE COUNTRIES
-- ========================================

-- Insert major countries with their regions
INSERT INTO averis_pricing.countries (code, name, native_name, region_id, continent, phone_prefix, supports_shipping, supports_billing) VALUES
-- AMERICAS (AMER)
('US', 'United States', 'United States', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 
    'North America', '+1', true, true),
('CA', 'Canada', 'Canada', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 
    'North America', '+1', true, true),
('MX', 'Mexico', 'México', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'), 
    'North America', '+52', true, true),

-- EUROPE, MIDDLE EAST & AFRICA (EMEA)
('FR', 'France', 'France', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+33', true, true),
('DE', 'Germany', 'Deutschland', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+49', true, true),
('GB', 'United Kingdom', 'United Kingdom', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+44', true, true),
('IT', 'Italy', 'Italia', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+39', true, true),
('ES', 'Spain', 'España', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+34', true, true),
('CH', 'Switzerland', 'Schweiz/Suisse/Svizzera', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+41', true, true),
('BE', 'Belgium', 'België/Belgique', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+32', true, true),
('NL', 'Netherlands', 'Nederland', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+31', true, true),
('SE', 'Sweden', 'Sverige', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+46', true, true),
('NO', 'Norway', 'Norge', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+47', true, true),
('DK', 'Denmark', 'Danmark', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'), 
    'Europe', '+45', true, true),

-- ASIA PACIFIC & JAPAN (APJ)
('JP', 'Japan', '日本', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+81', true, true),
('CN', 'China', '中国', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+86', true, true),
('KR', 'South Korea', '대한민국', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+82', true, true),
('AU', 'Australia', 'Australia', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Oceania', '+61', true, true),
('SG', 'Singapore', 'Singapore', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+65', true, true),
('HK', 'Hong Kong', '香港', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+852', true, true),
('TW', 'Taiwan', '台灣', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+886', true, true),
('IN', 'India', 'भारत', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'), 
    'Asia', '+91', true, true),

-- LATIN AMERICA (LA)
('BR', 'Brazil', 'Brasil', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'), 
    'South America', '+55', true, true),
('AR', 'Argentina', 'Argentina', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'), 
    'South America', '+54', true, true),
('CL', 'Chile', 'Chile', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'), 
    'South America', '+56', true, true),
('PE', 'Peru', 'Perú', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'), 
    'South America', '+51', true, true),
('CO', 'Colombia', 'Colombia', 
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'), 
    'South America', '+57', true, true)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    native_name = EXCLUDED.native_name,
    region_id = EXCLUDED.region_id,
    continent = EXCLUDED.continent,
    phone_prefix = EXCLUDED.phone_prefix,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- UPDATE EXISTING LOCALES WITH COUNTRIES
-- ========================================

-- Map existing locales to their countries and set priorities
-- Priority 1 = primary/default locale for the country

-- United States
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'US'),
    priority_in_country = 1
WHERE code = 'en_US';

-- Canada (English is primary)
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CA'),
    priority_in_country = 1
WHERE code = 'en_CA';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CA'),
    priority_in_country = 2
WHERE code = 'fr_CA';

-- Mexico
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'MX'),
    priority_in_country = 1
WHERE code = 'es_MX';

-- France
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'FR'),
    priority_in_country = 1
WHERE code = 'fr_FR';

-- Germany
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'DE'),
    priority_in_country = 1
WHERE code = 'de_DE';

-- United Kingdom
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'GB'),
    priority_in_country = 1
WHERE code = 'en_GB';

-- Italy
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'IT'),
    priority_in_country = 1
WHERE code = 'it_IT';

-- Spain
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'ES'),
    priority_in_country = 1
WHERE code = 'es_ES';

-- Switzerland (German is primary, but this is debatable)
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CH'),
    priority_in_country = 1
WHERE code = 'de_CH';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CH'),
    priority_in_country = 2
WHERE code = 'fr_CH';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CH'),
    priority_in_country = 3
WHERE code = 'it_CH';

-- Belgium (Flemish/Dutch is slightly more common than French)
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'BE'),
    priority_in_country = 1
WHERE code = 'nl_BE';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'BE'),
    priority_in_country = 2
WHERE code = 'fr_BE';

-- Continue for other countries...
UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'JP'),
    priority_in_country = 1
WHERE code = 'ja_JP';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'CN'),
    priority_in_country = 1
WHERE code = 'zh_CN';

UPDATE averis_pricing.locales 
SET country_id = (SELECT id FROM averis_pricing.countries WHERE code = 'BR'),
    priority_in_country = 1
WHERE code = 'pt_BR';

-- Set default locales for countries
UPDATE averis_pricing.countries 
SET default_locale_id = (
    SELECT l.id 
    FROM averis_pricing.locales l 
    WHERE l.country_id = averis_pricing.countries.id 
    AND l.priority_in_country = 1 
    LIMIT 1
);

-- ========================================
-- CREATE HELPER FUNCTIONS
-- ========================================

-- Function to detect country from IP address
CREATE OR REPLACE FUNCTION get_country_from_ip(ip_address INET)
RETURNS CHAR(2) AS $$
DECLARE
    country_code CHAR(2);
BEGIN
    SELECT icr.country_code 
    INTO country_code
    FROM averis_pricing.ip_country_ranges icr
    WHERE icr.ip_start <= ip_address 
    AND icr.ip_end >= ip_address
    AND icr.is_active = true
    ORDER BY (icr.ip_end - icr.ip_start) ASC -- Prefer more specific ranges
    LIMIT 1;
    
    RETURN COALESCE(country_code, 'US'); -- Default to US if not found
END;
$$ LANGUAGE plpgsql;

-- Function to get default locale for a country
CREATE OR REPLACE FUNCTION get_default_locale_for_country(country_code_param CHAR(2))
RETURNS UUID AS $$
DECLARE
    locale_id UUID;
BEGIN
    SELECT c.default_locale_id 
    INTO locale_id
    FROM averis_pricing.countries c
    WHERE c.code = country_code_param
    AND c.is_active = true;
    
    RETURN locale_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's effective locale (with overrides and cross-region shopping)
CREATE OR REPLACE FUNCTION get_effective_locale_for_user(
    user_id_param VARCHAR(255) DEFAULT NULL,
    session_id_param VARCHAR(255) DEFAULT NULL,
    ip_address_param INET DEFAULT NULL
)
RETURNS TABLE(
    country_code CHAR(2),
    locale_code VARCHAR(10),
    locale_id UUID,
    is_detected BOOLEAN,
    is_overridden BOOLEAN,
    shopping_country_code CHAR(2)
) AS $$
DECLARE
    user_pref RECORD;
    detected_country CHAR(2);
    effective_locale UUID;
BEGIN
    -- Try to find existing user preferences
    SELECT * INTO user_pref
    FROM averis_pricing.user_locale_preferences p
    WHERE (user_id_param IS NOT NULL AND p.user_id = user_id_param)
    OR (session_id_param IS NOT NULL AND p.session_id = session_id_param)
    AND p.is_active = true
    AND p.expires_at > CURRENT_TIMESTAMP
    ORDER BY p.updated_at DESC
    LIMIT 1;
    
    -- If no preferences found, detect from IP
    IF user_pref IS NULL AND ip_address_param IS NOT NULL THEN
        detected_country := get_country_from_ip(ip_address_param);
        effective_locale := get_default_locale_for_country(detected_country);
        
        RETURN QUERY
        SELECT 
            detected_country,
            l.code,
            l.id,
            true, -- is_detected
            false, -- is_overridden
            detected_country -- shopping_country_code (same as detected)
        FROM averis_pricing.locales l
        WHERE l.id = effective_locale;
        
    ELSE
        -- Return user preferences
        RETURN QUERY
        SELECT 
            COALESCE(c1.code, c2.code, 'US'),
            l.code,
            l.id,
            NOT user_pref.locale_overridden,
            user_pref.locale_overridden,
            COALESCE(c3.code, c1.code, c2.code, 'US')
        FROM averis_pricing.locales l
        LEFT JOIN averis_pricing.countries c1 ON c1.id = user_pref.chosen_country_id
        LEFT JOIN averis_pricing.countries c2 ON c2.id = user_pref.detected_country_id
        LEFT JOIN averis_pricing.countries c3 ON c3.id = user_pref.shopping_country_id
        WHERE l.id = COALESCE(user_pref.chosen_locale_id, user_pref.detected_country_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show the new hierarchy
SELECT 
    'Region-Country-Locale Hierarchy' as summary,
    r.code as region,
    c.code as country,
    c.name as country_name,
    l.code as locale,
    l.name as locale_name,
    l.priority_in_country,
    CASE WHEN c.default_locale_id = l.id THEN '⭐ DEFAULT' ELSE '' END as is_default
FROM averis_pricing.regions r
JOIN averis_pricing.countries c ON c.region_id = r.id
LEFT JOIN averis_pricing.locales l ON l.country_id = c.id
WHERE r.is_active = true AND c.is_active = true
ORDER BY r.code, c.code, l.priority_in_country;

-- Show countries by region
SELECT 
    'Countries by Region' as summary,
    r.code as region,
    r.name as region_name,
    COUNT(c.id) as country_count,
    STRING_AGG(c.code || ':' || c.name, ', ' ORDER BY c.name) as countries
FROM averis_pricing.regions r
LEFT JOIN averis_pricing.countries c ON c.region_id = r.id AND c.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.code, r.name
ORDER BY r.code;

-- Show multilingual countries
SELECT 
    'Multilingual Countries' as summary,
    c.code as country,
    c.name as country_name,
    COUNT(l.id) as locale_count,
    STRING_AGG(l.code, ', ' ORDER BY l.priority_in_country) as locales
FROM averis_pricing.countries c
JOIN averis_pricing.locales l ON l.country_id = c.id
WHERE c.is_active = true AND l.is_active = true
GROUP BY c.id, c.code, c.name
HAVING COUNT(l.id) > 1
ORDER BY COUNT(l.id) DESC, c.name;