using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;
using System.Linq.Expressions;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository implementation for Product Cache data operations
/// Handles high-performance operations on cached active products
/// </summary>
public class ProductCacheRepository : IProductCacheRepository
{
    private readonly ProductCacheDbContext _context;

    public ProductCacheRepository(ProductCacheDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<(IEnumerable<Product> Products, int TotalCount)> GetCachedProductsAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? type = null,
        bool? webDisplay = null,
        bool? licenseRequired = null,
        bool? contractItem = null,
        string sortBy = "name",
        string sortOrder = "ASC")
    {
        var query = _context.Products.AsQueryable();

        // Note: Status = 'active' is enforced by database constraint
        
        // Apply filters
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => 
                p.Name.ToLower().Contains(searchLower) ||
                p.Description.ToLower().Contains(searchLower) ||
                p.Sku.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(p => p.Type == type);
        }

        if (webDisplay.HasValue)
        {
            query = query.Where(p => p.WebDisplayFlag == webDisplay.Value);
        }

        if (licenseRequired.HasValue)
        {
            query = query.Where(p => p.LicenseRequiredFlag == licenseRequired.Value);
        }

        if (contractItem.HasValue)
        {
            query = query.Where(p => p.ContractItemFlag == contractItem.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "sku" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Sku) : query.OrderBy(p => p.Sku),
            "type" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Type) : query.OrderBy(p => p.Type),
            "baseprice" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.BasePrice) : query.OrderBy(p => p.BasePrice),
            "createdat" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "syncedat" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.SyncedAt) : query.OrderBy(p => p.SyncedAt),
            _ => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name)
        };

        // Apply pagination
        var products = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (products, totalCount);
    }

    public async Task<Product?> GetCachedProductByIdAsync(Guid id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product?> GetCachedProductBySkuAsync(string sku)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Sku == sku);
    }

    public async Task<Product> UpsertCachedProductAsync(Product product)
    {
        // Ensure product is active (constraint will enforce this)
        if (product.Status != "active")
        {
            throw new InvalidOperationException("Only active products can be cached");
        }

        // Set cache synchronization data
        product.SyncedAt = DateTime.UtcNow;
        product.SourceVersion = GenerateVersionHash(product);

        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == product.Id);

        if (existingProduct != null)
        {
            // Update existing product
            _context.Entry(existingProduct).CurrentValues.SetValues(product);
            
            // Handle JSONB fields manually
            existingProduct.Categorization = product.Categorization;
            existingProduct.Pricing = product.Pricing;
            existingProduct.Approvals = product.Approvals;
        }
        else
        {
            // Insert new product
            await _context.Products.AddAsync(product);
        }

        await _context.SaveChangesAsync();
        return existingProduct ?? product;
    }

    public async Task<bool> RemoveCachedProductAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveCachedProductBySkuAsync(string sku)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Sku == sku);
        
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ProductAnalyticsDto> GetCachedProductAnalyticsAsync()
    {
        var analytics = await _context.Products
            .GroupBy(p => 1) // Group all products together
            .Select(g => new ProductAnalyticsDto
            {
                TotalProducts = g.Count(),
                ActiveProducts = g.Count(), // All cached products are active
                AvailableProducts = g.Count(p => p.AvailableFlag),
                WebDisplayProducts = g.Count(p => p.WebDisplayFlag),
                LicensedProducts = g.Count(p => p.LicenseRequiredFlag),
                ContractProducts = g.Count(p => p.ContractItemFlag),
                ProductTypes = g.Select(p => p.Type).Where(t => !string.IsNullOrEmpty(t)).Distinct().Count(),
                AverageBasePrice = g.Average(p => p.BasePrice),
                TotalActiveValue = g.Sum(p => p.BasePrice),
                Source = "product-cache"
            })
            .FirstOrDefaultAsync();

        return analytics ?? new ProductAnalyticsDto { Source = "product-cache" };
    }

    public async Task<IEnumerable<string>> GetCachedProductTypesAsync()
    {
        return await _context.Products
            .Where(p => !string.IsNullOrEmpty(p.Type))
            .Select(p => p.Type)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
    }

    public async Task<CacheSyncStatusDto> GetCacheSyncStatusAsync()
    {
        var products = await _context.Products.ToListAsync();
        
        var status = new CacheSyncStatusDto
        {
            TotalCachedProducts = products.Count,
            LastSyncAt = products.Any() ? products.Max(p => p.SyncedAt) : null,
            OldestProductSyncAt = products.Any() ? products.Min(p => p.SyncedAt) : null,
            NewestProductSyncAt = products.Any() ? products.Max(p => p.SyncedAt) : null,
            IsHealthy = true,
            Issues = new List<string>()
        };

        // Health checks
        var now = DateTime.UtcNow;
        var staleThreshold = now.AddHours(-24); // Consider products stale after 24 hours

        var staleProducts = products.Count(p => p.SyncedAt < staleThreshold);
        if (staleProducts > 0)
        {
            status.Issues.Add($"{staleProducts} products have stale cache data (>24h)");
            status.IsHealthy = false;
        }

        var productsWithoutSync = products.Count(p => !p.SyncedAt.HasValue);
        if (productsWithoutSync > 0)
        {
            status.Issues.Add($"{productsWithoutSync} products missing sync timestamps");
            status.IsHealthy = false;
        }

        return status;
    }

    public async Task<int> BulkUpsertCachedProductsAsync(IEnumerable<Product> products)
    {
        var activeProducts = products.Where(p => p.Status == "active").ToList();
        var count = 0;

        foreach (var product in activeProducts)
        {
            product.SyncedAt = DateTime.UtcNow;
            product.SourceVersion = GenerateVersionHash(product);

            var existing = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            if (existing != null)
            {
                _context.Entry(existing).CurrentValues.SetValues(product);
                existing.Categorization = product.Categorization;
                existing.Pricing = product.Pricing;
                existing.Approvals = product.Approvals;
            }
            else
            {
                await _context.Products.AddAsync(product);
            }
            count++;
        }

        await _context.SaveChangesAsync();
        return count;
    }

    public async Task<bool> ClearCacheAsync()
    {
        var allProducts = await _context.Products.ToListAsync();
        _context.Products.RemoveRange(allProducts);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ServiceHealthResult> HealthCheckAsync()
    {
        try
        {
            var result = new ServiceHealthResult
            {
                Status = "healthy",
                Service = "ProductCacheService",
                Timestamp = DateTime.UtcNow
            };

            // Check database connectivity
            try
            {
                var analytics = await GetCachedProductAnalyticsAsync();
                var syncStatus = await GetCacheSyncStatusAsync();
                var productTypes = await GetCachedProductTypesAsync();
                
                result.Database = new DatabaseHealthInfo
                {
                    Status = "healthy",
                    Schema = "product_cache",
                    RecordCount = (int)analytics.TotalProducts
                };

                result.Cache = new CacheHealthInfo
                {
                    Status = syncStatus.IsHealthy ? "healthy" : "degraded",
                    LastSync = syncStatus.LastSyncAt,
                    IsHealthy = syncStatus.IsHealthy,
                    Issues = syncStatus.Issues
                };

                // Gather comprehensive statistics
                result.Stats = new StatisticsInfo
                {
                    CachedProducts = (int)analytics.TotalProducts,
                    TotalProducts = (int)analytics.TotalProducts,
                    ActiveProducts = (int)analytics.ActiveProducts,
                    TotalProductTypes = productTypes.Count(),
                    ProductsByType = new Dictionary<string, int>() // Would need additional query for detailed breakdown
                };

                // If cache has issues, mark overall status as degraded
                if (!syncStatus.IsHealthy)
                {
                    result.Status = "degraded";
                }
            }
            catch (Exception dbEx)
            {
                result.Database = new DatabaseHealthInfo
                {
                    Status = "error",
                    Schema = "product_cache",
                    Error = dbEx.Message
                };
                result.Status = "degraded";
            }

            return result;
        }
        catch (Exception ex)
        {
            return new ServiceHealthResult
            {
                Status = "error",
                Service = "ProductCacheService",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            };
        }
    }

    private static string GenerateVersionHash(Product product)
    {
        // Generate a simple hash based on key product properties
        var content = $"{product.Id}{product.Name}{product.BasePrice}{product.UpdatedAt:yyyy-MM-dd HH:mm:ss}";
        return content.GetHashCode().ToString("X");
    }
}