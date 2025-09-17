using Microsoft.EntityFrameworkCore;
using Commerce.Services.Ecommerce.Api.Data;
using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service for product operations in the e-commerce context
/// Integrates local product data with pricing from Pricing MDM
/// </summary>
public class ProductService : IProductService
{
    private readonly EcommerceDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly ILogger<ProductService> _logger;

    public ProductService(EcommerceDbContext context, IPricingService pricingService, ILogger<ProductService> logger)
    {
        _context = context;
        _pricingService = pricingService;
        _logger = logger;
    }

    public async Task<ProductPagedResult> GetProductsAsync(ProductSearchRequest request)
    {
        try
        {
            // Build query for local e-commerce products
            var query = _context.Products
                .Include(p => p.Category)
                .Where(p => p.Status == request.Status && p.IsActive);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchTerm = $"%{request.Search}%";
                query = query.Where(p => 
                    EF.Functions.ILike(p.Name, searchTerm) ||
                    EF.Functions.ILike(p.DisplayName ?? "", searchTerm) ||
                    EF.Functions.ILike(p.ShortDescription ?? "", searchTerm));
            }

            if (!string.IsNullOrEmpty(request.Category))
            {
                query = query.Where(p => p.Category != null && p.Category.Slug == request.Category);
            }

            if (!string.IsNullOrEmpty(request.Brand))
            {
                query = query.Where(p => p.Brand == request.Brand);
            }

            // Get total count for pagination
            var total = await query.CountAsync();

            // Apply ordering and pagination
            var products = await query
                .OrderByDescending(p => p.UpdatedAt)
                .Skip((request.Page - 1) * request.Limit)
                .Take(request.Limit)
                .ToListAsync();

            // Get catalog for pricing
            CatalogDto? catalog = null;
            if (!string.IsNullOrEmpty(request.CatalogId))
            {
                catalog = await _pricingService.GetCatalogByIdAsync(request.CatalogId);
            }
            else
            {
                catalog = await _pricingService.GetDefaultCatalogAsync(request.RegionCode, request.ChannelCode);
            }

            // Enrich products with pricing
            var enrichedProducts = await _pricingService.EnrichProductsWithPricingAsync(products, request.CatalogId, request.RegionCode, request.ChannelCode);

            return new ProductPagedResult
            {
                Products = enrichedProducts,
                Pagination = new PaginationDto
                {
                    Page = request.Page,
                    Limit = request.Limit,
                    Total = total,
                    Pages = (int)Math.Ceiling((double)total / request.Limit),
                    HasNextPage = request.Page < Math.Ceiling((double)total / request.Limit),
                    HasPreviousPage = request.Page > 1
                },
                Catalog = catalog != null ? new CatalogInfo
                {
                    Id = catalog.Id,
                    Name = catalog.Name,
                    Currency = catalog.CurrencyCode,
                    Region = catalog.RegionCode,
                    Channel = catalog.ChannelCode
                } : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products");
            throw new InvalidOperationException("Failed to fetch products", ex);
        }
    }

    public async Task<EcommerceProductDto?> GetProductByIdAsync(Guid productId, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT")
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive);

            if (product == null)
            {
                return null;
            }

            // Enrich with pricing data
            var enrichedProducts = await _pricingService.EnrichProductsWithPricingAsync(new[] { product }.ToList(), catalogId, regionCode, channelCode);
            
            return enrichedProducts.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product by ID {ProductId}", productId);
            throw new InvalidOperationException($"Failed to fetch product {productId}", ex);
        }
    }

    public async Task<EcommerceProductDto?> GetProductBySkuAsync(string sku, string? catalogId = null, string regionCode = "AMER", string channelCode = "DIRECT")
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Sku == sku && p.IsActive);

            if (product == null)
            {
                return null;
            }

            // Enrich with pricing data
            var enrichedProducts = await _pricingService.EnrichProductsWithPricingAsync(new[] { product }.ToList(), catalogId, regionCode, channelCode);
            
            return enrichedProducts.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product by SKU {Sku}", sku);
            throw new InvalidOperationException($"Failed to fetch product with SKU {sku}", ex);
        }
    }

    public async Task<ProductPagedResult> SearchProductsAsync(string searchTerm, ProductSearchRequest request)
    {
        // Use the main GetProductsAsync method with search parameter
        request.Search = searchTerm;
        return await GetProductsAsync(request);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        try
        {
            var categoriesWithCounts = await _context.Categories
                .Where(c => c.IsActive)
                .GroupJoin(
                    _context.Products.Where(p => p.IsActive),
                    category => category.Id,
                    product => product.CategoryId,
                    (category, products) => new CategoryDto
                    {
                        Id = category.Id,
                        Name = category.Name,
                        Description = category.Description,
                        Slug = category.Slug,
                        ParentId = category.ParentId,
                        ProductCount = products.Count()
                    })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return categoriesWithCounts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching categories");
            throw new InvalidOperationException("Failed to fetch categories", ex);
        }
    }

    public async Task<ProductPagedResult> GetAdminProductsAsync(AdminProductSearchRequest request)
    {
        try
        {
            // Build query for all products with available e-commerce fields
            var query = _context.Products.Include(p => p.Category).AsQueryable();

            // Add status filter if specified
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(p => p.Status == request.Status);
            }

            // Add search filter
            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchTerm = $"%{request.Search}%";
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, searchTerm) ||
                    EF.Functions.ILike(p.DisplayName ?? "", searchTerm) ||
                    EF.Functions.ILike(p.Sku, searchTerm) ||
                    EF.Functions.ILike(p.ShortDescription ?? "", searchTerm));
            }

            // Get total count
            var total = await query.CountAsync();

            // Apply ordering and pagination
            var products = await query
                .OrderByDescending(p => p.UpdatedAt)
                .ThenBy(p => p.Name)
                .Skip((request.Page - 1) * request.Limit)
                .Take(request.Limit)
                .ToListAsync();

            // Convert to DTOs without pricing (admin view)
            var adminProducts = products.Select(p => EcommerceProductDto.FromEntity(p)).ToList();

            return new ProductPagedResult
            {
                Products = adminProducts,
                Pagination = new PaginationDto
                {
                    Page = request.Page,
                    Limit = request.Limit,
                    Total = total,
                    Pages = (int)Math.Ceiling((double)total / request.Limit),
                    HasNextPage = request.Page < Math.Ceiling((double)total / request.Limit),
                    HasPreviousPage = request.Page > 1
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetAdminProductsAsync");
            throw new InvalidOperationException("Failed to fetch admin products", ex);
        }
    }

    public async Task<ServiceHealthResult> HealthCheckAsync()
    {
        try
        {
            var result = new ServiceHealthResult
            {
                Status = "healthy",
                Service = "EcommerceProductService",
                Timestamp = DateTime.UtcNow
            };

            // Check database connectivity
            try
            {
                var productCount = await _context.Products.Where(p => p.IsActive).CountAsync();
                var categoryCount = await _context.Categories.Where(c => c.IsActive).CountAsync();

                result.Database = new DatabaseHealthInfo { Status = "healthy" };
                result.Stats = new StatisticsInfo
                {
                    ActiveProducts = productCount,
                    TotalCategories = categoryCount
                };
            }
            catch (Exception dbEx)
            {
                result.Database = new DatabaseHealthInfo 
                { 
                    Status = "error", 
                    Error = dbEx.Message 
                };
                result.Status = "degraded";
            }

            // Check pricing service connectivity
            try
            {
                var pricingHealth = await _pricingService.HealthCheckAsync();
                result.PricingService = new PricingServiceHealthInfo
                {
                    Status = pricingHealth.Status,
                    Error = pricingHealth.Error
                };

                if (!pricingHealth.IsHealthy && result.Status == "healthy")
                {
                    result.Status = "degraded";
                }
            }
            catch (Exception pricingEx)
            {
                result.PricingService = new PricingServiceHealthInfo
                {
                    Status = "error",
                    Error = pricingEx.Message
                };
                if (result.Status == "healthy")
                {
                    result.Status = "degraded";
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            return new ServiceHealthResult
            {
                Status = "error",
                Service = "EcommerceProductService",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            };
        }
    }
}