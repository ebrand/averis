using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service for calculating locale-specific financial data for products in catalogs
/// </summary>
public class LocaleFinancialService : ILocaleFinancialService
{
    private readonly PricingDbContext _context;
    private readonly ILogger<LocaleFinancialService> _logger;
    private readonly ICurrencyConversionService _currencyService;

    public LocaleFinancialService(
        PricingDbContext context,
        ILogger<LocaleFinancialService> logger,
        ICurrencyConversionService currencyService)
    {
        _context = context;
        _logger = logger;
        _currencyService = currencyService;
    }

    /// <summary>
    /// Calculate locale-specific financials for a product in a catalog
    /// </summary>
    public async Task<List<Guid>> CalculateLocaleFinancialsAsync(Guid productId, Guid catalogId, List<Guid> localeIds)
    {
        _logger.LogInformation("Calculating locale financials for product {ProductId} in catalog {CatalogId} for {LocaleCount} locales", 
            productId, catalogId, localeIds.Count);

        var calculatedLocales = new List<Guid>();

        try
        {
            // Get catalog and product information
            var catalog = await _context.Catalogs
                .Include(c => c.Currency)
                .Include(c => c.Region)
                .FirstOrDefaultAsync(c => c.Id == catalogId);

            if (catalog == null)
            {
                throw new InvalidOperationException($"Catalog {catalogId} not found");
            }

            // Verify product exists via Product Staging API through Traefik
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Host", "api.localhost");
            var productResponse = await httpClient.GetAsync($"http://127.0.0.1:80/product-staging/api/products/{productId}");
            if (!productResponse.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Product {productId} not found in staging system");
            }
            
            var productJson = await productResponse.Content.ReadAsStringAsync();
            var productData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(productJson);
            
            if (!productData.TryGetProperty("basePrice", out var basePriceElement))
            {
                throw new InvalidOperationException($"Product {productId} missing base price data");
            }
            
            var productBasePrice = basePriceElement.GetDecimal();

            // Get base price for the product in this catalog
            var catalogProduct = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

            if (catalogProduct == null)
            {
                throw new InvalidOperationException($"Product {productId} not found in catalog {catalogId}");
            }

            // Get base price from pricing rules or catalog settings
            var basePrice = await GetBasePriceAsync(productId, catalogId);

            // Process each locale
            foreach (var localeId in localeIds)
            {
                try
                {
                    var locale = await _context.Locales
                        .Include(l => l.Country)
                        .Include(l => l.Currency)
                        .FirstOrDefaultAsync(l => l.Id == localeId);

                    if (locale == null)
                    {
                        _logger.LogWarning("Locale {LocaleId} not found, skipping", localeId);
                        continue;
                    }

                    await CalculateLocaleSpecificFinancialsAsync(productId, catalogId, localeId, basePrice, catalog, locale);
                    calculatedLocales.Add(localeId);

                    _logger.LogDebug("Calculated financials for locale {LocaleCode} ({LocaleId})", locale.Code, localeId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to calculate financials for locale {LocaleId}", localeId);
                    // Continue with other locales
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully calculated financials for {CalculatedCount} out of {RequestedCount} locales", 
                calculatedLocales.Count, localeIds.Count);

            return calculatedLocales;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating locale financials for product {ProductId} in catalog {CatalogId}", productId, catalogId);
            throw;
        }
    }

    private async Task<decimal> GetBasePriceAsync(Guid productId, Guid catalogId)
    {
        // First check for catalog-specific override price
        var catalogProduct = await _context.CatalogProducts
            .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

        if (catalogProduct?.OverridePrice.HasValue == true)
        {
            return catalogProduct.OverridePrice.Value;
        }

        // Check base prices table
        var basePrice = await _context.BasePrices
            .Where(bp => bp.ProductId == productId && bp.CatalogId == catalogId && bp.IsActive)
            .OrderByDescending(bp => bp.EffectiveFrom)
            .FirstOrDefaultAsync();

        if (basePrice != null)
        {
            return basePrice.Price;
        }

        // Fallback to product base price from Product Staging API
        try
        {
            using var httpClient = new HttpClient();
            var productResponse = await httpClient.GetAsync($"http://localhost:6002/api/products/{productId}");
            if (productResponse.IsSuccessStatusCode)
            {
                var productJson = await productResponse.Content.ReadAsStringAsync();
                var productData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(productJson);
                
                if (productData.TryGetProperty("basePrice", out var priceElement))
                {
                    var productBasePrice = priceElement.GetDecimal();
                    _logger.LogInformation("Using base price {BasePrice} from product staging for product {ProductId}", productBasePrice, productId);
                    return productBasePrice;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch base price from product staging for product {ProductId}", productId);
        }
        
        _logger.LogWarning("No base price found for product {ProductId} in catalog {CatalogId}, using fallback default", productId, catalogId);
        return 199.99m; // Fallback default price
    }

    private async Task CalculateLocaleSpecificFinancialsAsync(
        Guid productId, 
        Guid catalogId, 
        Guid localeId, 
        decimal basePrice,
        Catalog catalog,
        Locale locale)
    {
        // Get or create the locale financial record
        var localeFinancial = await _context.ProductLocaleFinancials
            .FirstOrDefaultAsync(plf => plf.ProductId == productId && 
                                       plf.CatalogId == catalogId && 
                                       plf.LocaleId == localeId);

        var isNewRecord = localeFinancial == null;
        if (isNewRecord)
        {
            localeFinancial = new ProductLocaleFinancial
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                CatalogId = catalogId,
                LocaleId = localeId,
                CreatedAt = DateTime.UtcNow
            };
        }

        // Update basic pricing
        localeFinancial.BasePrice = basePrice;
        localeFinancial.UpdatedAt = DateTime.UtcNow;

        // Currency conversion
        if (locale.Currency?.Code != catalog.Currency?.Code)
        {
            var conversionRate = await _currencyService.GetConversionRateAsync(
                catalog.Currency?.Code ?? "USD", 
                locale.Currency?.Code ?? "USD");
            
            localeFinancial.CurrencyConversionRate = conversionRate;
            localeFinancial.ConversionDate = DateTime.UtcNow;
            localeFinancial.LocalPrice = basePrice * conversionRate;
        }
        else
        {
            localeFinancial.CurrencyConversionRate = 1.0m;
            localeFinancial.LocalPrice = basePrice;
        }

        // Tax calculations based on country
        var taxRate = await GetTaxRateAsync(locale.Country?.Code ?? "US");
        localeFinancial.TaxRate = taxRate;
        localeFinancial.TaxAmount = (localeFinancial.LocalPrice ?? 0) * taxRate;
        localeFinancial.TaxIncludedPrice = (localeFinancial.LocalPrice ?? 0) + localeFinancial.TaxAmount;

        // Regulatory and environmental fees by country
        var fees = await GetRegulatoryFeesAsync(locale.Country?.Code ?? "US");
        localeFinancial.RegulatoryFees = fees.RegulatoryFees;
        localeFinancial.EnvironmentalFees = fees.EnvironmentalFees;

        // Apply price rounding rules based on locale
        ApplyPriceRoundingRules(localeFinancial, locale);

        // Set display format based on locale
        SetDisplayFormat(localeFinancial, locale);

        // Set effective dates
        localeFinancial.EffectiveFrom = DateTime.UtcNow;
        localeFinancial.IsActive = true;

        if (isNewRecord)
        {
            _context.ProductLocaleFinancials.Add(localeFinancial);
        }
    }

    private async Task<decimal> GetTaxRateAsync(string countryCode)
    {
        // This would typically come from a tax service or database
        // For now, using simplified country-based tax rates
        return countryCode.ToUpper() switch
        {
            "US" => 0.0875m,  // Average US sales tax
            "CA" => 0.13m,    // Average Canadian tax
            "GB" => 0.20m,    // UK VAT
            "DE" => 0.19m,    // German VAT
            "FR" => 0.20m,    // French VAT
            "IT" => 0.22m,    // Italian VAT
            "ES" => 0.21m,    // Spanish VAT
            "NL" => 0.21m,    // Dutch VAT
            "RU" => 0.20m,    // Russian VAT
            "AU" => 0.10m,    // Australian GST
            "JP" => 0.10m,    // Japanese consumption tax
            "KR" => 0.10m,    // Korean VAT
            "IN" => 0.18m,    // Indian GST
            "SG" => 0.07m,    // Singapore GST
            _ => 0.10m        // Default rate
        };
    }

    private async Task<(decimal RegulatoryFees, decimal EnvironmentalFees)> GetRegulatoryFeesAsync(string countryCode)
    {
        // This would typically come from a regulatory database
        // For now, using simplified country-based fees
        return countryCode.ToUpper() switch
        {
            "US" => (2.50m, 1.00m),
            "CA" => (3.00m, 1.50m),
            "GB" => (1.80m, 2.20m),
            "DE" => (2.20m, 3.50m),  // Higher environmental fees in Germany
            "FR" => (2.00m, 2.80m),
            "RU" => (1.50m, 0.50m),  // Lower environmental fees
            "AU" => (2.80m, 2.00m),
            "JP" => (1.20m, 1.80m),
            _ => (1.00m, 1.00m)
        };
    }

    private void ApplyPriceRoundingRules(ProductLocaleFinancial localeFinancial, Locale locale)
    {
        // Get rounding precision based on currency
        var precision = locale.Currency?.DecimalPlaces ?? 2;
        var roundingMultiple = (decimal)Math.Pow(10, -precision);

        // Apply rounding to all price fields
        if (localeFinancial.LocalPrice.HasValue)
        {
            localeFinancial.LocalPrice = Math.Round(localeFinancial.LocalPrice.Value / roundingMultiple) * roundingMultiple;
        }

        if (localeFinancial.TaxIncludedPrice.HasValue)
        {
            localeFinancial.TaxIncludedPrice = Math.Round(localeFinancial.TaxIncludedPrice.Value / roundingMultiple) * roundingMultiple;
        }

        // Update the price rounding rules JSON
        localeFinancial.PriceRoundingRules = System.Text.Json.JsonDocument.Parse($@"{{
            ""type"": ""standard"",
            ""direction"": ""nearest"",
            ""precision"": {roundingMultiple:F4},
            ""currency_precision"": {precision}
        }}");
    }

    private void SetDisplayFormat(ProductLocaleFinancial localeFinancial, Locale locale)
    {
        // Determine currency symbol position based on locale
        var symbolPosition = locale.Code?.StartsWith("en") == true ? "before" : "after";
        
        // Set display format JSON
        localeFinancial.DisplayFormat = System.Text.Json.JsonDocument.Parse($@"{{
            ""show_savings"": true,
            ""show_tax_inclusive"": {(locale.Country?.Code == "GB" || locale.Country?.Code == "DE" ? "true" : "false")},
            ""currency_symbol_position"": ""{symbolPosition}"",
            ""thousand_separator"": ""{(locale.Code?.StartsWith("en") == true ? "," : ".")}"",
            ""decimal_separator"": ""{(locale.Code?.StartsWith("en") == true ? "." : ",")}"",
            ""currency_code"": ""{locale.Currency?.Code ?? "USD"}""
        }}");
    }
}

/// <summary>
/// Currency conversion service interface
/// </summary>
public interface ICurrencyConversionService
{
    Task<decimal> GetConversionRateAsync(string fromCurrency, string toCurrency);
    Task RefreshRatesAsync();
}

/// <summary>
/// Simple currency conversion service
/// In production, this would integrate with a real currency API
/// </summary>
public class CurrencyConversionService : ICurrencyConversionService
{
    private readonly ILogger<CurrencyConversionService> _logger;
    private readonly Dictionary<string, decimal> _exchangeRates;

    public CurrencyConversionService(ILogger<CurrencyConversionService> logger)
    {
        _logger = logger;
        
        // Mock exchange rates (USD base)
        _exchangeRates = new Dictionary<string, decimal>
        {
            ["USD"] = 1.0m,
            ["EUR"] = 0.85m,
            ["GBP"] = 0.73m,
            ["CAD"] = 1.25m,
            ["AUD"] = 1.35m,
            ["JPY"] = 110.0m,
            ["KRW"] = 1180.0m,
            ["INR"] = 74.5m,
            ["SGD"] = 1.35m,
            ["RUB"] = 75.0m,
            ["CNY"] = 6.45m
        };
    }

    public async Task<decimal> GetConversionRateAsync(string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return 1.0m;

        await Task.Delay(50); // Simulate API call

        if (_exchangeRates.TryGetValue(fromCurrency, out var fromRate) && 
            _exchangeRates.TryGetValue(toCurrency, out var toRate))
        {
            var rate = toRate / fromRate;
            _logger.LogDebug("Currency conversion rate from {FromCurrency} to {ToCurrency}: {Rate}", 
                fromCurrency, toCurrency, rate);
            return rate;
        }

        _logger.LogWarning("Exchange rate not found for {FromCurrency} to {ToCurrency}, using 1.0", 
            fromCurrency, toCurrency);
        return 1.0m;
    }

    public async Task RefreshRatesAsync()
    {
        _logger.LogInformation("Refreshing currency exchange rates");
        // In production, this would call a real currency API like OpenExchangeRates, Fixer.io, etc.
        await Task.Delay(1000); // Simulate API call
        _logger.LogInformation("Currency rates refreshed successfully");
    }
}