using Microsoft.AspNetCore.Mvc;
using Commerce.Services.PricingMdm.Api.Models;
using Commerce.Services.PricingMdm.Api.Services;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for CatalogProduct CRUD operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CatalogProductController : ControllerBase
{
    private readonly ICatalogProductService _catalogProductService;
    private readonly ILogger<CatalogProductController> _logger;

    public CatalogProductController(ICatalogProductService catalogProductService, ILogger<CatalogProductController> logger)
    {
        _catalogProductService = catalogProductService ?? throw new ArgumentNullException(nameof(catalogProductService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all catalog products with filtering and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CatalogProductPagedResponse), 200)]
    public async Task<ActionResult<CatalogProductPagedResponse>> GetCatalogProducts(
        [FromQuery] Guid? catalogId = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] bool? isActive = true,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "CreatedAt",
        [FromQuery] string sortOrder = "desc")
    {
        try
        {
            var query = new CatalogProductsQuery
            {
                CatalogId = catalogId,
                ProductId = productId,
                IsActive = isActive,
                SearchTerm = searchTerm,
                Page = page,
                PageSize = pageSize,
                SortBy = sortBy,
                SortOrder = sortOrder
            };

            var response = await _catalogProductService.GetCatalogProductsAsync(query);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog products");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets products in a specific catalog
    /// </summary>
    [HttpGet("catalog/{catalogId}/products")]
    [ProducesResponseType(typeof(CatalogProductPagedResponse), 200)]
    public async Task<ActionResult<CatalogProductPagedResponse>> GetProductsInCatalog(
        Guid catalogId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var response = await _catalogProductService.GetProductsInCatalogAsync(
                catalogId, page, pageSize, searchTerm, isActive);
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting products in catalog: {CatalogId}", catalogId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets catalogs containing a specific product
    /// </summary>
    [HttpGet("product/{productId}/catalogs")]
    [ProducesResponseType(typeof(List<CatalogProductDto>), 200)]
    public async Task<ActionResult<List<CatalogProductDto>>> GetCatalogsForProduct(
        Guid productId,
        [FromQuery] bool activeOnly = true)
    {
        try
        {
            var catalogs = await _catalogProductService.GetCatalogsForProductAsync(productId, activeOnly);
            return Ok(catalogs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalogs for product: {ProductId}", productId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets a catalog product relationship by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CatalogProductDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CatalogProductDto>> GetCatalogProductById(Guid id)
    {
        try
        {
            var catalogProduct = await _catalogProductService.GetCatalogProductByIdAsync(id);
            
            if (catalogProduct == null)
            {
                return NotFound(new { error = "Catalog product relationship not found" });
            }
            
            return Ok(catalogProduct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog product by ID: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Adds a product to a catalog
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CatalogProductDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<CatalogProductDto>> CreateCatalogProduct([FromBody] CreateCatalogProductRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var catalogProduct = await _catalogProductService.CreateCatalogProductAsync(request);
            
            return CreatedAtAction(nameof(GetCatalogProductById), new { id = catalogProduct.Id }, catalogProduct);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating catalog product relationship");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Updates a catalog product relationship
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(CatalogProductDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CatalogProductDto>> UpdateCatalogProduct(Guid id, [FromBody] UpdateCatalogProductRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var catalogProduct = await _catalogProductService.UpdateCatalogProductAsync(id, request);
            
            if (catalogProduct == null)
            {
                return NotFound(new { error = "Catalog product relationship not found" });
            }
            
            return Ok(catalogProduct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating catalog product: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Removes a product from a catalog
    /// </summary>
    [HttpDelete("catalog/{catalogId}/product/{productId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveProductFromCatalog(Guid catalogId, Guid productId)
    {
        try
        {
            var success = await _catalogProductService.RemoveProductFromCatalogAsync(catalogId, productId);
            
            if (!success)
            {
                return NotFound(new { error = "Catalog product relationship not found" });
            }
            
            return Ok(new { message = "Product removed from catalog successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing product {ProductId} from catalog {CatalogId}", productId, catalogId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Adds multiple products to a catalog in bulk
    /// </summary>
    [HttpPost("bulk-add")]
    [ProducesResponseType(typeof(CatalogProductResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<CatalogProductResponse>> BulkAddProductsToCatalog([FromBody] BulkCatalogProductRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _catalogProductService.BulkAddProductsToCatalogAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk adding products to catalog: {CatalogId}", request.CatalogId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Removes multiple products from a catalog in bulk
    /// </summary>
    [HttpPost("catalog/{catalogId}/bulk-remove")]
    [ProducesResponseType(typeof(CatalogProductResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<CatalogProductResponse>> BulkRemoveProductsFromCatalog(
        Guid catalogId, 
        [FromBody] List<Guid> productIds)
    {
        try
        {
            if (productIds == null || !productIds.Any())
            {
                return BadRequest(new { error = "Product IDs list cannot be empty" });
            }

            var response = await _catalogProductService.BulkRemoveProductsFromCatalogAsync(catalogId, productIds);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk removing products from catalog: {CatalogId}", catalogId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Activates a catalog product relationship
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ActivateCatalogProduct(Guid id)
    {
        try
        {
            var success = await _catalogProductService.ActivateCatalogProductAsync(id);
            
            if (!success)
            {
                return NotFound(new { error = "Catalog product relationship not found" });
            }
            
            return Ok(new { message = "Catalog product relationship activated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating catalog product: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Deactivates a catalog product relationship
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeactivateCatalogProduct(Guid id)
    {
        try
        {
            var success = await _catalogProductService.DeactivateCatalogProductAsync(id);
            
            if (!success)
            {
                return NotFound(new { error = "Catalog product relationship not found" });
            }
            
            return Ok(new { message = "Catalog product relationship deactivated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating catalog product: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Checks if a product is in a catalog
    /// </summary>
    [HttpGet("catalog/{catalogId}/product/{productId}/exists")]
    [ProducesResponseType(typeof(ProductInCatalogResponse), 200)]
    public async Task<ActionResult<ProductInCatalogResponse>> CheckProductInCatalog(
        Guid catalogId, 
        Guid productId, 
        [FromQuery] bool activeOnly = true)
    {
        try
        {
            var exists = await _catalogProductService.IsProductInCatalogAsync(catalogId, productId, activeOnly);
            
            return Ok(new ProductInCatalogResponse 
            { 
                Exists = exists,
                Message = exists ? "Product is in catalog" : "Product is not in catalog"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if product {ProductId} is in catalog {CatalogId}", productId, catalogId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets catalog product statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(Dictionary<string, object>), 200)]
    public async Task<ActionResult<Dictionary<string, object>>> GetCatalogProductStats()
    {
        try
        {
            var stats = await _catalogProductService.GetCatalogProductStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog product stats");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets available locales for a catalog
    /// </summary>
    [HttpGet("catalog/{catalogId}/available-locales")]
    [ProducesResponseType(typeof(List<AvailableLocaleDto>), 200)]
    public async Task<ActionResult<List<AvailableLocaleDto>>> GetAvailableLocalesForCatalog(Guid catalogId)
    {
        try
        {
            var locales = await _catalogProductService.GetAvailableLocalesForCatalogAsync(catalogId);
            return Ok(locales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locales for catalog {CatalogId}", catalogId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Initiates locale-specific financial calculations for a catalog product
    /// </summary>
    [HttpPost("{catalogProductId}/calculate-locale-financials")]
    [ProducesResponseType(typeof(LocaleWorkflowResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<LocaleWorkflowResponse>> CalculateLocaleFinancials(
        Guid catalogProductId, 
        [FromBody] CalculateLocaleFinancialsRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _catalogProductService.CalculateLocaleFinancialsAsync(catalogProductId, request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating locale financials for catalog product {CatalogProductId}", catalogProductId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Initiates multi-language content generation for a catalog product
    /// </summary>
    [HttpPost("{catalogProductId}/generate-multilanguage-content")]
    [ProducesResponseType(typeof(ContentWorkflowResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ContentWorkflowResponse>> GenerateMultiLanguageContent(
        Guid catalogProductId, 
        [FromBody] GenerateMultiLanguageContentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _catalogProductService.GenerateMultiLanguageContentAsync(catalogProductId, request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating multi-language content for catalog product {CatalogProductId}", catalogProductId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Gets workflow progress for a catalog product
    /// </summary>
    [HttpGet("{catalogProductId}/workflow-progress")]
    [ProducesResponseType(typeof(WorkflowProgressResponse), 200)]
    public async Task<ActionResult<WorkflowProgressResponse>> GetWorkflowProgress(Guid catalogProductId)
    {
        try
        {
            var progress = await _catalogProductService.GetWorkflowProgressAsync(catalogProductId);
            return Ok(progress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow progress for catalog product {CatalogProductId}", catalogProductId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Gets workflow templates available for catalog operations
    /// </summary>
    [HttpGet("workflow-templates")]
    [ProducesResponseType(typeof(List<WorkflowTemplateDto>), 200)]
    public async Task<ActionResult<List<WorkflowTemplateDto>>> GetWorkflowTemplates()
    {
        try
        {
            var templates = await _catalogProductService.GetWorkflowTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow templates");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Creates a batch workflow job for multiple products and locales
    /// </summary>
    [HttpPost("batch-workflow")]
    [ProducesResponseType(typeof(BatchWorkflowResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<BatchWorkflowResponse>> CreateBatchWorkflow([FromBody] CreateBatchWorkflowRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _catalogProductService.CreateBatchWorkflowAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating batch workflow");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Gets localized content for a catalog product
    /// </summary>
    [HttpGet("{catalogProductId}/localized-content")]
    [ProducesResponseType(typeof(List<LocalizedContentDto>), 200)]
    public async Task<ActionResult<List<LocalizedContentDto>>> GetLocalizedContent(Guid catalogProductId)
    {
        try
        {
            var localizedContent = await _catalogProductService.GetLocalizedContentAsync(catalogProductId);
            return Ok(localizedContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized content for catalog product {CatalogProductId}", catalogProductId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Gets the count of localized content items for a catalog product
    /// </summary>
    [HttpGet("{catalogProductId}/localized-content/count")]
    [ProducesResponseType(typeof(LocalizedContentCountResponse), 200)]
    public async Task<ActionResult<LocalizedContentCountResponse>> GetLocalizedContentCount(Guid catalogProductId)
    {
        try
        {
            var count = await _catalogProductService.GetLocalizedContentCountAsync(catalogProductId);
            return Ok(new LocalizedContentCountResponse { Count = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized content count for catalog product {CatalogProductId}", catalogProductId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Saves localized content for a product
    /// </summary>
    [HttpPost("product/{productId}/localized-content")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SaveLocalizedContent(
        Guid productId, 
        [FromBody] SaveLocalizedContentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _catalogProductService.SaveLocalizedContentAsync(
                productId, 
                request.LocaleCode, 
                request.TranslatedName, 
                request.TranslatedDescription, 
                request.CreatedBy);

            if (!success)
            {
                return BadRequest(new { error = "Failed to save localized content" });
            }

            return Ok(new { message = "Localized content saved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving localized content for product {ProductId}", productId);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

/// <summary>
/// Response DTO for product in catalog check
/// </summary>
public class ProductInCatalogResponse
{
    public bool Exists { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for localized content count
/// </summary>
public class LocalizedContentCountResponse
{
    public int Count { get; set; }
}