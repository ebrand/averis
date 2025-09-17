# Locale Filters Implementation Guide

## Overview

This document describes the implementation of **locale filters** for product descriptions and financials in the Averis e-commerce platform. The implementation introduces automatic catalog assignment based on user geography and supports locale-specific content and pricing transformations.

## Architecture Changes

### 1. Database Schema Enhancements

**New Tables Added:**
- `averis_pricing.locales` - Language and country combinations with formatting rules
- `averis_pricing.product_locale_content` - Localized product descriptions and content
- `averis_pricing.product_locale_financials` - Locale-specific pricing and tax calculations
- `averis_pricing.country_region_mapping` - Geographic mapping for catalog assignment
- `averis_pricing.catalog_assignment_rules` - Business rules for automatic catalog selection
- `averis_pricing.locale_transformation_rules` - Automated content transformation rules

**Key Features:**
- **Multi-dimensional Localization**: Supports language, country, currency, and regional variations
- **Intelligent Catalog Assignment**: Automatic geographic targeting with fallback mechanisms
- **Flexible Content Management**: JSONB storage for extensible localized attributes
- **Advanced Tax Calculations**: Locale-specific tax rates and regulatory compliance

### 2. API Enhancements

**E-commerce API New Endpoints:**
```
POST /api/session/initialize          # Auto-assign catalog and locale
POST /api/session/catalog-assignment  # Manual catalog assignment
GET  /api/session/locales/{region}    # Available locales for region
PUT  /api/session/preferences/{id}    # Update user preferences
```

**Enhanced Product Endpoints:**
```
GET /api/products?locale=en_US                    # Locale-filtered products
GET /api/products/{id}?locale=de_DE&catalogId=... # Localized single product
```

## Data Flow Architecture

```
User Request → Geographic Detection → Catalog Assignment → Locale Filtering → Localized Response
     ↓              ↓                      ↓                   ↓                    ↓
   IP/Headers → Country Code → Rule Engine → Language Filter → Product Content
                                    ↓           Currency Filter → Financial Data
                              Default Catalog
```

## Implementation Steps

### Step 1: Run Database Migrations

```bash
# Apply the locale filters migration
psql -h localhost -p 5432 -U postgres -d commerce_db -f cloud/database/migrations/003-locale-filters-migration.sql

# Insert sample data
psql -h localhost -p 5432 -U postgres -d commerce_db -f cloud/database/data/004-locale-sample-data.sql
```

### Step 2: Register New Services

Add to `Program.cs` in the E-commerce API:

```csharp
// Register locale service
builder.Services.AddScoped<ILocaleService, LocaleService>();
```

### Step 3: Update Connection String

Ensure the E-commerce API connection string points to the correct database with locale schema:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=commerce_db;Username=postgres;Password=postgres;Include Error Detail=true;"
  }
}
```

## Testing the Implementation

### 1. Verify Database Schema

```sql
-- Check that all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'averis_pricing' 
  AND table_name IN ('locales', 'product_locale_content', 'product_locale_financials', 'country_region_mapping', 'catalog_assignment_rules');

-- Test the catalog assignment function
SELECT * FROM get_default_catalog_for_user('US', 'anonymous');
SELECT * FROM get_default_catalog_for_user('DE', 'anonymous');
SELECT * FROM get_default_catalog_for_user('XX', 'anonymous'); -- Should use fallback
```

### 2. Test API Endpoints

#### Initialize Session (Geographic Targeting)
```bash
curl -X POST "http://localhost:6004/api/session/initialize" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -d '{
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "countryCode": "DE"
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "assignedCatalog": {
      "id": "catalog-uuid",
      "code": "EMEA_Online", 
      "name": "Europe Online Catalog",
      "regionCode": "EMEA",
      "marketSegment": "Online"
    },
    "locale": {
      "code": "de_DE",
      "languageCode": "de",
      "countryCode": "DE",
      "currency": {"code": "EUR", "symbol": "€"}
    },
    "assignmentMethod": "geo_default"
  }
}
```

#### Get Locale-Filtered Products
```bash
curl "http://localhost:6004/api/products?locale=de_DE&catalogId=EMEA_Online&page=1&limit=10"
```

Expected Response (with localized content):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "sku": "WIDGET-001",
        "name": "Premium Widget",
        "localized": {
          "localeCode": "de_DE",
          "localizedName": "Premium Widget (DE)",
          "localizedDescription": "Ein hochwertiges Widget...",
          "translationStatus": "approved"
        },
        "pricing": {
          "basePrice": 99.99,
          "localPrice": 89.99,
          "taxRate": 0.19,
          "taxIncludedPrice": 107.09,
          "localCurrency": "EUR",
          "formattedLocalPrice": "89,99 €",
          "formattedTaxIncludedPrice": "107,09 €"
        }
      }
    ]
  }
}
```

#### Test Available Locales
```bash
curl "http://localhost:6004/api/session/locales/EMEA"
```

### 3. Test Different Geographic Scenarios

**US User:**
```bash
curl -X POST "http://localhost:6004/api/session/initialize" \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "US", "acceptLanguage": "en-US"}'
# Expected: AMER_Online catalog, en_US locale, USD currency
```

**Canadian User:**
```bash
curl -X POST "http://localhost:6004/api/session/initialize" \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "CA", "acceptLanguage": "fr-CA"}'
# Expected: AMER_Online catalog, fr_CA locale, CAD currency
```

**German User:**
```bash
curl -X POST "http://localhost:6004/api/session/initialize" \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "DE", "acceptLanguage": "de-DE"}'
# Expected: EMEA_Online catalog, de_DE locale, EUR currency
```

## Key Benefits

1. **Seamless User Experience**: Automatic catalog assignment eliminates manual selection
2. **Global Scalability**: Easy addition of new regions and locales
3. **Cultural Adaptation**: Locale-specific content beyond simple translation
4. **Regulatory Compliance**: Built-in tax calculations and financial formatting
5. **Performance Optimization**: Cached locale data with intelligent fallbacks

## Architecture Insights

`★ Insight ─────────────────────────────────────`
This implementation demonstrates **progressive enhancement** - users get basic functionality immediately (fallback catalog), enhanced experience with detected geography (regional catalog), and premium experience with full localization (content + pricing). The **separation of concerns** between catalog assignment (business rules) and content localization (presentation layer) allows independent scaling and customization.
`─────────────────────────────────────────────────`

## Future Enhancements

1. **Machine Learning Integration**: User behavior analysis for better catalog recommendations
2. **A/B Testing Framework**: Test different locale assignment strategies
3. **Real-time Currency Conversion**: Live exchange rate integration
4. **Advanced Geolocation**: Integration with services like MaxMind or IPStack
5. **Session Persistence**: Redis/database storage for user preferences
6. **CDN Integration**: Locale-specific asset delivery

## Troubleshooting

**Common Issues:**
1. **Function not found**: Ensure migration ran successfully and functions were created
2. **No catalog assigned**: Check that sample data loaded and assignment rules exist
3. **Pricing not found**: Verify product_locale_financials table has data for the locale/catalog combination
4. **Connection errors**: Ensure database connection string includes all required schemas in search_path

**Debug Queries:**
```sql
-- Check available catalogs
SELECT c.code, c.name, r.code as region, ms.code as segment 
FROM averis_pricing.catalogs c
JOIN averis_pricing.regions r ON r.id = c.region_id
JOIN averis_pricing.market_segments ms ON ms.id = c.market_segment_id;

-- Check available locales
SELECT code, name, language_code, country_code 
FROM averis_pricing.locales 
WHERE is_active = true;

-- Check assignment rules
SELECT rule_name, rule_type, country_codes, market_segment_code, priority 
FROM averis_pricing.catalog_assignment_rules 
WHERE is_active = true 
ORDER BY priority;
```