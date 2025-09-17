using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Ecommerce.Api.Services;
using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Controllers;

/// <summary>
/// Controller for product operations in the e-commerce context
/// Provides REST API endpoints for product catalog with integrated pricing
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Get all products for admin view (no catalog filtering)
    /// </summary>
    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminProducts(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 100,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        try
        {
            var request = new AdminProductSearchRequest
            {
                Page = page,
                Limit = limit,
                Search = search,
                Status = status
            };

            var result = await _productService.GetAdminProductsAsync(request);

            return Ok(new
            {
                success = true,
                data = result,
                source = "ecommerce-api-admin"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products/admin");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch admin products",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get products with catalog pricing and locale filtering
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? brand = null,
        [FromQuery] string status = "active",
        [FromQuery] string? catalogId = null,
        [FromQuery] string region = "AMER",
        [FromQuery] string channel = "DIRECT",
        [FromQuery] string locale = "en_US")
    {
        try
        {
            var request = new ProductSearchRequest
            {
                Page = page,
                Limit = limit,
                Search = search,
                Category = category,
                Brand = brand,
                Status = status,
                CatalogId = catalogId,
                RegionCode = region,
                ChannelCode = channel,
                LocaleCode = locale
            };

            var result = await _productService.GetProductsAsync(request);

            return Ok(new
            {
                success = true,
                data = result,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch products",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Search products
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchProducts(
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? catalogId = null,
        [FromQuery] string region = "AMER",
        [FromQuery] string channel = "DIRECT")
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new
            {
                success = false,
                error = "Search term is required",
                message = "Please provide a search term using the 'q' parameter"
            });
        }

        try
        {
            var request = new ProductSearchRequest
            {
                Page = page,
                Limit = limit,
                CatalogId = catalogId,
                RegionCode = region,
                ChannelCode = channel
            };

            var result = await _productService.SearchProductsAsync(q, request);

            return Ok(new
            {
                success = true,
                data = result,
                source = "ecommerce-api",
                searchTerm = q
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products/search");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to search products",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get product categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var categories = await _productService.GetCategoriesAsync();

            return Ok(new
            {
                success = true,
                data = categories,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products/categories");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch categories",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get single product with pricing (by ID or SKU)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(
        string id,
        [FromQuery] string? catalogId = null,
        [FromQuery] string region = "AMER",
        [FromQuery] string channel = "DIRECT")
    {
        try
        {
            // Check if ID is a UUID or SKU
            var isGuid = Guid.TryParse(id, out var productId);
            
            EcommerceProductDto? product;
            if (isGuid)
            {
                product = await _productService.GetProductByIdAsync(productId, catalogId, region, channel);
            }
            else
            {
                // Assume it's a SKU
                product = await _productService.GetProductBySkuAsync(id, catalogId, region, channel);
            }

            if (product == null)
            {
                return NotFound(new
                {
                    success = false,
                    error = "Product not found",
                    message = $"Product with {(isGuid ? "ID" : "SKU")} \"{id}\" not found"
                });
            }

            return Ok(new
            {
                success = true,
                data = product,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products/{Id}", id);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch product",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get detailed pricing for a product
    /// </summary>
    [HttpGet("{id}/pricing")]
    public async Task<IActionResult> GetProductPricing(
        string id,
        [FromQuery] string? catalogId = null,
        [FromQuery] string region = "AMER",
        [FromQuery] string channel = "DIRECT",
        [FromQuery] int quantity = 1)
    {
        try
        {
            // First get the product to ensure it exists
            var isGuid = Guid.TryParse(id, out var productId);
            
            EcommerceProductDto? product;
            if (isGuid)
            {
                product = await _productService.GetProductByIdAsync(productId, catalogId, region, channel);
            }
            else
            {
                product = await _productService.GetProductBySkuAsync(id, catalogId, region, channel);
            }

            if (product == null)
            {
                return NotFound(new
                {
                    success = false,
                    error = "Product not found",
                    message = $"Product with {(isGuid ? "ID" : "SKU")} \"{id}\" not found"
                });
            }

            // Return the pricing information that's already included in the product
            var pricingResponse = new
            {
                product = new
                {
                    id = product.Id,
                    sku = product.Sku,
                    name = product.Name
                },
                catalog = new
                {
                    // This would need catalog info from pricing service
                    region,
                    channel
                },
                quantity,
                pricing = product.Pricing
            };

            return Ok(new
            {
                success = true,
                data = pricingResponse,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/products/{Id}/pricing", id);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to calculate pricing",
                message = ex.Message
            });
        }
    }
}