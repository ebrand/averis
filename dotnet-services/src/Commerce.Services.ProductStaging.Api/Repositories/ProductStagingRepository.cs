using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Data.Repositories;
using Commerce.Services.ProductStaging.Api.Data;
using System.Linq.Expressions;

namespace Commerce.Services.ProductStaging.Api.Repositories;

/// <summary>
/// Repository implementation for Product Staging data operations
/// Queries from the staging schema (averis_product_staging.products)
/// </summary>
public class ProductStagingRepository : IProductRepository
{
    private readonly ProductStagingDbContext _context;

    public ProductStagingRepository(ProductStagingDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<(IEnumerable<Product> Products, int TotalCount)> GetProductsAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? status = null,
        string? type = null,
        bool? available = null,
        bool? webDisplay = null,
        bool? licenseRequired = null,
        bool? contractItem = null,
        string sortBy = "name",
        string sortOrder = "ASC")
    {
        var query = _context.Products.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => 
                EF.Functions.ILike(p.Name, $"%{search}%") ||
                EF.Functions.ILike(p.Sku, $"%{search}%") ||
                EF.Functions.ILike(p.Description ?? "", $"%{search}%"));
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(p => p.Type == type);
        }

        if (available.HasValue)
        {
            query = query.Where(p => p.AvailableFlag == available.Value);
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
            "name" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "sku" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Sku) : query.OrderBy(p => p.Sku),
            "status" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
            "createdat" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "updatedat" => sortOrder.ToUpper() == "DESC" ? query.OrderByDescending(p => p.UpdatedAt) : query.OrderBy(p => p.UpdatedAt),
            _ => query.OrderBy(p => p.Name)
        };

        // Apply pagination
        var products = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (products, totalCount);
    }

    public async Task<Product?> GetProductByIdAsync(Guid id)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetProductBySkuAsync(string sku)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Sku == sku);
    }

    public async Task<IEnumerable<Product>> GetProductsByIdsAsync(IEnumerable<Guid> ids)
    {
        return await _context.Products
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetProductsBySkusAsync(IEnumerable<string> skus)
    {
        return await _context.Products
            .Where(p => skus.Contains(p.Sku))
            .ToListAsync();
    }

    public async Task<bool> ProductExistsAsync(Guid id)
    {
        return await _context.Products
            .AnyAsync(p => p.Id == id);
    }

    public async Task<bool> ProductExistsBySkuAsync(string sku)
    {
        return await _context.Products
            .AnyAsync(p => p.Sku == sku);
    }

    public async Task<IEnumerable<string>> GetDistinctTypesAsync()
    {
        return await _context.Products
            .Where(p => !string.IsNullOrEmpty(p.Type))
            .Select(p => p.Type!)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
    }

    public async Task<IEnumerable<string>> GetDistinctStatusesAsync()
    {
        return await _context.Products
            .Where(p => !string.IsNullOrEmpty(p.Status))
            .Select(p => p.Status!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
    }

    public async Task<bool> ProductExistsBySkuAsync(string sku, Guid? excludeId = null)
    {
        var query = _context.Products.Where(p => p.Sku == sku);
        
        if (excludeId.HasValue)
        {
            query = query.Where(p => p.Id != excludeId.Value);
        }
        
        return await query.AnyAsync();
    }

    public async Task<ProductAnalyticsDto> GetProductAnalyticsAsync()
    {
        var totalProducts = await _context.Products.CountAsync();
        var activeProducts = await _context.Products.CountAsync(p => p.Status == "active");
        var availableProducts = await _context.Products.CountAsync(p => p.AvailableFlag);
        var webDisplayProducts = await _context.Products.CountAsync(p => p.WebDisplayFlag);
        var licensedProducts = await _context.Products.CountAsync(p => p.LicenseRequiredFlag);
        var contractProducts = await _context.Products.CountAsync(p => p.ContractItemFlag);
        var productTypes = await _context.Products.Where(p => !string.IsNullOrEmpty(p.Type)).Select(p => p.Type).Distinct().CountAsync();
        
        var averageBasePrice = await _context.Products.Where(p => p.BasePrice > 0).AverageAsync(p => (decimal?)p.BasePrice) ?? 0;
        var totalActiveValue = await _context.Products.Where(p => p.Status == "active" && p.BasePrice > 0).SumAsync(p => p.BasePrice);
        
        return new ProductAnalyticsDto
        {
            TotalProducts = totalProducts,
            ActiveProducts = activeProducts,
            AvailableProducts = availableProducts,
            WebDisplayProducts = webDisplayProducts,
            LicensedProducts = licensedProducts,
            ContractProducts = contractProducts,
            ProductTypes = productTypes,
            AverageBasePrice = averageBasePrice,
            TotalActiveValue = totalActiveValue,
            Source = "product-staging-api"
        };
    }

    public async Task<IEnumerable<string>> GetProductTypesAsync()
    {
        return await _context.Products
            .Where(p => !string.IsNullOrEmpty(p.Type))
            .Select(p => p.Type!)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetProductsByStatusAsync(string status)
    {
        return await _context.Products
            .Where(p => p.Status == status)
            .ToListAsync();
    }

    // The following methods are read-only for staging - they throw NotSupportedException
    public Task<Product> CreateProductAsync(Product product)
    {
        throw new NotSupportedException("Product Staging API is read-only. Use Product MDM API for modifications.");
    }

    public Task<Product> UpdateProductAsync(Product product)
    {
        throw new NotSupportedException("Product Staging API is read-only. Use Product MDM API for modifications.");
    }

    public Task<bool> DeleteProductAsync(Guid id)
    {
        throw new NotSupportedException("Product Staging API is read-only. Use Product MDM API for modifications.");
    }
}