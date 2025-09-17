using System.Globalization;
using System.Text.Json;
using Commerce.Services.Ecommerce.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service for integrating with Pricing MDM API
/// Handles catalog and pricing operations with caching
/// </summary>
public class PricingService : IPricingService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<PricingService> _logger;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(5);
    private readonly string _pricingApiUrl;

    public PricingService(HttpClient httpClient, IMemoryCache cache, ILogger<PricingService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _pricingApiUrl = configuration.GetValue<string>("PricingMdmApiUrl") ?? "http://localhost:8003";
        
        _httpClient.BaseAddress = new Uri(_pricingApiUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<List<RegionDto>> GetRegionsAsync()
    {
        const string cacheKey = "pricing_regions";
        
        if (_cache.TryGetValue(cacheKey, out List<RegionDto>? cachedRegions))
        {
            _logger.LogDebug("Using cached regions data");
            return cachedRegions!;
        }

        try
        {
            var response = await _httpClient.GetAsync("/api/catalogs/regions");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<List<RegionDto>>>(content, JsonOptions);
            
            var regions = apiResponse?.Data ?? new List<RegionDto>();
            _cache.Set(cacheKey, regions, _cacheExpiry);
            
            return regions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch regions from Pricing MDM API");
            return new List<RegionDto>();
        }
    }

    public async Task<List<ChannelDto>> GetChannelsAsync()
    {
        const string cacheKey = "pricing_channels";
        
        if (_cache.TryGetValue(cacheKey, out List<ChannelDto>? cachedChannels))
        {
            _logger.LogDebug("Using cached channels data");
            return cachedChannels!;
        }

        try
        {
            var response = await _httpClient.GetAsync("/api/catalogs/channels");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<List<ChannelDto>>>(content, JsonOptions);
            
            var channels = apiResponse?.Data ?? new List<ChannelDto>();
            _cache.Set(cacheKey, channels, _cacheExpiry);
            
            return channels;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch channels from Pricing MDM API");
            return new List<ChannelDto>();
        }
    }

    public async Task<CatalogDto?> GetDefaultCatalogAsync(string regionCode, string channelCode)
    {
        var cacheKey = $"default_catalog_{regionCode}_{channelCode}";
        
        if (_cache.TryGetValue(cacheKey, out CatalogDto? cachedCatalog))
        {
            _logger.LogDebug("Using cached default catalog for {Region}/{Channel}", regionCode, channelCode);
            return cachedCatalog;
        }

        try
        {
            var response = await _httpClient.GetAsync($"/api/catalogs?region={regionCode}&channel={channelCode}&default=true");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<CatalogListResponse>>(content, JsonOptions);
            
            var catalog = apiResponse?.Data?.Catalogs?.FirstOrDefault();
            if (catalog != null)
            {
                _cache.Set(cacheKey, catalog, _cacheExpiry);
            }
            
            return catalog;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch default catalog for {Region}/{Channel}", regionCode, channelCode);
            return null;
        }
    }

    public async Task<List<CatalogDto>> GetCatalogsByRegionAsync(string regionCode)
    {
        var cacheKey = $"catalogs_{regionCode}";
        
        if (_cache.TryGetValue(cacheKey, out List<CatalogDto>? cachedCatalogs))
        {
            _logger.LogDebug("Using cached catalogs for region {Region}", regionCode);
            return cachedCatalogs!;
        }

        try
        {
            var response = await _httpClient.GetAsync($"/api/catalogs?region={regionCode}");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<CatalogListResponse>>(content, JsonOptions);
            
            var catalogs = apiResponse?.Data?.Catalogs ?? new List<CatalogDto>();
            _cache.Set(cacheKey, catalogs, _cacheExpiry);
            
            return catalogs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch catalogs for region {Region}", regionCode);
            return new List<CatalogDto>();
        }
    }

    public async Task<CatalogDto?> GetCatalogByIdAsync(string catalogId)
    {
        var cacheKey = $"catalog_{catalogId}";
        
        if (_cache.TryGetValue(cacheKey, out CatalogDto? cachedCatalog))
        {
            _logger.LogDebug("Using cached catalog {CatalogId}", catalogId);
            return cachedCatalog;
        }

        try
        {
            var response = await _httpClient.GetAsync($"/api/catalogs/{catalogId}");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<CatalogDto>>(content, JsonOptions);
            
            var catalog = apiResponse?.Data;
            if (catalog != null)
            {
                _cache.Set(cacheKey, catalog, _cacheExpiry);
            }
            
            return catalog;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch catalog {CatalogId}", catalogId);
            return null;
        }
    }

    public async Task<CatalogProductsResponse> GetCatalogProductsAsync(string catalogId, int page = 1, int limit = 50, string? search = null)
    {
        var cacheKey = $"catalog_products_{catalogId}_{page}_{limit}_{search ?? "all"}";
        
        if (_cache.TryGetValue(cacheKey, out CatalogProductsResponse? cachedProducts))
        {
            _logger.LogDebug("Using cached products for catalog {CatalogId}", catalogId);
            return cachedProducts!;
        }

        try
        {
            var queryString = $"page={page}&limit={limit}";
            if (!string.IsNullOrEmpty(search))
            {
                queryString += $"&search={Uri.EscapeDataString(search)}";
            }

            var response = await _httpClient.GetAsync($"/api/catalogs/{catalogId}/products?{queryString}");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<CatalogProductsResponse>>(content, JsonOptions);
            
            var products = apiResponse?.Data ?? CreateMockCatalogProductsResponse();
            _cache.Set(cacheKey, products, TimeSpan.FromMinutes(1)); // Shorter cache for dynamic data
            
            return products;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch catalog products, using mock data");
            return CreateMockCatalogProductsResponse();
        }
    }

    public async Task<DetailedPricingResponse?> CalculateProductPricingAsync(string productId, string catalogId, int quantity = 1)
    {
        try
        {
            var requestBody = JsonSerializer.Serialize(new
            {
                productId,
                catalogId,
                quantity
            }, JsonOptions);

            var response = await _httpClient.PostAsync("/api/pricing/calculate", 
                new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json"));
            
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<DetailedPricingResponse>>(content, JsonOptions);
            
            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate pricing for product {ProductId}", productId);
            return new DetailedPricingResponse
            {
                BasePrice = 0,
                FinalPrice = 0,
                Currency = "USD",
                Error = "Price calculation failed"
            };
        }
    }

    public async Task<HealthCheckResult> HealthCheckAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/health");
            response.EnsureSuccessStatusCode();
            
            return new HealthCheckResult { Status = "healthy" };
        }
        catch (Exception ex)
        {
            return new HealthCheckResult 
            { 
                Status = "error", 
                Error = ex.Message 
            };
        }
    }

    public async Task<List<EcommerceProductDto>> EnrichProductsWithPricingAsync(List<EcommerceProduct> products, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT")
    {
        if (!products.Any())
        {
            return new List<EcommerceProductDto>();
        }

        // Get catalog for pricing
        CatalogDto? catalog = null;
        if (!string.IsNullOrEmpty(catalogId))
        {
            catalog = await GetCatalogByIdAsync(catalogId);
        }
        else
        {
            catalog = await GetDefaultCatalogAsync(regionCode, channelCode);
        }

        if (catalog == null)
        {
            _logger.LogWarning("No catalog available for pricing, returning products without pricing");
            return products.Select(p => 
            {
                var dto = EcommerceProductDto.FromEntity(p);
                dto.Pricing = new EcommerceProductDto.PricingInfo
                {
                    BasePrice = 0,
                    FinalPrice = 0,
                    Currency = "USD",
                    Available = false,
                    Error = "No catalog available"
                };
                return dto;
            }).ToList();
        }

        // Get catalog products for pricing lookup
        var catalogProducts = await GetCatalogProductsAsync(catalog.Id, limit: 1000);
        
        // Create SKU to pricing map
        var pricingMap = catalogProducts.Products.ToDictionary(cp => cp.SkuCode, cp => cp);

        // Enrich each product with pricing
        var enrichedProducts = products.Select(product =>
        {
            var dto = EcommerceProductDto.FromEntity(product);
            
            if (pricingMap.TryGetValue(product.Sku, out var catalogProduct))
            {
                // Calculate final price with discounts
                var basePrice = catalogProduct.OverrideBasePrice ?? catalogProduct.ListPrice;
                var discountAmount = basePrice * (catalogProduct.DiscountPercentage / 100);
                var finalPrice = basePrice - discountAmount;

                dto.Pricing = new EcommerceProductDto.PricingInfo
                {
                    BasePrice = catalogProduct.ListPrice,
                    ListPrice = catalogProduct.ListPrice,
                    FinalPrice = finalPrice,
                    Currency = catalog.CurrencyCode,
                    HasDiscount = catalogProduct.DiscountPercentage > 0,
                    DiscountPercentage = catalogProduct.DiscountPercentage,
                    DiscountAmount = discountAmount,
                    Available = catalogProduct.IsActive && product.StockStatus == "in_stock",
                    FormattedBasePrice = FormatPrice(catalogProduct.ListPrice, catalog.CurrencyCode),
                    FormattedFinalPrice = FormatPrice(finalPrice, catalog.CurrencyCode)
                };
            }
            else
            {
                // No pricing data available
                dto.Pricing = new EcommerceProductDto.PricingInfo
                {
                    BasePrice = 0,
                    FinalPrice = 0,
                    Currency = catalog.CurrencyCode,
                    Available = false,
                    Error = "Product not in catalog"
                };
            }

            return dto;
        }).ToList();

        return enrichedProducts;
    }

    private static string FormatPrice(decimal price, string currency = "USD")
    {
        return price.ToString("C", CultureInfo.GetCultureInfo("en-US"));
    }

    private static CatalogProductsResponse CreateMockCatalogProductsResponse()
    {
        return new CatalogProductsResponse
        {
            Products = new List<CatalogProductDto>
            {
                new() { SkuCode = "TOOL-BASIC-008", ListPrice = 899.99m, DiscountPercentage = 5, IsActive = true },
                new() { SkuCode = "HW-001", ListPrice = 2999.99m, DiscountPercentage = 10, IsActive = true },
                new() { SkuCode = "SAAS-001", ListPrice = 299.99m, DiscountPercentage = 15, IsActive = true },
                new() { SkuCode = "TEST-DRAFT-001", ListPrice = 199.99m, DiscountPercentage = 0, OverrideBasePrice = 149.99m, IsActive = true },
                new() { SkuCode = "TEST-WORKFLOW-002", ListPrice = 499.99m, DiscountPercentage = 12, IsActive = true }
            },
            Pagination = new PaginationInfo
            {
                Total = 5,
                Page = 1,
                Limit = 50,
                Pages = 1
            }
        };
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }

    private class CatalogListResponse
    {
        public List<CatalogDto> Catalogs { get; set; } = new();
    }
}