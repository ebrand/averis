using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service interface for integrating with Pricing MDM API
/// Handles catalog and pricing operations
/// </summary>
public interface IPricingService
{
    /// <summary>
    /// Get available regions from Pricing MDM
    /// </summary>
    Task<List<RegionDto>> GetRegionsAsync();

    /// <summary>
    /// Get available channels from Pricing MDM
    /// </summary>
    Task<List<ChannelDto>> GetChannelsAsync();

    /// <summary>
    /// Get default catalog for a region and channel
    /// </summary>
    Task<CatalogDto?> GetDefaultCatalogAsync(string regionCode, string channelCode);

    /// <summary>
    /// Get catalogs for a region
    /// </summary>
    Task<List<CatalogDto>> GetCatalogsByRegionAsync(string regionCode);

    /// <summary>
    /// Get catalog by ID
    /// </summary>
    Task<CatalogDto?> GetCatalogByIdAsync(string catalogId);

    /// <summary>
    /// Get catalog products with pricing
    /// </summary>
    Task<CatalogProductsResponse> GetCatalogProductsAsync(string catalogId, int page = 1, int limit = 50, string? search = null);

    /// <summary>
    /// Calculate detailed pricing for a product
    /// </summary>
    Task<DetailedPricingResponse?> CalculateProductPricingAsync(string productId, string catalogId, int quantity = 1);

    /// <summary>
    /// Health check for pricing service connectivity
    /// </summary>
    Task<HealthCheckResult> HealthCheckAsync();

    /// <summary>
    /// Enrich products with pricing information from catalog
    /// </summary>
    Task<List<EcommerceProductDto>> EnrichProductsWithPricingAsync(List<EcommerceProduct> products, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT");
}

public class RegionDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ChannelDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CatalogDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RegionCode { get; set; } = string.Empty;
    public string ChannelCode { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "USD";
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
}

public class CatalogProductDto
{
    public string SkuCode { get; set; } = string.Empty;
    public decimal ListPrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal? OverrideBasePrice { get; set; }
    public bool IsActive { get; set; }
}

public class CatalogProductsResponse
{
    public List<CatalogProductDto> Products { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class PaginationInfo
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Pages { get; set; }
}

public class DetailedPricingResponse
{
    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public bool HasDiscount { get; set; }
    public List<PriceBreak> PriceBreaks { get; set; } = new();
    public string? Error { get; set; }
}

public class PriceBreak
{
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Discount { get; set; }
}

public class HealthCheckResult
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public bool IsHealthy => Status == "healthy";
}