using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;
using Commerce.Services.PricingMdm.Api.Services;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Regions and Hierarchical Region-Locale Management
/// Provides both simple regional data and advanced tree-based management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RegionsController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly RegionLocaleTreeService _treeService;
    private readonly ILogger<RegionsController> _logger;

    public RegionsController(PricingDbContext context, RegionLocaleTreeService treeService, ILogger<RegionsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _treeService = treeService ?? throw new ArgumentNullException(nameof(treeService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active regions
    /// </summary>
    /// <returns>List of regions with id, code, name, and description</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetRegions()
    {
        try
        {
            _logger.LogInformation("Getting all active regions");

            var regions = await _context.Regions
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .Select(r => new 
                {
                    id = r.Id,
                    code = r.Code,
                    name = r.Name,
                    description = r.Description
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} active regions", regions.Count);
            return Ok(regions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting regions");
            return StatusCode(500, new { error = "Failed to retrieve regions", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific region by ID
    /// </summary>
    /// <param name="id">Region ID</param>
    /// <returns>Region details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetRegion(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting region {RegionId}", id);

            var region = await _context.Regions
                .Where(r => r.Id == id && r.IsActive)
                .Select(r => new 
                {
                    id = r.Id,
                    code = r.Code,
                    name = r.Name,
                    description = r.Description,
                    defaultCurrencyId = r.DefaultCurrencyId,
                    createdAt = r.CreatedAt,
                    updatedAt = r.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (region == null)
            {
                _logger.LogWarning("Region {RegionId} not found", id);
                return NotFound(new { error = "Region not found", regionId = id });
            }

            return Ok(region);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting region {RegionId}", id);
            return StatusCode(500, new { error = "Failed to retrieve region", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets the hierarchical region-locale tree structure
    /// </summary>
    /// <returns>Tree structure showing regions, currencies, and locales</returns>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(List<RegionLocaleTreeDto>), 200)]
    public async Task<ActionResult<List<RegionLocaleTreeDto>>> GetRegionLocaleTree()
    {
        try
        {
            _logger.LogInformation("Getting region-locale tree structure");

            var tree = await _treeService.BuildTreeAsync();

            _logger.LogInformation("Successfully retrieved tree with {NodeCount} root nodes", tree.Count);
            return Ok(tree);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting region-locale tree");
            return StatusCode(500, new { error = "Failed to retrieve region-locale tree", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets detailed information about a specific tree node
    /// </summary>
    /// <param name="nodeId">Node identifier (e.g., region_guid, locale_guid)</param>
    /// <returns>Detailed node information</returns>
    [HttpGet("tree/node/{nodeId}")]
    [ProducesResponseType(typeof(RegionLocaleTreeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<RegionLocaleTreeDto>> GetTreeNodeDetails(string nodeId)
    {
        try
        {
            _logger.LogInformation("Getting details for tree node {NodeId}", nodeId);

            var nodeDetails = await _treeService.GetNodeDetailsAsync(nodeId);

            if (nodeDetails == null)
            {
                _logger.LogWarning("Tree node {NodeId} not found", nodeId);
                return NotFound(new { error = "Tree node not found", nodeId });
            }

            return Ok(nodeDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tree node details for {NodeId}", nodeId);
            return StatusCode(500, new { error = "Failed to retrieve tree node details", message = ex.Message });
        }
    }

    /// <summary>
    /// Performs operations on the region-locale tree (add, move, delete nodes)
    /// </summary>
    /// <param name="request">Tree operation request</param>
    /// <returns>Operation result with impact analysis</returns>
    [HttpPost("tree/operations")]
    [ProducesResponseType(typeof(TreeOperationResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<TreeOperationResponse>> PerformTreeOperation([FromBody] TreeOperationRequest request)
    {
        try
        {
            _logger.LogInformation("Performing tree operation: {Operation}", request.Operation);

            if (request == null)
            {
                return BadRequest(new { error = "Request body is required" });
            }

            var result = await _treeService.PerformTreeOperationAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Tree operation failed: {Error}", result.ErrorMessage);
                return BadRequest(new { error = result.ErrorMessage, result.Impact });
            }

            _logger.LogInformation("Tree operation completed successfully");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing tree operation");
            return StatusCode(500, new { error = "Failed to perform tree operation", message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new region
    /// </summary>
    /// <param name="region">Region data</param>
    /// <returns>Created region</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<object>> CreateRegion([FromBody] Region region)
    {
        try
        {
            _logger.LogInformation("Creating new region: {RegionCode}", region.Code);

            if (region == null)
            {
                return BadRequest(new { error = "Region data is required" });
            }

            if (string.IsNullOrWhiteSpace(region.Code) || string.IsNullOrWhiteSpace(region.Name))
            {
                return BadRequest(new { error = "Region code and name are required" });
            }

            // Check if region code already exists
            var existingRegion = await _context.Regions
                .FirstOrDefaultAsync(r => r.Code == region.Code);

            if (existingRegion != null)
            {
                return BadRequest(new { error = $"Region with code '{region.Code}' already exists" });
            }

            region.Id = Guid.NewGuid();
            region.CreatedAt = DateTime.UtcNow;
            region.UpdatedAt = DateTime.UtcNow;

            _context.Regions.Add(region);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = region.Id,
                code = region.Code,
                name = region.Name,
                description = region.Description,
                isActive = region.IsActive,
                createdAt = region.CreatedAt
            };

            _logger.LogInformation("Successfully created region: {RegionId}", region.Id);
            return CreatedAtAction(nameof(GetRegion), new { id = region.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating region");
            return StatusCode(500, new { error = "Failed to create region", message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing region
    /// </summary>
    /// <param name="id">Region ID</param>
    /// <param name="region">Updated region data</param>
    /// <returns>Updated region</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<object>> UpdateRegion(Guid id, [FromBody] Region region)
    {
        try
        {
            _logger.LogInformation("Updating region: {RegionId}", id);

            if (region == null)
            {
                return BadRequest(new { error = "Region data is required" });
            }

            var existingRegion = await _context.Regions.FindAsync(id);
            if (existingRegion == null)
            {
                _logger.LogWarning("Region {RegionId} not found for update", id);
                return NotFound(new { error = "Region not found", regionId = id });
            }

            // Update properties
            existingRegion.Name = region.Name;
            existingRegion.Description = region.Description;
            existingRegion.DefaultCurrencyId = region.DefaultCurrencyId;
            existingRegion.IsActive = region.IsActive;
            existingRegion.UpdatedAt = DateTime.UtcNow;
            existingRegion.UpdatedBy = region.UpdatedBy;

            await _context.SaveChangesAsync();

            var result = new
            {
                id = existingRegion.Id,
                code = existingRegion.Code,
                name = existingRegion.Name,
                description = existingRegion.Description,
                defaultCurrencyId = existingRegion.DefaultCurrencyId,
                isActive = existingRegion.IsActive,
                updatedAt = existingRegion.UpdatedAt
            };

            _logger.LogInformation("Successfully updated region: {RegionId}", id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating region {RegionId}", id);
            return StatusCode(500, new { error = "Failed to update region", message = ex.Message });
        }
    }

    /// <summary>
    /// Deactivates a region (soft delete)
    /// </summary>
    /// <param name="id">Region ID</param>
    /// <returns>Success confirmation</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> DeleteRegion(Guid id)
    {
        try
        {
            _logger.LogInformation("Deactivating region: {RegionId}", id);

            var region = await _context.Regions.FindAsync(id);
            if (region == null)
            {
                _logger.LogWarning("Region {RegionId} not found for deletion", id);
                return NotFound(new { error = "Region not found", regionId = id });
            }

            // Soft delete - set to inactive
            region.IsActive = false;
            region.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully deactivated region: {RegionId}", id);
            return Ok(new { message = "Region deactivated successfully", regionId = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating region {RegionId}", id);
            return StatusCode(500, new { error = "Failed to deactivate region", message = ex.Message });
        }
    }
}