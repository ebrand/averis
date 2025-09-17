using Microsoft.AspNetCore.Mvc;
using Commerce.Services.PricingMdm.Api.Models;
using Commerce.Services.PricingMdm.Api.Services;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Catalog CRUD operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(ICatalogService catalogService, ILogger<CatalogController> logger)
    {
        _catalogService = catalogService ?? throw new ArgumentNullException(nameof(catalogService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all catalogs with optional filtering and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CatalogPagedResponse), 200)]
    public async Task<ActionResult<CatalogPagedResponse>> GetCatalogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] Guid? regionId = null,
        [FromQuery] Guid? marketSegmentId = null)
    {
        try
        {
            var response = await _catalogService.GetCatalogsAsync(
                page, pageSize, searchTerm, status, isActive, regionId, marketSegmentId);
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalogs");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets a catalog by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CatalogDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CatalogDto>> GetCatalogById(Guid id)
    {
        try
        {
            var catalog = await _catalogService.GetCatalogByIdAsync(id);
            
            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog by ID: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets a catalog by code
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(CatalogDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CatalogDto>> GetCatalogByCode(string code)
    {
        try
        {
            var catalog = await _catalogService.GetCatalogByCodeAsync(code);
            
            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog by code: {Code}", code);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Creates a new catalog
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CatalogDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<CatalogDto>> CreateCatalog([FromBody] CreateCatalogRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if code is unique
            var isUnique = await _catalogService.IsCatalogCodeUniqueAsync(request.Code);
            if (!isUnique)
            {
                return Conflict(new { error = $"Catalog with code '{request.Code}' already exists" });
            }

            var catalog = await _catalogService.CreateCatalogAsync(request);
            
            return CreatedAtAction(nameof(GetCatalogById), new { id = catalog.Id }, catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating catalog: {Code}", request.Code);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Updates an existing catalog
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(CatalogDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CatalogDto>> UpdateCatalog(Guid id, [FromBody] UpdateCatalogRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var catalog = await _catalogService.UpdateCatalogAsync(id, request);
            
            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating catalog: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Soft deletes a catalog (sets inactive)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteCatalog(Guid id, [FromQuery] string deletedBy = "system")
    {
        try
        {
            var success = await _catalogService.DeleteCatalogAsync(id, deletedBy);
            
            if (!success)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(new { message = "Catalog deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting catalog: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Activates a catalog
    /// </summary>
    [HttpPost("{id}/activate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ActivateCatalog(Guid id, [FromBody] ActivationRequest request)
    {
        try
        {
            var success = await _catalogService.ActivateCatalogAsync(id, request.ActivatedBy ?? "system");
            
            if (!success)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(new { message = "Catalog activated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating catalog: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Deactivates a catalog
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeactivateCatalog(Guid id, [FromBody] ActivationRequest request)
    {
        try
        {
            var success = await _catalogService.DeactivateCatalogAsync(id, request.ActivatedBy ?? "system");
            
            if (!success)
            {
                return NotFound(new { error = "Catalog not found" });
            }
            
            return Ok(new { message = "Catalog deactivated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating catalog: {Id}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets catalog statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(Dictionary<string, object>), 200)]
    public async Task<ActionResult<Dictionary<string, object>>> GetCatalogStats()
    {
        try
        {
            var stats = await _catalogService.GetCatalogStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog stats");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Validates catalog code uniqueness
    /// </summary>
    [HttpGet("validate-code/{code}")]
    [ProducesResponseType(typeof(CodeValidationResponse), 200)]
    public async Task<ActionResult<CodeValidationResponse>> ValidateCatalogCode(string code, [FromQuery] Guid? excludeId = null)
    {
        try
        {
            var isUnique = await _catalogService.IsCatalogCodeUniqueAsync(code, excludeId);
            
            return Ok(new CodeValidationResponse 
            { 
                IsUnique = isUnique,
                Message = isUnique ? "Code is available" : "Code is already in use"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating catalog code: {Code}", code);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

/// <summary>
/// Request DTO for activation/deactivation operations
/// </summary>
public class ActivationRequest
{
    public string? ActivatedBy { get; set; }
}

/// <summary>
/// Response DTO for code validation
/// </summary>
public class CodeValidationResponse
{
    public bool IsUnique { get; set; }
    public string Message { get; set; } = string.Empty;
}