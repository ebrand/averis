using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Data.Services;
using Commerce.Services.ProductMdm.Api.Services;
using Commerce.Services.Shared.Infrastructure.Logging;
using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.ProductMdm.Api.Controllers;

/// <summary>
/// Products API Controller - Handles product management operations
/// Provides RESTful endpoints for the Product MDM system
/// </summary>
[ApiController]
[Route("api/products")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IProductCacheService _productCacheService;
    private readonly IProductMessageService _messageService;
    private readonly IRealTimeLogService _realTimeLogService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        IProductService productService, 
        IProductCacheService productCacheService,
        IProductMessageService messageService,
        IRealTimeLogService realTimeLogService,
        ILogger<ProductsController> logger)
    {
        _productService = productService ?? throw new ArgumentNullException(nameof(productService));
        _productCacheService = productCacheService ?? throw new ArgumentNullException(nameof(productCacheService));
        _messageService = messageService ?? throw new ArgumentNullException(nameof(messageService));
        _realTimeLogService = realTimeLogService ?? throw new ArgumentNullException(nameof(realTimeLogService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get products with filtering, sorting, and pagination
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="limit">Items per page (default: 20)</param>
    /// <param name="search">Search term for name, description, or SKU</param>
    /// <param name="status">Filter by status</param>
    /// <param name="type">Filter by product type</param>
    /// <param name="available">Filter by availability flag</param>
    /// <param name="webDisplay">Filter by web display flag</param>
    /// <param name="licenseRequired">Filter by license required flag</param>
    /// <param name="contractItem">Filter by contract item flag</param>
    /// <param name="sortBy">Field to sort by (default: name)</param>
    /// <param name="sortOrder">Sort order: ASC or DESC (default: ASC)</param>
    /// <returns>Paginated list of products</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedProductResponse>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] bool? available = null,
        [FromQuery] bool? webDisplay = null,
        [FromQuery] bool? licenseRequired = null,
        [FromQuery] bool? contractItem = null,
        [FromQuery] string sortBy = "name",
        [FromQuery] string sortOrder = "ASC")
    {
        try
        {
            _logger.LogInformation("Getting products - Page: {Page}, Limit: {Limit}", page, limit);

            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20; // Cap at 100 items per page

            var result = await _productService.GetProductsAsync(
                page, limit, search, status, type, available, webDisplay,
                licenseRequired, contractItem, sortBy, sortOrder);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products");
            return BadRequest(new { error = ex.Message });  //"Failed to fetch products" });
        }
    }

    /// <summary>
    /// Get product by ID
    /// </summary>
    /// <param name="id">Product ID</param>
    /// <returns>Product details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting product by ID: {ProductId}", id);

            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { error = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product {ProductId}", id);
            return BadRequest(new { error = "Failed to fetch product" });
        }
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    /// <param name="request">Product creation data</param>
    /// <returns>Created product</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        try
        {
            _logger.LogInformation("Creating product with SKU: {Sku}", request.Sku);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // TODO: Extract user from authentication context
            var createdByUser = GetCurrentUser();

            var product = await _productService.CreateProductAsync(request, createdByUser);
            
            // Log structured business event
            _logger.LogInformation("Product created: {ProductId} with SKU {ProductSku} by user {UserId} - Status: {Status}", 
                product.Id, product.Sku, createdByUser, product.Status);
                
            // Stream real-time business event to dashboard
            try
            {
                await _realTimeLogService.StreamBusinessEventAsync("ProductCreated", 
                    $"Product {product.Sku} created by {createdByUser} with status {product.Status}", "INFO");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to stream product creation event to dashboard for product {ProductId}", product.Id);
            }

            // Publish product created message
            try
            {
                await _messageService.PublishProductCreatedAsync(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish product created message for {ProductId}", product.Id);
                // Don't throw - messaging failure shouldn't break product creation
            }

            // Sync to Product Cache if active
            if (product.Status == "active")
            {
                try
                {
                    _logger.LogInformation("New product {ProductId} ({Sku}) is active - syncing to Product Cache", 
                        product.Id, product.Sku);
                    
                    var syncSuccess = await _productCacheService.SyncActiveProductAsync(product);
                    if (!syncSuccess)
                    {
                        _logger.LogWarning("Failed to sync new product {ProductId} to Product Cache", product.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error syncing new product {ProductId} to Product Cache", product.Id);
                    // Don't throw - cache sync failure shouldn't break product creation
                }
            }

            return CreatedAtAction(
                nameof(GetProduct),
                new { id = product.Id },
                product);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Duplicate SKU attempted: {Sku}", request.Sku);
            return Conflict(new { error = $"Product with SKU '{request.Sku}' already exists" });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("validation failed"))
        {
            _logger.LogWarning("Product validation failed: {Error}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return BadRequest(new { error = "Failed to create product" });
        }
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    /// <param name="id">Product ID</param>
    /// <param name="request">Product update data</param>
    /// <returns>Updated product</returns>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        try
        {
            _logger.LogInformation("Updating product: {ProductId}", id);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get existing product to check for status changes
            var existingProduct = await _productService.GetProductByIdAsync(id);
            if (existingProduct == null)
            {
                return NotFound(new { error = "Product not found" });
            }

            // TODO: Extract user from authentication context
            var updatedByUser = GetCurrentUser();

            var updatedProduct = await _productService.UpdateProductAsync(id, request, updatedByUser);
            if (updatedProduct == null)
            {
                return NotFound(new { error = "Product not found" });
            }
            
            // Log business events for product updates
            _logger.LogInformation("Product updated: {ProductId} ({ProductSku}) by user {UserId}", 
                updatedProduct.Id, updatedProduct.Sku, updatedByUser);
                
            // Log status changes specifically
            if (existingProduct.Status != updatedProduct.Status)
            {
                _logger.LogProductWorkflowTransition(updatedProduct.Sku, existingProduct.Status, updatedProduct.Status, updatedByUser);
                
                // Stream real-time workflow transition to dashboard
                try
                {
                    await _realTimeLogService.StreamProductWorkflowTransitionAsync(updatedProduct.Sku, existingProduct.Status, updatedProduct.Status, updatedByUser);
                    
                    if (updatedProduct.Status == "active")
                    {
                        _logger.LogProductLaunch(updatedProduct.Sku);
                        await _realTimeLogService.StreamProductLaunchAsync(updatedProduct.Sku);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to stream workflow transition to dashboard for product {ProductId}", updatedProduct.Id);
                }
            }

            // Publish product updated message with status change detection
            try
            {
                await _messageService.PublishProductUpdatedAsync(updatedProduct, existingProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish product updated message for {ProductId}", updatedProduct.Id);
                // Don't throw - messaging failure shouldn't break product update
            }

            // Handle Product Cache sync for status changes
            await HandleProductStatusChange(existingProduct, updatedProduct);

            return Ok(updatedProduct);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Duplicate SKU attempted during update: {Sku}", request.Sku);
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return BadRequest(new { error = "Failed to update product" });
        }
    }

    /// <summary>
    /// Delete a product
    /// </summary>
    /// <param name="id">Product ID</param>
    /// <returns>Success confirmation</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteProduct(Guid id)
    {
        try
        {
            _logger.LogInformation("Deleting product: {ProductId}", id);

            // Get product before deletion for messaging
            var existingProduct = await _productService.GetProductByIdAsync(id);
            if (existingProduct == null)
            {
                return NotFound(new { error = "Product not found" });
            }

            var success = await _productService.DeleteProductAsync(id);
            if (!success)
            {
                return NotFound(new { error = "Product not found" });
            }
            
            // Log business event for product deletion
            var deletedByUser = GetCurrentUser();
            _logger.LogInformation("Product deleted: {ProductId} ({ProductSku}) by user {UserId} - Was Status: {PreviousStatus}", 
                existingProduct.Id, existingProduct.Sku, deletedByUser, existingProduct.Status);

            // Publish product deleted message
            try
            {
                await _messageService.PublishProductDeletedAsync(existingProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish product deleted message for {ProductId}", existingProduct.Id);
                // Don't throw - messaging failure shouldn't break product deletion
            }

            // Remove from Product Cache if product was active
            if (existingProduct.Status == "active")
            {
                try
                {
                    _logger.LogInformation("Deleted product {ProductId} ({Sku}) was active - removing from Product Cache", 
                        existingProduct.Id, existingProduct.Sku);
                    
                    var removeSuccess = await _productCacheService.RemoveProductFromCacheAsync(existingProduct.Id);
                    if (!removeSuccess)
                    {
                        _logger.LogWarning("Failed to remove deleted product {ProductId} from Product Cache", existingProduct.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error removing deleted product {ProductId} from Product Cache", existingProduct.Id);
                    // Don't throw - cache cleanup failure shouldn't break product deletion
                }
            }

            return Ok(new { message = "Product deleted successfully", id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return BadRequest(new { error = "Failed to delete product" });
        }
    }

    /// <summary>
    /// Get product analytics summary
    /// </summary>
    /// <returns>Analytics data</returns>
    [HttpGet("analytics/summary")]
    [ProducesResponseType(typeof(ProductAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductAnalyticsDto>> GetProductAnalytics()
    {
        try
        {
            _logger.LogInformation("Getting product analytics");
            var analytics = await _productService.GetProductAnalyticsAsync();
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product analytics");
            return BadRequest(new { error = "Failed to fetch product analytics" });
        }
    }

    /// <summary>
    /// Get distinct product types
    /// </summary>
    /// <returns>List of product types</returns>
    [HttpGet("types/list")]
    [ProducesResponseType(typeof(ProductTypesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductTypesResponse>> GetProductTypes()
    {
        try
        {
            _logger.LogInformation("Getting product types");
            var types = await _productService.GetProductTypesAsync();
            return Ok(types);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product types");
            return BadRequest(new { error = "Failed to fetch product types" });
        }
    }

    /// <summary>
    /// Health check endpoint
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
            service = "product-mdm-api"
        });
    }

    // TODO: Implement authentication and extract user information
    private string GetCurrentUser()
    {
        // Placeholder - extract from authentication context when implemented
        return "system";
    }


    // Sync product changes with Product Cache when status changes or significant updates occur
    private async Task HandleProductStatusChange(ProductDto existingProduct, ProductDto updatedProduct)
    {
        var wasActive = existingProduct.Status == "active";
        var isActive = updatedProduct.Status == "active";
        
        // Determine if there are significant changes
        var hasSignificantChanges = HasSignificantChanges(existingProduct, updatedProduct);
        
        try
        {
            if (isActive && (!wasActive || hasSignificantChanges))
            {
                // Product became active or active product was significantly updated - sync to cache
                _logger.LogInformation("Product {ProductId} ({Sku}) is active - syncing to Product Cache", 
                    updatedProduct.Id, updatedProduct.Sku);
                
                var syncSuccess = await _productCacheService.SyncActiveProductAsync(updatedProduct);
                if (!syncSuccess)
                {
                    _logger.LogWarning("Failed to sync product {ProductId} to Product Cache", updatedProduct.Id);
                }
            }
            else if (wasActive && !isActive)
            {
                // Product was deactivated - remove from cache
                _logger.LogInformation("Product {ProductId} ({Sku}) was deactivated - removing from Product Cache", 
                    updatedProduct.Id, updatedProduct.Sku);
                
                var removeSuccess = await _productCacheService.RemoveProductFromCacheAsync(updatedProduct.Id);
                if (!removeSuccess)
                {
                    _logger.LogWarning("Failed to remove product {ProductId} from Product Cache", updatedProduct.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Product Cache sync for product {ProductId}", updatedProduct.Id);
            // Don't throw - cache sync failure shouldn't break the API operation
        }
    }

    private static bool HasSignificantChanges(ProductDto existing, ProductDto updated)
    {
        return existing.Name != updated.Name ||
               existing.Description != updated.Description ||
               existing.Type != updated.Type ||
               existing.BasePrice != updated.BasePrice ||
               existing.CostPrice != updated.CostPrice ||
               existing.WebDisplayFlag != updated.WebDisplayFlag ||
               existing.CanBeFulfilledFlag != updated.CanBeFulfilledFlag ||
               existing.ContractItemFlag != updated.ContractItemFlag ||
               existing.LicenseRequiredFlag != updated.LicenseRequiredFlag ||
               existing.SeatBasedPricingFlag != updated.SeatBasedPricingFlag ||
               existing.AvaTaxCode != updated.AvaTaxCode ||
               existing.Slug != updated.Slug ||
               existing.LongDescription != updated.LongDescription ||
               existing.AvailableFlag != updated.AvailableFlag;
    }
}