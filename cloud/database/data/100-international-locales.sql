-- ========================================
-- 100+ INTERNATIONAL LOCALES DATASET
-- ========================================
-- Comprehensive collection of popular locales for global e-commerce
-- Organized by major economic regions with proper currency associations

BEGIN;

-- First ensure we have all the currencies we'll need
INSERT INTO averis_pricing.currencies (code, name, symbol, decimal_places, is_active) VALUES
-- Major World Currencies
('USD', 'US Dollar', '$', 2, true),
('EUR', 'Euro', '€', 2, true),
('GBP', 'British Pound Sterling', '£', 2, true),
('JPY', 'Japanese Yen', '¥', 0, true),
('CNY', 'Chinese Yuan', '¥', 2, true),
('CAD', 'Canadian Dollar', 'CA$', 2, true),
('AUD', 'Australian Dollar', 'A$', 2, true),
('CHF', 'Swiss Franc', 'CHF', 2, true),
('SEK', 'Swedish Krona', 'kr', 2, true),
('NOK', 'Norwegian Krone', 'kr', 2, true),
('DKK', 'Danish Krone', 'kr', 2, true),
-- Asia Pacific Currencies
('KRW', 'South Korean Won', '₩', 0, true),
('SGD', 'Singapore Dollar', 'S$', 2, true),
('HKD', 'Hong Kong Dollar', 'HK$', 2, true),
('TWD', 'Taiwan New Dollar', 'NT$', 2, true),
('THB', 'Thai Baht', '฿', 2, true),
('MYR', 'Malaysian Ringgit', 'RM', 2, true),
('IDR', 'Indonesian Rupiah', 'Rp', 0, true),
('PHP', 'Philippine Peso', '₱', 2, true),
('VND', 'Vietnamese Dong', '₫', 0, true),
('INR', 'Indian Rupee', '₹', 2, true),
-- Latin America Currencies
('MXN', 'Mexican Peso', '$', 2, true),
('BRL', 'Brazilian Real', 'R$', 2, true),
('ARS', 'Argentine Peso', '$', 2, true),
('CLP', 'Chilean Peso', '$', 0, true),
('COP', 'Colombian Peso', '$', 2, true),
('PEN', 'Peruvian Sol', 'S/', 2, true),
-- Eastern Europe & CIS
('PLN', 'Polish Zloty', 'zł', 2, true),
('CZK', 'Czech Koruna', 'Kč', 2, true),
('HUF', 'Hungarian Forint', 'Ft', 2, true),
('RUB', 'Russian Ruble', '₽', 2, true),
('UAH', 'Ukrainian Hryvnia', '₴', 2, true),
-- Middle East & Africa
('AED', 'UAE Dirham', 'AED', 2, true),
('SAR', 'Saudi Riyal', 'SR', 2, true),
('QAR', 'Qatari Riyal', 'QR', 2, true),
('KWD', 'Kuwaiti Dinar', 'KD', 3, true),
('ILS', 'Israeli New Shekel', '₪', 2, true),
('TRY', 'Turkish Lira', '₺', 2, true),
('ZAR', 'South African Rand', 'R', 2, true),
('NGN', 'Nigerian Naira', '₦', 2, true),
('EGP', 'Egyptian Pound', 'E£', 2, true),
-- Others
('NZD', 'New Zealand Dollar', 'NZ$', 2, true)
ON CONFLICT (code) DO NOTHING;

-- Now populate comprehensive international locales
INSERT INTO averis_pricing.locales (
    code, language_code, country_code, region_id, currency_id,
    name, native_name, is_rtl, date_format, number_format, is_active
) VALUES

-- ========================================
-- NORTH AMERICA (AMER Region)
-- ========================================
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
    'French (Canada)', 'Français (Canada)', false, 'YYYY-MM-DD',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('es_MX', 'es', 'MX',
    (SELECT id FROM averis_pricing.regions WHERE code = 'AMER'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'MXN'),
    'Spanish (Mexico)', 'Español (México)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- ========================================
-- EUROPE, MIDDLE EAST & AFRICA (EMEA Region)
-- ========================================

-- Western Europe
('en_GB', 'en', 'GB',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'GBP'),
    'English (United Kingdom)', 'English (United Kingdom)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('fr_FR', 'fr', 'FR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'French (France)', 'Français (France)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "after"}', true),

('de_DE', 'de', 'DE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'German (Germany)', 'Deutsch (Deutschland)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

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

('is_IS', 'is', 'IS',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'), -- They often use USD/EUR
    'Icelandic (Iceland)', 'Íslenska (Ísland)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

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

('sl_SI', 'sl', 'SI',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Slovenian (Slovenia)', 'Slovenščina (Slovenija)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('hr_HR', 'hr', 'HR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'),
    'Croatian (Croatia)', 'Hrvatski (Hrvatska)', false, 'DD.MM.YYYY.',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('ro_RO', 'ro', 'RO',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'), -- They use RON but often EUR for e-commerce
    'Romanian (Romania)', 'Română (România)', false, 'DD.MM.YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "after"}', true),

('bg_BG', 'bg', 'BG',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'EUR'), -- They use BGN but often EUR for e-commerce
    'Bulgarian (Bulgaria)', 'Български (България)', false, 'DD.MM.YYYY',
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

('ar_QA', 'ar', 'QA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'QAR'),
    'Arabic (Qatar)', 'العربية (قطر)', true, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('ar_KW', 'ar', 'KW',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'KWD'),
    'Arabic (Kuwait)', 'العربية (الكويت)', true, 'DD/MM/YYYY',
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

('af_ZA', 'af', 'ZA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'ZAR'),
    'Afrikaans (South Africa)', 'Afrikaans (Suid-Afrika)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": " ", "symbol_position": "before"}', true),

('en_ZA', 'en', 'ZA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'EMEA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'ZAR'),
    'English (South Africa)', 'English (South Africa)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- ========================================
-- ASIA PACIFIC & JAPAN (APJ Region)  
-- ========================================

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

('ms_SG', 'ms', 'SG',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'SGD'),
    'Malay (Singapore)', 'Bahasa Melayu (Singapura)', false, 'DD/MM/YYYY',
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

('tl_PH', 'tl', 'PH',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'PHP'),
    'Filipino (Philippines)', 'Filipino (Pilipinas)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

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

-- South Asia  
('hi_IN', 'hi', 'IN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'INR'),
    'Hindi (India)', 'हिन्दी (भारत)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('en_IN', 'en', 'IN',
    (SELECT id FROM averis_pricing.regions WHERE code = 'APJ'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'INR'),
    'English (India)', 'English (India)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

-- Australia & New Zealand
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

-- ========================================
-- LATIN AMERICA (LA Region)
-- ========================================

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
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('es_VE', 'es', 'VE',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'), -- Venezuela often uses USD
    'Spanish (Venezuela)', 'Español (Venezuela)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

('es_UY', 'es', 'UY',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'), -- Uruguay often uses USD for e-commerce
    'Spanish (Uruguay)', 'Español (Uruguay)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ",", "thousands_separator": ".", "symbol_position": "before"}', true),

-- Central America (often grouped with AMER but including in LA)
('es_CR', 'es', 'CR',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'),
    'Spanish (Costa Rica)', 'Español (Costa Rica)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('es_PA', 'es', 'PA',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'),
    'Spanish (Panama)', 'Español (Panamá)', false, 'MM/DD/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true),

('es_GT', 'es', 'GT',
    (SELECT id FROM averis_pricing.regions WHERE code = 'LA'),
    (SELECT id FROM averis_pricing.currencies WHERE code = 'USD'),
    'Spanish (Guatemala)', 'Español (Guatemala)', false, 'DD/MM/YYYY',
    '{"decimal_separator": ".", "thousands_separator": ",", "symbol_position": "before"}', true)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    native_name = EXCLUDED.native_name,
    date_format = EXCLUDED.date_format,
    number_format = EXCLUDED.number_format,
    updated_at = CURRENT_TIMESTAMP;

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

-- Show currency distribution
SELECT 
    'Currency Usage' as summary,
    c.code as currency,
    c.name as currency_name,
    COUNT(l.id) as locales_using_currency
FROM averis_pricing.currencies c
LEFT JOIN averis_pricing.locales l ON l.currency_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name
HAVING COUNT(l.id) > 0
ORDER BY COUNT(l.id) DESC;

-- Sample locales from each region
SELECT 
    'Sample Locales by Region' as summary,
    r.code as region,
    l.code as locale,
    l.name as locale_name,
    cur.code as currency
FROM averis_pricing.locales l
JOIN averis_pricing.regions r ON r.id = l.region_id
JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
WHERE l.is_active = true
ORDER BY r.code, l.code
LIMIT 20;