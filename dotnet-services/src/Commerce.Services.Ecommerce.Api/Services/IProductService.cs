using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service interface for product operations in the e-commerce context
/// </summary>
public interface IProductService
{
    /// <summary>
    /// Get products with catalog pricing integration
    /// </summary>
    Task<ProductPagedResult> GetProductsAsync(ProductSearchRequest request);

    /// <summary>
    /// Get single product by ID with pricing
    /// </summary>
    Task<EcommerceProductDto?> GetProductByIdAsync(Guid productId, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT");

    /// <summary>
    /// Get single product by SKU with pricing
    /// </summary>
    Task<EcommerceProductDto?> GetProductBySkuAsync(string sku, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT");

    /// <summary>
    /// Search products with full-text search
    /// </summary>
    Task<ProductPagedResult> SearchProductsAsync(string searchTerm, ProductSearchRequest request);

    /// <summary>
    /// Get product categories
    /// </summary>
    Task<List<CategoryDto>> GetCategoriesAsync();

    /// <summary>
    /// Get all products for admin view (includes all statuses and detailed fields)
    /// </summary>
    Task<ProductPagedResult> GetAdminProductsAsync(AdminProductSearchRequest request);

    /// <summary>
    /// Health check for product service
    /// </summary>
    Task<ServiceHealthResult> HealthCheckAsync();
}

public class ProductSearchRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public string Status { get; set; } = "active";
    public string? CatalogId { get; set; }
    public string RegionCode { get; set; } = "AMER";
    public string ChannelCode { get; set; } = "DIRECT";
    public string LocaleCode { get; set; } = "en_US";
}

public class AdminProductSearchRequest
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 100;
    public string? Search { get; set; }
    public string? Status { get; set; } // If not specified, return all statuses
}

public class ProductPagedResult
{
    public List<EcommerceProductDto> Products { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
    public CatalogInfo? Catalog { get; set; }
}

public class PaginationDto
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int Pages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public int ProductCount { get; set; }
}

public class CatalogInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public string Region { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
}

public class ServiceHealthResult
{
    public string Status { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public DatabaseHealthInfo? Database { get; set; }
    public PricingServiceHealthInfo? PricingService { get; set; }
    public StatisticsInfo? Stats { get; set; }
    public string? Error { get; set; }
}

public class DatabaseHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
}

public class PricingServiceHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
}

public class StatisticsInfo
{
    public int ActiveProducts { get; set; }
    public int TotalCategories { get; set; }
}