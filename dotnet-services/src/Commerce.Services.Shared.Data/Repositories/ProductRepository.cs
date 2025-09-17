using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;
using System.Linq.Expressions;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository implementation for Product data operations
/// Handles all database interactions for Product entities
/// </summary>
public class ProductRepository : IProductRepository
{
    private readonly ProductMdmDbContext _context;

    public ProductRepository(ProductMdmDbContext context)
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
            var searchLower = search.ToLower();
            query = query.Where(p => 
                p.Name.ToLower().Contains(searchLower) ||
                p.Description.ToLower().Contains(searchLower) ||
                p.Sku.ToLower().Contains(searchLower));
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
        query = ApplySorting(query, sortBy, sortOrder);

        // Apply pagination
        var skip = (page - 1) * limit;
        var products = await query
            .Skip(skip)
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

    public async Task<Product> CreateProductAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateProductAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return false;
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
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
        var analytics = await _context.Products
            .GroupBy(p => 1) // Group all products together
            .Select(g => new ProductAnalyticsDto
            {
                TotalProducts = g.Count(),
                ActiveProducts = g.Count(p => p.Status == "active"),
                AvailableProducts = g.Count(p => p.AvailableFlag),
                WebDisplayProducts = g.Count(p => p.WebDisplayFlag),
                LicensedProducts = g.Count(p => p.LicenseRequiredFlag),
                ContractProducts = g.Count(p => p.ContractItemFlag),
                ProductTypes = g.Select(p => p.Type).Where(t => !string.IsNullOrEmpty(t)).Distinct().Count(),
                AverageBasePrice = g.Average(p => p.BasePrice),
                TotalActiveValue = g.Where(p => p.Status == "active" && p.AvailableFlag).Sum(p => p.BasePrice)
            })
            .FirstOrDefaultAsync();

        return analytics ?? new ProductAnalyticsDto();
    }

    public async Task<IEnumerable<string>> GetProductTypesAsync()
    {
        return await _context.Products
            .Where(p => !string.IsNullOrEmpty(p.Type))
            .Select(p => p.Type)
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

    private static IQueryable<Product> ApplySorting(IQueryable<Product> query, string sortBy, string sortOrder)
    {
        var isAscending = sortOrder.Equals("ASC", StringComparison.OrdinalIgnoreCase);

        Expression<Func<Product, object>> sortExpression = sortBy.ToLower() switch
        {
            "sku" => p => p.Sku,
            "name" => p => p.Name,
            "status" => p => p.Status,
            "type" => p => p.Type,
            "baseprice" => p => p.BasePrice,
            "base_price" => p => p.BasePrice,
            "createdat" => p => p.CreatedAt,
            "created_at" => p => p.CreatedAt,
            "updatedat" => p => p.UpdatedAt,
            "updated_at" => p => p.UpdatedAt,
            _ => p => p.Name // Default sort by name
        };

        return isAscending 
            ? query.OrderBy(sortExpression)
            : query.OrderByDescending(sortExpression);
    }
}