using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Data.Services;

namespace Commerce.Services.ProductStaging.Api.Controllers;

/// <summary>
/// Product Staging API Controller - Provides access to staged product data for consumer systems
/// </summary>
[ApiController]
[Route("api/products")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService ?? throw new ArgumentNullException(nameof(productService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get staged products available for consumer systems
    /// Only returns products that are approved and ready for consumption
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="limit">Items per page (default: 20)</param>
    /// <param name="search">Search term</param>
    /// <param name="category">Filter by category</param>
    /// <param name="status">Filter by status (default: active)</param>
    /// <returns>Paginated list of staged products</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> GetStagedProducts(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string status = "active")
    {
        try
        {
            _logger.LogInformation("Getting staged products - Page: {Page}, Limit: {Limit}, Search: {Search}", 
                page, limit, search);

            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            // For staging API, we primarily serve active/approved products
            var result = await _productService.GetProductsAsync(page, limit, search, status, category);

            var response = new
            {
                products = result.Products,
                pagination = new
                {
                    page = result.Pagination.Page,
                    limit = result.Pagination.Limit,
                    total = result.Pagination.TotalItems,
                    pages = result.Pagination.TotalPages,
                    hasNext = result.Pagination.HasNextPage,
                    hasPrev = result.Pagination.HasPreviousPage
                },
                source = "product-staging-api",
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staged products");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific staged product by ID
    /// </summary>
    /// <param name="id">Product ID</param>
    /// <returns>Product details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetStagedProduct(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting staged product by ID: {ProductId}", id);

            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { error = "Product not found" });
            }

            // Only return active products through staging API
            if (product.Status?.ToLower() != "active")
            {
                return NotFound(new { error = "Product not available in staging" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staged product {ProductId}", id);
            return BadRequest(new { error = "Failed to fetch staged product" });
        }
    }

    /// <summary>
    /// Get staged products by SKU
    /// </summary>
    /// <param name="sku">Product SKU</param>
    /// <returns>Product details</returns>
    [HttpGet("sku/{sku}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetStagedProductBySku(string sku)
    {
        try
        {
            _logger.LogInformation("Getting staged product by SKU: {Sku}", sku);

            var products = await _productService.GetProductsAsync(1, 1, sku, null, "active");
            var product = products.Products?.FirstOrDefault();

            if (product == null)
            {
                return NotFound(new { error = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staged product by SKU {Sku}", sku);
            return BadRequest(new { error = "Failed to fetch staged product" });
        }
    }

    /// <summary>
    /// Get staging environment statistics
    /// </summary>
    /// <returns>Statistics about staged products</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetStagingStats()
    {
        try
        {
            _logger.LogInformation("Getting staging statistics");

            // Get various statistics about staged products
            var allProducts = await _productService.GetProductsAsync(1, 1000); // Get more to count
            var activeProducts = await _productService.GetProductsAsync(1, 1000, null, null, "active");

            var stats = new
            {
                totalProducts = allProducts.Pagination.TotalItems,
                activeProducts = activeProducts.Pagination.TotalItems,
                availableForConsumption = activeProducts.Pagination.TotalItems,
                lastUpdated = DateTime.UtcNow.ToString("O"),
                service = "product-staging-api"
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staging statistics");
            return BadRequest(new { error = "Failed to fetch staging statistics" });
        }
    }

    /// <summary>
    /// Health check endpoint for Product Staging API
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetHealth()
    {
        return Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            service = "product-staging-api",
            schema = "staging",
            description = "Product Staging API for consumer system access"
        });
    }
}