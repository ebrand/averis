using Commerce.Services.Ecommerce.Api.Data;
using Commerce.Services.Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;
using System.Data;
using System.Data.Common;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service for locale-aware catalog assignment and content localization
/// Integrates with the pricing MDM database to provide geography-based catalog selection
/// </summary>
public class LocaleService : ILocaleService
{
    private readonly EcommerceDbContext _context;
    private readonly ILogger<LocaleService> _logger;
    private readonly IConfiguration _configuration;

    public LocaleService(
        EcommerceDbContext context,
        ILogger<LocaleService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<SessionContext> InitializeSessionAsync(SessionInitializationRequest request)
    {
        try
        {
            _logger.LogInformation("Initializing session for IP: {IpAddress}", request.IpAddress);

            // Detect country from IP if not provided
            var countryCode = request.CountryCode;
            if (string.IsNullOrEmpty(countryCode) && !string.IsNullOrEmpty(request.IpAddress))
            {
                countryCode = await DetectCountryFromIpAsync(request.IpAddress);
            }

            // Parse preferred locale from Accept-Language header
            var preferredLocale = request.PreferredLocale ?? ParsePreferredLocale(request.AcceptLanguage, countryCode);

            // Get default catalog assignment
            var catalogRequest = new CatalogAssignmentRequest
            {
                CountryCode = countryCode,
                IpAddress = request.IpAddress,
                AcceptLanguage = request.AcceptLanguage,
                UserType = request.UserId.HasValue ? "authenticated" : "anonymous",
                UserRoles = request.UserRoles
            };

            var catalogAssignment = await GetDefaultCatalogAsync(catalogRequest);

            if (!catalogAssignment.Success)
            {
                _logger.LogWarning("Failed to assign catalog for country: {CountryCode}", countryCode);
                throw new InvalidOperationException($"Failed to assign catalog: {catalogAssignment.Error}");
            }

            // Create session context
            var sessionContext = new SessionContext
            {
                SessionId = Guid.NewGuid(),
                AssignedCatalog = catalogAssignment.Catalog,
                Locale = catalogAssignment.Locale,
                AssignmentMethod = catalogAssignment.AssignmentMethod,
                Preferences = new Dictionary<string, object>
                {
                    { "detectedCountry", countryCode ?? "unknown" },
                    { "userAgent", request.UserAgent ?? "" },
                    { "ipAddress", request.IpAddress ?? "" }
                },
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Session initialized: {SessionId}, Catalog: {CatalogCode}, Locale: {LocaleCode}", 
                sessionContext.SessionId, sessionContext.AssignedCatalog.Code, sessionContext.Locale.Code);

            return sessionContext;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing session");
            throw;
        }
    }

    public async Task<CatalogAssignmentResponse> GetDefaultCatalogAsync(CatalogAssignmentRequest request)
    {
        try
        {
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT catalog_id, catalog_code, locale_code, assignment_method, region_code
                FROM public.get_default_catalog_for_user(@country_code::TEXT, @user_type::TEXT, @user_roles::TEXT[], @customer_tier::TEXT)";

            // Add parameters with explicit types
            var countryParam = command.CreateParameter();
            countryParam.ParameterName = "@country_code";
            countryParam.Value = request.CountryCode ?? (object)DBNull.Value;
            command.Parameters.Add(countryParam);

            var userTypeParam = command.CreateParameter();
            userTypeParam.ParameterName = "@user_type";
            userTypeParam.Value = request.UserType ?? "anonymous";
            command.Parameters.Add(userTypeParam);

            var rolesParam = command.CreateParameter();
            rolesParam.ParameterName = "@user_roles";
            rolesParam.Value = request.UserRoles ?? Array.Empty<string>();
            command.Parameters.Add(rolesParam);

            var tierParam = command.CreateParameter();
            tierParam.ParameterName = "@customer_tier";
            tierParam.Value = request.CustomerTier ?? (object)DBNull.Value;
            command.Parameters.Add(tierParam);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var catalogId = reader.GetGuid("catalog_id");
                var catalogCode = reader.GetString("catalog_code");
                var localeCode = reader.GetString("locale_code");
                var assignmentMethod = reader.GetString("assignment_method");
                var regionCode = reader.GetString("region_code");
                
                // Close the reader before making additional queries
                reader.Close();

                // Get full catalog and locale details
                var catalog = await GetCatalogDetailsAsync(catalogId, connection);
                var locale = await GetLocaleDetailsAsync(localeCode, connection);

                return new CatalogAssignmentResponse
                {
                    Success = true,
                    Catalog = catalog,
                    Locale = locale,
                    AssignmentMethod = assignmentMethod
                };
            }

            return new CatalogAssignmentResponse
            {
                Success = false,
                Error = "No suitable catalog found for the given criteria"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting default catalog for country: {CountryCode}", request.CountryCode);
            return new CatalogAssignmentResponse
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<EcommerceProductDto.LocalizedContent?> GetLocalizedProductContentAsync(Guid productId, string localeCode)
    {
        try
        {
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT 
                    plc.name,
                    plc.description,
                    plc.short_description,
                    plc.marketing_copy,
                    plc.technical_specs,
                    plc.features,
                    plc.benefits,
                    plc.meta_title,
                    plc.meta_description,
                    plc.keywords,
                    plc.translation_status,
                    l.code as locale_code
                FROM averis_pricing.product_locale_content plc
                JOIN averis_pricing.locales l ON l.id = plc.locale_id
                WHERE plc.product_id = @product_id AND l.code = @locale_code";

            var productParam = command.CreateParameter();
            productParam.ParameterName = "@product_id";
            productParam.Value = productId;
            command.Parameters.Add(productParam);

            var localeParam = command.CreateParameter();
            localeParam.ParameterName = "@locale_code";
            localeParam.Value = localeCode;
            command.Parameters.Add(localeParam);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new EcommerceProductDto.LocalizedContent
                {
                    LocaleCode = reader.GetString("locale_code"),
                    LocalizedName = reader.IsDBNull("name") ? null : reader.GetString("name"),
                    LocalizedDescription = reader.IsDBNull("description") ? null : reader.GetString("description"),
                    LocalizedShortDescription = reader.IsDBNull("short_description") ? null : reader.GetString("short_description"),
                    LocalizedMarketingCopy = reader.IsDBNull("marketing_copy") ? null : reader.GetString("marketing_copy"),
                    LocalizedTechnicalSpecs = ParseJsonField(reader, "technical_specs"),
                    LocalizedFeatures = ParseArrayField(reader, "features"),
                    LocalizedBenefits = ParseArrayField(reader, "benefits"),
                    Seo = new EcommerceProductDto.LocalizedSeoInfo
                    {
                        LocalizedMetaTitle = reader.IsDBNull("meta_title") ? null : reader.GetString("meta_title"),
                        LocalizedMetaDescription = reader.IsDBNull("meta_description") ? null : reader.GetString("meta_description"),
                        LocalizedKeywords = ParseArrayField(reader, "keywords")
                    },
                    TranslationStatus = reader.GetString("translation_status")
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized content for product {ProductId}, locale {LocaleCode}", productId, localeCode);
            return null;
        }
    }

    public async Task<EcommerceProductDto.PricingInfo?> GetLocalePricingAsync(Guid productId, string localeCode, Guid catalogId)
    {
        try
        {
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT 
                    plf.base_price,
                    plf.local_price,
                    plf.tax_rate,
                    plf.tax_amount,
                    plf.tax_included_price,
                    plf.display_format,
                    c.code as currency_code,
                    c.symbol as currency_symbol,
                    c.decimal_places,
                    l.number_format
                FROM averis_pricing.product_locale_financials plf
                JOIN averis_pricing.locales l ON l.id = plf.locale_id
                JOIN averis_pricing.currencies c ON c.id = l.currency_id
                WHERE plf.product_id = @product_id 
                    AND l.code = @locale_code 
                    AND plf.catalog_id = @catalog_id
                    AND plf.is_active = true
                    AND (plf.effective_from IS NULL OR plf.effective_from <= CURRENT_TIMESTAMP)
                    AND (plf.effective_to IS NULL OR plf.effective_to >= CURRENT_TIMESTAMP)";

            var productParam = command.CreateParameter();
            productParam.ParameterName = "@product_id";
            productParam.Value = productId;
            command.Parameters.Add(productParam);

            var localeParam = command.CreateParameter();
            localeParam.ParameterName = "@locale_code";
            localeParam.Value = localeCode;
            command.Parameters.Add(localeParam);

            var catalogParam = command.CreateParameter();
            catalogParam.ParameterName = "@catalog_id";
            catalogParam.Value = catalogId;
            command.Parameters.Add(catalogParam);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var basePrice = reader.GetDecimal("base_price");
                var localPrice = reader.IsDBNull("local_price") ? basePrice : reader.GetDecimal("local_price");
                var taxRate = reader.IsDBNull("tax_rate") ? 0 : reader.GetDecimal("tax_rate");
                var taxAmount = reader.IsDBNull("tax_amount") ? 0 : reader.GetDecimal("tax_amount");
                var taxIncludedPrice = reader.IsDBNull("tax_included_price") ? localPrice : reader.GetDecimal("tax_included_price");
                
                var currencyCode = reader.GetString("currency_code");
                var currencySymbol = reader.GetString("currency_symbol");
                var decimalPlaces = reader.GetInt32("decimal_places");

                var displayFormat = ParseJsonField(reader, "display_format") ?? new Dictionary<string, object>();
                var numberFormat = ParseJsonField(reader, "number_format") ?? new Dictionary<string, object>();

                // Format prices according to locale settings
                var formattedLocalPrice = FormatPrice(localPrice, currencySymbol, decimalPlaces, numberFormat);
                var formattedTaxIncludedPrice = FormatPrice(taxIncludedPrice, currencySymbol, decimalPlaces, numberFormat);

                return new EcommerceProductDto.PricingInfo
                {
                    BasePrice = basePrice,
                    LocalPrice = localPrice,
                    TaxRate = taxRate,
                    TaxAmount = taxAmount,
                    TaxIncludedPrice = taxIncludedPrice,
                    LocalCurrency = currencyCode,
                    FormattedLocalPrice = formattedLocalPrice,
                    FormattedTaxIncludedPrice = formattedTaxIncludedPrice,
                    DisplayFormat = displayFormat,
                    FinalPrice = taxIncludedPrice,
                    Currency = currencyCode,
                    FormattedFinalPrice = formattedTaxIncludedPrice,
                    Available = true
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locale pricing for product {ProductId}, locale {LocaleCode}, catalog {CatalogId}", 
                productId, localeCode, catalogId);
            return null;
        }
    }

    public async Task<List<AssignedLocale>> GetAvailableLocalesAsync(string regionCode)
    {
        try
        {
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT 
                    l.code,
                    l.language_code,
                    l.country_code,
                    l.name,
                    l.native_name,
                    l.is_rtl,
                    l.date_format,
                    l.number_format,
                    c.code as currency_code,
                    c.name as currency_name,
                    c.symbol as currency_symbol,
                    c.decimal_places
                FROM averis_pricing.locales l
                JOIN averis_pricing.regions r ON r.id = l.region_id
                JOIN averis_pricing.currencies c ON c.id = l.currency_id
                WHERE r.code = @region_code AND l.is_active = true
                ORDER BY l.name";

            var regionParam = command.CreateParameter();
            regionParam.ParameterName = "@region_code";
            regionParam.Value = regionCode;
            command.Parameters.Add(regionParam);

            var locales = new List<AssignedLocale>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var numberFormat = ParseJsonField(reader, "number_format") ?? new Dictionary<string, object>();
                
                locales.Add(new AssignedLocale
                {
                    Code = reader.GetString("code"),
                    LanguageCode = reader.GetString("language_code"),
                    CountryCode = reader.GetString("country_code"),
                    Name = reader.GetString("name"),
                    NativeName = reader.IsDBNull("native_name") ? "" : reader.GetString("native_name"),
                    Currency = new CurrencyInfo
                    {
                        Code = reader.GetString("currency_code"),
                        Name = reader.GetString("currency_name"),
                        Symbol = reader.GetString("currency_symbol"),
                        DecimalPlaces = reader.GetInt32("decimal_places")
                    },
                    Formatting = new LocaleFormatting
                    {
                        IsRtl = reader.GetBoolean("is_rtl"),
                        DateFormat = reader.GetString("date_format"),
                        NumberFormat = numberFormat
                    }
                });
            }

            return locales;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locales for region: {RegionCode}", regionCode);
            return new List<AssignedLocale>();
        }
    }

    public Task<SessionContext> UpdateSessionPreferencesAsync(Guid sessionId, string? catalogCode = null, string? localeCode = null)
    {
        // In a real implementation, this would update session storage (Redis, database, etc.)
        // For now, we'll create a new session context with updated preferences
        
        throw new NotImplementedException("Session storage not implemented in this example");
    }

    public Task<string?> DetectCountryFromIpAsync(string ipAddress)
    {
        try
        {
            // In a real implementation, this would integrate with a geolocation service like MaxMind, IPStack, etc.
            // For demo purposes, we'll do basic detection based on common patterns
            
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "127.0.0.1" || ipAddress.StartsWith("192.168.") || ipAddress.StartsWith("10."))
            {
                return Task.FromResult<string?>("US"); // Default for local/private IPs
            }

            // Placeholder for real geolocation service integration
            _logger.LogInformation("Would detect country for IP: {IpAddress}", ipAddress);
            
            return Task.FromResult<string?>("US"); // Default fallback
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error detecting country from IP: {IpAddress}", ipAddress);
            return Task.FromResult<string?>(null);
        }
    }

    public string ParsePreferredLocale(string? acceptLanguageHeader, string? detectedCountryCode = null)
    {
        try
        {
            if (string.IsNullOrEmpty(acceptLanguageHeader))
            {
                return detectedCountryCode switch
                {
                    "CA" => "en_CA",
                    "MX" => "es_MX",
                    "DE" => "de_DE",
                    "FR" => "fr_FR",
                    "GB" => "en_GB",
                    "JP" => "ja_JP",
                    _ => "en_US"
                };
            }

            // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
            var languages = acceptLanguageHeader
                .Split(',')
                .Select(lang => lang.Split(';')[0].Trim())
                .Where(lang => !string.IsNullOrEmpty(lang))
                .ToList();

            foreach (var lang in languages)
            {
                var normalizedLang = lang.Replace('-', '_');
                
                // Try exact match first
                var exactMatch = normalizedLang switch
                {
                    "en_US" => "en_US",
                    "en_CA" => "en_CA",
                    "fr_CA" => "fr_CA",
                    "es_MX" => "es_MX",
                    "en_GB" => "en_GB",
                    "de_DE" => "de_DE",
                    "fr_FR" => "fr_FR",
                    "ja_JP" => "ja_JP",
                    _ => null
                };

                if (exactMatch != null)
                {
                    return exactMatch;
                }

                // Try language-only match with country context
                var languageCode = normalizedLang.Split('_')[0];
                var countryMatch = (languageCode, detectedCountryCode) switch
                {
                    ("en", "CA") => "en_CA",
                    ("en", "GB") => "en_GB",
                    ("en", _) => "en_US",
                    ("fr", "CA") => "fr_CA",
                    ("fr", _) => "fr_FR",
                    ("es", "MX") => "es_MX",
                    ("de", _) => "de_DE",
                    ("ja", _) => "ja_JP",
                    _ => null
                };

                if (countryMatch != null)
                {
                    return countryMatch;
                }
            }

            return "en_US"; // Ultimate fallback
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing Accept-Language header: {AcceptLanguage}", acceptLanguageHeader);
            return "en_US";
        }
    }

    // Helper methods
    private async Task<AssignedCatalog> GetCatalogDetailsAsync(Guid catalogId, DbConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT c.id, c.code, c.name, r.code as region_code, ms.code as market_segment
            FROM averis_pricing.catalogs c
            JOIN averis_pricing.regions r ON r.id = c.region_id
            JOIN averis_pricing.market_segments ms ON ms.id = c.market_segment_id
            WHERE c.id = @catalog_id";

        var param = command.CreateParameter();
        param.ParameterName = "@catalog_id";
        param.Value = catalogId;
        command.Parameters.Add(param);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new AssignedCatalog
            {
                Id = reader.GetGuid("id"),
                Code = reader.GetString("code"),
                Name = reader.GetString("name"),
                RegionCode = reader.GetString("region_code"),
                MarketSegment = reader.GetString("market_segment")
            };
        }

        throw new InvalidOperationException($"Catalog {catalogId} not found");
    }

    private async Task<AssignedLocale> GetLocaleDetailsAsync(string localeCode, DbConnection connection)
    {

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT 
                l.code, l.language_code, l.country_code, l.name, l.native_name,
                l.is_rtl, l.date_format, l.number_format,
                c.code as currency_code, c.name as currency_name, 
                c.symbol as currency_symbol, c.decimal_places
            FROM averis_pricing.locales l
            JOIN averis_pricing.currencies c ON c.id = l.currency_id
            WHERE l.code = @locale_code";

        var param = command.CreateParameter();
        param.ParameterName = "@locale_code";
        param.Value = localeCode;
        command.Parameters.Add(param);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            var numberFormat = ParseJsonField(reader, "number_format") ?? new Dictionary<string, object>();
            
            return new AssignedLocale
            {
                Code = reader.GetString("code"),
                LanguageCode = reader.GetString("language_code"),
                CountryCode = reader.GetString("country_code"),
                Name = reader.GetString("name"),
                NativeName = reader.IsDBNull("native_name") ? "" : reader.GetString("native_name"),
                Currency = new CurrencyInfo
                {
                    Code = reader.GetString("currency_code"),
                    Name = reader.GetString("currency_name"),
                    Symbol = reader.GetString("currency_symbol"),
                    DecimalPlaces = reader.GetInt32("decimal_places")
                },
                Formatting = new LocaleFormatting
                {
                    IsRtl = reader.GetBoolean("is_rtl"),
                    DateFormat = reader.GetString("date_format"),
                    NumberFormat = numberFormat
                }
            };
        }

        throw new InvalidOperationException($"Locale {localeCode} not found");
    }

    private Dictionary<string, object>? ParseJsonField(IDataReader reader, string fieldName)
    {
        try
        {
            var fieldIndex = reader.GetOrdinal(fieldName);
            if (reader.IsDBNull(fieldIndex))
                return null;

            var jsonString = reader.GetString(fieldIndex);
            if (string.IsNullOrEmpty(jsonString))
                return null;

            return JsonSerializer.Deserialize<Dictionary<string, object>>(jsonString);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing JSON field {FieldName}", fieldName);
            return null;
        }
    }

    private string[]? ParseArrayField(IDataReader reader, string fieldName)
    {
        try
        {
            var fieldIndex = reader.GetOrdinal(fieldName);
            if (reader.IsDBNull(fieldIndex))
                return null;

            var arrayValue = reader.GetValue(fieldIndex);
            if (arrayValue is string[] stringArray)
                return stringArray;

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing array field {FieldName}", fieldName);
            return null;
        }
    }

    private string FormatPrice(decimal price, string currencySymbol, int decimalPlaces, Dictionary<string, object> numberFormat)
    {
        try
        {
            var decimalSeparator = numberFormat.GetValueOrDefault("decimal_separator", ".").ToString();
            var thousandsSeparator = numberFormat.GetValueOrDefault("thousands_separator", ",").ToString();
            var symbolPosition = numberFormat.GetValueOrDefault("symbol_position", "before").ToString();

            var formattedNumber = price.ToString($"N{decimalPlaces}")
                .Replace(".", decimalSeparator)
                .Replace(",", thousandsSeparator);

            return symbolPosition == "before" 
                ? $"{currencySymbol}{formattedNumber}"
                : $"{formattedNumber} {currencySymbol}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error formatting price {Price}", price);
            return $"{currencySymbol}{price:N2}";
        }
    }
}