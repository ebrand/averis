using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository interface for Product Cache data operations
/// Handles cached active products in separate database schema for high performance
/// </summary>
public interface IProductCacheRepository
{
    /// <summary>
    /// Get cached products with filtering, sorting, and pagination
    /// Only returns active products from cache
    /// </summary>
    Task<(IEnumerable<Product> Products, int TotalCount)> GetCachedProductsAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? type = null,
        bool? webDisplay = null,
        bool? licenseRequired = null,
        bool? contractItem = null,
        string sortBy = "name",
        string sortOrder = "ASC");

    /// <summary>
    /// Get a cached product by ID
    /// </summary>
    Task<Product?> GetCachedProductByIdAsync(Guid id);

    /// <summary>
    /// Get a cached product by SKU
    /// </summary>
    Task<Product?> GetCachedProductBySkuAsync(string sku);

    /// <summary>
    /// Upsert (insert or update) a product in the cache
    /// Used by messaging system to sync active products
    /// </summary>
    Task<Product> UpsertCachedProductAsync(Product product);

    /// <summary>
    /// Remove a product from cache (when it becomes inactive)
    /// </summary>
    Task<bool> RemoveCachedProductAsync(Guid id);

    /// <summary>
    /// Remove a product from cache by SKU
    /// </summary>
    Task<bool> RemoveCachedProductBySkuAsync(string sku);

    /// <summary>
    /// Get product analytics for cached products only
    /// </summary>
    Task<ProductAnalyticsDto> GetCachedProductAnalyticsAsync();

    /// <summary>
    /// Get distinct product types from cache
    /// </summary>
    Task<IEnumerable<string>> GetCachedProductTypesAsync();

    /// <summary>
    /// Get cache synchronization status
    /// </summary>
    Task<CacheSyncStatusDto> GetCacheSyncStatusAsync();

    /// <summary>
    /// Bulk upsert products for efficient synchronization
    /// </summary>
    Task<int> BulkUpsertCachedProductsAsync(IEnumerable<Product> products);

    /// <summary>
    /// Clear all cached products (for full resync scenarios)
    /// </summary>
    Task<bool> ClearCacheAsync();

    /// <summary>
    /// Perform comprehensive health check including database connectivity and cache statistics
    /// </summary>
    Task<ServiceHealthResult> HealthCheckAsync();
}