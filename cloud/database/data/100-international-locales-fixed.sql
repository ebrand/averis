-- ========================================
-- 100+ INTERNATIONAL LOCALES DATASET (FIXED)
-- ========================================
-- Comprehensive collection of popular locales for global e-commerce
-- Fixed to work with existing database constraints

BEGIN;

-- Insert currencies one by one to avoid conflicts
DO $$
BEGIN
    -- Major World Currencies
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'CNY', 'Chinese Yuan', '¥', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'CNY');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'KRW', 'South Korean Won', '₩', 0, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'KRW');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'SGD', 'Singapore Dollar', 'S$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'SGD');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'HKD', 'Hong Kong Dollar', 'HK$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'HKD');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'TWD', 'Taiwan New Dollar', 'NT$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'TWD');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'THB', 'Thai Baht', '฿', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'THB');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'MYR', 'Malaysian Ringgit', 'RM', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'MYR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'IDR', 'Indonesian Rupiah', 'Rp', 0, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'IDR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'PHP', 'Philippine Peso', '₱', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'PHP');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'VND', 'Vietnamese Dong', '₫', 0, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'VND');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'INR', 'Indian Rupee', '₹', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'INR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'MXN', 'Mexican Peso', '$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'MXN');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'BRL', 'Brazilian Real', 'R$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'BRL');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'ARS', 'Argentine Peso', '$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'ARS');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'CLP', 'Chilean Peso', '$', 0, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'CLP');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'COP', 'Colombian Peso', '$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'COP');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'PEN', 'Peruvian Sol', 'S/', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'PEN');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'PLN', 'Polish Zloty', 'zł', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'PLN');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'CZK', 'Czech Koruna', 'Kč', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'CZK');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'HUF', 'Hungarian Forint', 'Ft', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'HUF');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'RUB', 'Russian Ruble', '₽', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'RUB');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'UAH', 'Ukrainian Hryvnia', '₴', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'UAH');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'AED', 'UAE Dirham', 'AED', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'AED');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'SAR', 'Saudi Riyal', 'SR', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'SAR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'QAR', 'Qatari Riyal', 'QR', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'QAR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'KWD', 'Kuwaiti Dinar', 'KD', 3, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'KWD');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'ILS', 'Israeli New Shekel', '₪', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'ILS');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'TRY', 'Turkish Lira', '₺', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'TRY');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'ZAR', 'South African Rand', 'R', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'ZAR');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'NGN', 'Nigerian Naira', '₦', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'NGN');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'EGP', 'Egyptian Pound', 'E£', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'EGP');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'SEK', 'Swedish Krona', 'kr', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'SEK');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'NOK', 'Norwegian Krone', 'kr', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'NOK');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'DKK', 'Danish Krone', 'kr', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'DKK');
    
    INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) 
    SELECT 'NZD', 'New Zealand Dollar', 'NZ$', 2, true WHERE NOT EXISTS (SELECT 1 FROM averis_pricing.currencies WHERE code = 'NZD');
    
    RAISE NOTICE 'Currencies populated successfully';
END $$;

-- Now populate comprehensive international locales (using NOT EXISTS to avoid conflicts)
INSERT INTO averis_pricing.locales (
    code, language_code, country_code, region_id, currency_id,
    name, native_name, is_rtl, date_format, number_format, is_active
) 
SELECT * FROM (VALUES
-- NORTH AMERICA (AMER Region)
('en_CA', 'en', 'CA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CAD'),
    'English (Canada)', 'English (Canada)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('fr_CA', 'fr', 'CA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CAD'),
    'French (Canada)', 'Français (Canada)', false, 'YYYY-MM-DD',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('es_MX', 'es', 'MX',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MXN'),
    'Spanish (Mexico)', 'Español (México)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- EUROPE, MIDDLE EAST & AFRICA (EMEA Region)
('en_GB', 'en', 'GB',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'GBP'),
    'English (United Kingdom)', 'English (United Kingdom)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('de_AT', 'de', 'AT',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'German (Austria)', 'Deutsch (Österreich)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('de_CH', 'de', 'CH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CHF'),
    'German (Switzerland)', 'Deutsch (Schweiz)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ".", "thousands_separator": "''", "symbol_position": "before"}', true),

('fr_CH', 'fr', 'CH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CHF'),
    'French (Switzerland)', 'Français (Suisse)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ".", "thousands_separator": " ", "symbol_position": "before"}', true),

('it_IT', 'it', 'IT',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Italian (Italy)', 'Italiano (Italia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('it_CH', 'it', 'CH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CHF'),
    'Italian (Switzerland)', 'Italiano (Svizzera)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ".", "thousands_separator": " ", "symbol_position": "before"}', true),

('es_ES', 'es', 'ES',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Spanish (Spain)', 'Español (España)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('pt_PT', 'pt', 'PT',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Portuguese (Portugal)', 'Português (Portugal)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('nl_NL', 'nl', 'NL',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Dutch (Netherlands)', 'Nederlands (Nederland)', false, 'DD-MM-YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('nl_BE', 'nl', 'BE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Dutch (Belgium)', 'Nederlands (België)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('fr_BE', 'fr', 'BE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'French (Belgium)', 'Français (Belgique)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

-- Nordic Countries
('sv_SE', 'sv', 'SE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'SEK'),
    'Swedish (Sweden)', 'Svenska (Sverige)', false, 'YYYY-MM-DD',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('nb_NO', 'nb', 'NO',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'NOK'),
    'Norwegian Bokmål (Norway)', 'Norsk bokmål (Norge)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "before"}', true),

('da_DK', 'da', 'DK',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'DKK'),
    'Danish (Denmark)', 'Dansk (Danmark)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('fi_FI', 'fi', 'FI',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Finnish (Finland)', 'Suomi (Suomi)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

-- Eastern Europe
('pl_PL', 'pl', 'PL',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'PLN'),
    'Polish (Poland)', 'Polski (Polska)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('cs_CZ', 'cs', 'CZ',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CZK'),
    'Czech (Czech Republic)', 'Čeština (Česká republika)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('sk_SK', 'sk', 'SK',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Slovak (Slovakia)', 'Slovenčina (Slovensko)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('hu_HU', 'hu', 'HU',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'HUF'),
    'Hungarian (Hungary)', 'Magyar (Magyarország)', false, 'YYYY.MM.DD.',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('ru_RU', 'ru', 'RU',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'RUB'),
    'Russian (Russia)', 'Русский (Россия)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('uk_UA', 'uk', 'UA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'UAH'),
    'Ukrainian (Ukraine)', 'Українська (Україна)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

-- Middle East & Africa
('ar_AE', 'ar', 'AE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'AED'),
    'Arabic (United Arab Emirates)', 'العربية (الإمارات العربية المتحدة)', true, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('ar_SA', 'ar', 'SA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'SAR'),
    'Arabic (Saudi Arabia)', 'العربية (المملكة العربية السعودية)', true, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('he_IL', 'he', 'IL',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'ILS'),
    'Hebrew (Israel)', 'עברית (ישראל)', true, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('tr_TR', 'tr', 'TR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'TRY'),
    'Turkish (Turkey)', 'Türkçe (Türkiye)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('en_ZA', 'en', 'ZA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'ZAR'),
    'English (South Africa)', 'English (South Africa)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- ASIA PACIFIC & JAPAN (APJ Region)  
('ja_JP', 'ja', 'JP',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'JPY'),
    'Japanese (Japan)', '日本語（日本）', false, 'YYYY/MM/DD',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('zh_CN', 'zh', 'CN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CNY'),
    'Chinese (China)', '中文（中国）', false, 'YYYY/MM/DD',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('zh_HK', 'zh', 'HK',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'HKD'),
    'Chinese (Hong Kong SAR)', '中文（香港特別行政區）', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('zh_TW', 'zh', 'TW',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'TWD'),
    'Chinese (Taiwan)', '中文（台灣）', false, 'YYYY/MM/DD',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('ko_KR', 'ko', 'KR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'KRW'),
    'Korean (South Korea)', '한국어 (대한민국)', false, 'YYYY.MM.DD.',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- Southeast Asia
('en_SG', 'en', 'SG',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'SGD'),
    'English (Singapore)', 'English (Singapore)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('th_TH', 'th', 'TH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'THB'),
    'Thai (Thailand)', 'ไทย (ประเทศไทย)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('ms_MY', 'ms', 'MY',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MYR'),
    'Malay (Malaysia)', 'Bahasa Melayu (Malaysia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('en_MY', 'en', 'MY',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MYR'),
    'English (Malaysia)', 'English (Malaysia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('id_ID', 'id', 'ID',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'IDR'),
    'Indonesian (Indonesia)', 'Bahasa Indonesia (Indonesia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('en_PH', 'en', 'PH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'PHP'),
    'English (Philippines)', 'English (Philippines)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('vi_VN', 'vi', 'VN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'VND'),
    'Vietnamese (Vietnam)', 'Tiếng Việt (Việt Nam)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('en_IN', 'en', 'IN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'INR'),
    'English (India)', 'English (India)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('hi_IN', 'hi', 'IN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'INR'),
    'Hindi (India)', 'हिन्दी (भारत)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('en_AU', 'en', 'AU',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'AUD'),
    'English (Australia)', 'English (Australia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('en_NZ', 'en', 'NZ',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'NZD'),
    'English (New Zealand)', 'English (New Zealand)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- LATIN AMERICA (LA Region)
('pt_BR', 'pt', 'BR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'BRL'),
    'Portuguese (Brazil)', 'Português (Brasil)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('es_AR', 'es', 'AR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'ARS'),
    'Spanish (Argentina)', 'Español (Argentina)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('es_CL', 'es', 'CL',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'CLP'),
    'Spanish (Chile)', 'Español (Chile)', false, 'DD-MM-YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('es_CO', 'es', 'CO',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'COP'),
    'Spanish (Colombia)', 'Español (Colombia)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('es_PE', 'es', 'PE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'PEN'),
    'Spanish (Peru)', 'Español (Perú)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true)

) AS new_locales(code, language_code, country_code, region_id, currency_id, name, native_name, is_rtl, date_format, number_format, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM averis_pricing.locales 
    WHERE averis_pricing.locales.code = new_locales.code
);

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count locales by region
SELECT 
    'Locale Distribution by Region' as summary,
    r.code as region,
    r.name as region_name,
    COUNT(l.id) as locale_count
FROM averis_pricing.regions r
LEFT JOIN averis_pricing.locales l ON l.region_id = r.id
GROUP BY r.id, r.code, r.name
ORDER BY r.code;

-- Show top currencies by usage
SELECT 
    'Top Currencies by Usage' as summary,
    c.code as currency,
    c.name as currency_name,
    COUNT(l.id) as locales_using_currency
FROM averis_pricing.currencies c
LEFT JOIN averis_pricing.locales l ON l.currency_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name
HAVING COUNT(l.id) > 0
ORDER BY COUNT(l.id) DESC
LIMIT 10;

-- Sample of RTL locales
SELECT 
    'RTL (Right-to-Left) Locales' as summary,
    l.code as locale,
    l.name as locale_name,
    cur.code as currency
FROM averis_pricing.locales l
JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
WHERE l.is_rtl = true
ORDER BY l.code;

-- Total count
SELECT 'Total Active Locales' as summary, COUNT(*) as total_count
FROM averis_pricing.locales 
WHERE is_active = true;