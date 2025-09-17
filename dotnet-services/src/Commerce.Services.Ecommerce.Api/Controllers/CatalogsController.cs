using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Ecommerce.Api.Services;

namespace Commerce.Services.Ecommerce.Api.Controllers;

/// <summary>
/// Controller for catalog operations that proxy to Pricing MDM API
/// Provides e-commerce access to catalog and pricing information
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CatalogsController : ControllerBase
{
    private readonly IPricingService _pricingService;
    private readonly ILogger<CatalogsController> _logger;

    public CatalogsController(IPricingService pricingService, ILogger<CatalogsController> logger)
    {
        _pricingService = pricingService;
        _logger = logger;
    }

    /// <summary>
    /// Get available regions
    /// </summary>
    [HttpGet("regions")]
    public async Task<IActionResult> GetRegions()
    {
        try
        {
            var regions = await _pricingService.GetRegionsAsync();

            return Ok(new
            {
                success = true,
                data = regions,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/catalogs/regions");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch regions",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get available channels
    /// </summary>
    [HttpGet("channels")]
    public async Task<IActionResult> GetChannels()
    {
        try
        {
            var channels = await _pricingService.GetChannelsAsync();

            return Ok(new
            {
                success = true,
                data = channels,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/catalogs/channels");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch channels",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get default catalog for region/channel
    /// </summary>
    [HttpGet("default")]
    public async Task<IActionResult> GetDefaultCatalog(
        [FromQuery] string region = "AMER",
        [FromQuery] string channel = "DIRECT")
    {
        try
        {
            var catalog = await _pricingService.GetDefaultCatalogAsync(region, channel);

            if (catalog == null)
            {
                return NotFound(new
                {
                    success = false,
                    error = "Default catalog not found",
                    message = $"No default catalog found for region \"{region}\" and channel \"{channel}\""
                });
            }

            return Ok(new
            {
                success = true,
                data = catalog,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/catalogs/default");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch default catalog",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get catalogs for a region
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCatalogs([FromQuery] string region = "AMER")
    {
        try
        {
            var catalogs = await _pricingService.GetCatalogsByRegionAsync(region);

            return Ok(new
            {
                success = true,
                data = catalogs,
                source = "ecommerce-api",
                region
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/catalogs");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch catalogs",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get catalog by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCatalog(string id)
    {
        try
        {
            var catalog = await _pricingService.GetCatalogByIdAsync(id);

            if (catalog == null)
            {
                return NotFound(new
                {
                    success = false,
                    error = "Catalog not found",
                    message = $"Catalog with ID \"{id}\" not found"
                });
            }

            return Ok(new
            {
                success = true,
                data = catalog,
                source = "ecommerce-api"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GET /api/catalogs/{Id}", id);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to fetch catalog",
                message = ex.Message
            });
        }
    }
}