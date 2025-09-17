using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Catalogs operations (plural route - matches React UI expectations)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CatalogsController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<CatalogsController> _logger;

    public CatalogsController(PricingDbContext context, ILogger<CatalogsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets catalogs with optional region filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetCatalogs([FromQuery] string? region = null)
    {
        try
        {
            var query = _context.Catalogs.AsQueryable();

            // Filter by region code if provided
            if (!string.IsNullOrEmpty(region))
            {
                // Get region ID by code
                var regionEntity = await _context.Set<Region>()
                    .FirstOrDefaultAsync(r => r.Code == region.ToUpper());
                
                if (regionEntity != null)
                {
                    query = query.Where(c => c.RegionId == regionEntity.Id);
                }
                else
                {
                    // If region not found, return empty result
                    return Ok(new { catalogs = new List<object>() });
                }
            }

            var catalogs = await query.Select(c => new
                {
                    c.Id,
                    c.Code,
                    c.Name,
                    c.RegionId,
                    c.MarketSegmentId,
                    market_segment_id = c.MarketSegmentId,
                    c.CurrencyId,
                    c.EffectiveFrom,
                    effective_from = c.EffectiveFrom,
                    c.EffectiveTo,
                    effective_to = c.EffectiveTo,
                    c.Priority,
                    c.Status,
                    c.IsActive,
                    is_active = c.IsActive,
                    c.CreatedAt,
                    created_at = c.CreatedAt,
                    c.UpdatedAt,
                    updated_at = c.UpdatedAt,
                    product_count = (from cp in _context.Set<CatalogProduct>() 
                                   where cp.CatalogId == c.Id && cp.IsActive 
                                   select cp).Count(),
                    // Simplified - no joins for now
                    channel_name = "Unknown Channel",
                    currency_code = "USD",
                    is_default = c.IsDefault
                }).ToListAsync();

            return Ok(new { catalogs });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalogs with region filter: {Region}", region);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets available channels (market segments) for catalog creation
    /// </summary>
    [HttpGet("channels")]
    public async Task<ActionResult> GetChannels()
    {
        try
        {
            var channels = await _context.Set<MarketSegment>()
                .Where(ms => ms.IsActive)
                .Select(ms => new
                {
                    ms.Id,
                    ms.Code,
                    ms.Name,
                    ms.Description
                })
                .ToListAsync();

            return Ok(new { channels });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting channels");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets available regions for catalog creation
    /// </summary>
    [HttpGet("regions")]
    public async Task<ActionResult> GetRegions()
    {
        try
        {
            var regions = await _context.Set<Region>()
                .Where(r => r.IsActive)
                .Select(r => new
                {
                    r.Id,
                    r.Code,
                    r.Name,
                    r.Description
                })
                .ToListAsync();

            return Ok(new { regions });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting regions");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets available currencies for catalog creation
    /// </summary>
    [HttpGet("currencies")]
    public async Task<ActionResult> GetCurrencies()
    {
        try
        {
            var currencies = await _context.Set<Currency>()
                .Where(c => c.IsActive)
                .Select(c => new
                {
                    c.Id,
                    c.Code,
                    c.Name,
                    c.Symbol,
                    c.DecimalPlaces,
                    decimal_places = c.DecimalPlaces
                })
                .ToListAsync();

            return Ok(new { currencies });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting currencies");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Creates a new catalog
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> CreateCatalog([FromBody] JsonElement request)
    {
        try
        {
            _logger.LogInformation("Creating new catalog with request: {Request}", request);

            // Extract required fields from the JSON request
            if (!request.TryGetProperty("Code", out var codeElement) || codeElement.ValueKind != JsonValueKind.String)
            {
                return BadRequest(new { error = "Code is required" });
            }
            var code = codeElement.GetString();
            if (string.IsNullOrEmpty(code))
            {
                return BadRequest(new { error = "Code cannot be empty" });
            }

            if (!request.TryGetProperty("Name", out var nameElement) || nameElement.ValueKind != JsonValueKind.String)
            {
                return BadRequest(new { error = "Name is required" });
            }
            var name = nameElement.GetString();
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest(new { error = "Name cannot be empty" });
            }

            // Check if code already exists
            var existingCatalog = await _context.Catalogs.FirstOrDefaultAsync(c => c.Code == code);
            if (existingCatalog != null)
            {
                return BadRequest(new { error = $"A catalog with code '{code}' already exists" });
            }

            // Create new catalog
            var catalog = new Catalog
            {
                Id = Guid.NewGuid(),
                Code = code,
                Name = name,
                Priority = 1,
                Status = "active",
                IsActive = true,
                IsDefault = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "pricing-ui"
            };

            // Set optional fields
            if (request.TryGetProperty("RegionId", out var regionIdElement) && regionIdElement.ValueKind == JsonValueKind.String)
            {
                if (Guid.TryParse(regionIdElement.GetString(), out var regionId))
                {
                    catalog.RegionId = regionId;
                }
            }

            if (request.TryGetProperty("MarketSegmentId", out var marketSegmentIdElement) && marketSegmentIdElement.ValueKind == JsonValueKind.String)
            {
                if (Guid.TryParse(marketSegmentIdElement.GetString(), out var marketSegmentId))
                {
                    catalog.MarketSegmentId = marketSegmentId;
                }
            }

            if (request.TryGetProperty("CurrencyId", out var currencyIdElement) && currencyIdElement.ValueKind == JsonValueKind.String)
            {
                if (Guid.TryParse(currencyIdElement.GetString(), out var currencyId))
                {
                    catalog.CurrencyId = currencyId;
                }
            }

            if (request.TryGetProperty("Priority", out var priorityElement) && priorityElement.ValueKind == JsonValueKind.Number)
            {
                catalog.Priority = priorityElement.GetInt32();
            }

            if (request.TryGetProperty("Status", out var statusElement) && statusElement.ValueKind == JsonValueKind.String)
            {
                var status = statusElement.GetString();
                if (!string.IsNullOrEmpty(status))
                {
                    catalog.Status = status;
                    catalog.IsActive = status == "active";
                }
            }

            if (request.TryGetProperty("IsActive", out var isActiveElement) && 
                (isActiveElement.ValueKind == JsonValueKind.True || isActiveElement.ValueKind == JsonValueKind.False))
            {
                catalog.IsActive = isActiveElement.GetBoolean();
            }

            if (request.TryGetProperty("IsDefault", out var isDefaultElement) && 
                (isDefaultElement.ValueKind == JsonValueKind.True || isDefaultElement.ValueKind == JsonValueKind.False))
            {
                catalog.IsDefault = isDefaultElement.GetBoolean();
                _logger.LogInformation("Setting IsDefault to: {IsDefault}", catalog.IsDefault);
            }

            // Handle effective from date
            if (request.TryGetProperty("EffectiveFrom", out var effectiveFromElement) && effectiveFromElement.ValueKind == JsonValueKind.String)
            {
                var effectiveFromStr = effectiveFromElement.GetString();
                if (!string.IsNullOrEmpty(effectiveFromStr) && DateTime.TryParse(effectiveFromStr, out var effectiveFrom))
                {
                    catalog.EffectiveFrom = effectiveFrom.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveFrom, DateTimeKind.Utc) 
                        : effectiveFrom.ToUniversalTime();
                    _logger.LogInformation("Setting EffectiveFrom to: {EffectiveFrom}", catalog.EffectiveFrom);
                }
            }

            // Handle effective to date
            if (request.TryGetProperty("EffectiveTo", out var effectiveToElement) && effectiveToElement.ValueKind == JsonValueKind.String)
            {
                var effectiveToStr = effectiveToElement.GetString();
                if (!string.IsNullOrEmpty(effectiveToStr) && DateTime.TryParse(effectiveToStr, out var effectiveTo))
                {
                    catalog.EffectiveTo = effectiveTo.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveTo, DateTimeKind.Utc) 
                        : effectiveTo.ToUniversalTime();
                    _logger.LogInformation("Setting EffectiveTo to: {EffectiveTo}", catalog.EffectiveTo);
                }
            }

            if (request.TryGetProperty("CreatedBy", out var createdByElement) && createdByElement.ValueKind == JsonValueKind.String)
            {
                var createdBy = createdByElement.GetString();
                if (!string.IsNullOrEmpty(createdBy))
                {
                    catalog.CreatedBy = createdBy;
                }
            }

            // Add to database
            _context.Catalogs.Add(catalog);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created catalog: {Code} ({Id}) - {Name}", catalog.Code, catalog.Id, catalog.Name);

            return Ok(new { 
                message = "Catalog created successfully", 
                id = catalog.Id,
                catalog = new {
                    catalog.Id,
                    catalog.Code,
                    catalog.Name,
                    catalog.Status,
                    catalog.IsActive,
                    catalog.IsDefault,
                    catalog.Priority,
                    catalog.EffectiveFrom,
                    catalog.EffectiveTo,
                    catalog.CreatedAt
                }
            });
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx)
        {
            _logger.LogError(ex, "Database error creating catalog");
            
            // Handle specific database constraint violations
            if (pgEx.SqlState == "23505") // Unique constraint violation
            {
                if (pgEx.ConstraintName == "IX_catalogs_region_id_market_segment_id")
                {
                    return BadRequest(new { error = "A catalog already exists for this region and channel combination. Please choose a different region or channel." });
                }
                if (pgEx.TableName == "catalogs" && pgEx.ConstraintName?.Contains("code") == true)
                {
                    return BadRequest(new { error = "A catalog with this code already exists. Please choose a different code." });
                }
                return BadRequest(new { error = "This catalog conflicts with an existing catalog. Please check your input values." });
            }
            if (pgEx.SqlState == "23503") // Foreign key constraint violation
            {
                if (pgEx.ConstraintName?.Contains("currency") == true)
                {
                    return BadRequest(new { error = "Invalid currency selected. Please choose a valid currency." });
                }
                if (pgEx.ConstraintName?.Contains("region") == true)
                {
                    return BadRequest(new { error = "Invalid region selected. Please choose a valid region." });
                }
                if (pgEx.ConstraintName?.Contains("market_segment") == true)
                {
                    return BadRequest(new { error = "Invalid channel selected. Please choose a valid channel." });
                }
                return BadRequest(new { error = "Invalid reference data selected. Please check your selections." });
            }
            
            return BadRequest(new { error = "Database error occurred while creating catalog." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating catalog");
            return StatusCode(500, new { error = "An unexpected error occurred while creating the catalog." });
        }
    }

    /// <summary>
    /// Updates an existing catalog
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateCatalog(Guid id, [FromBody] JsonElement request)
    {
        try
        {
            var catalog = await _context.Catalogs.FindAsync(id);
            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }

            // Update catalog properties based on provided JSON
            if (request.TryGetProperty("code", out var codeElement) && codeElement.ValueKind == JsonValueKind.String)
            {
                catalog.Code = codeElement.GetString() ?? catalog.Code;
            }

            if (request.TryGetProperty("name", out var nameElement) && nameElement.ValueKind == JsonValueKind.String)
            {
                catalog.Name = nameElement.GetString() ?? catalog.Name;
            }

            if (request.TryGetProperty("status", out var statusElement) && statusElement.ValueKind == JsonValueKind.String)
            {
                catalog.Status = statusElement.GetString() ?? catalog.Status;
                catalog.IsActive = catalog.Status == "active";
            }

            if (request.TryGetProperty("priority", out var priorityElement) && priorityElement.ValueKind == JsonValueKind.Number)
            {
                catalog.Priority = priorityElement.GetInt32();
            }

            // Handle market segment (sales channel) updates
            if (request.TryGetProperty("channel_id", out var channelElement) && channelElement.ValueKind == JsonValueKind.String)
            {
                var channelId = channelElement.GetString();
                if (Guid.TryParse(channelId, out var parsedChannelId))
                {
                    catalog.MarketSegmentId = parsedChannelId;
                }
            }

            // Handle effective from date (PascalCase from UI)
            if (request.TryGetProperty("EffectiveFrom", out var effectiveFromElement) && effectiveFromElement.ValueKind == JsonValueKind.String)
            {
                var effectiveFromStr = effectiveFromElement.GetString();
                if (!string.IsNullOrEmpty(effectiveFromStr) && DateTime.TryParse(effectiveFromStr, out var effectiveFrom))
                {
                    // Ensure UTC timestamp for PostgreSQL compatibility
                    catalog.EffectiveFrom = effectiveFrom.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveFrom, DateTimeKind.Utc) 
                        : effectiveFrom.ToUniversalTime();
                    _logger.LogInformation("Catalog {CatalogId} EffectiveFrom set to: {EffectiveFrom}", catalog.Id, catalog.EffectiveFrom);
                }
                else if (string.IsNullOrEmpty(effectiveFromStr))
                {
                    catalog.EffectiveFrom = null;
                    _logger.LogInformation("Catalog {CatalogId} EffectiveFrom cleared", catalog.Id);
                }
            }
            // Also handle legacy snake_case effective_from for backwards compatibility
            else if (request.TryGetProperty("effective_from", out var effectiveFromElementLegacy) && effectiveFromElementLegacy.ValueKind == JsonValueKind.String)
            {
                var effectiveFromStr = effectiveFromElementLegacy.GetString();
                if (!string.IsNullOrEmpty(effectiveFromStr) && DateTime.TryParse(effectiveFromStr, out var effectiveFrom))
                {
                    // Ensure UTC timestamp for PostgreSQL compatibility
                    catalog.EffectiveFrom = effectiveFrom.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveFrom, DateTimeKind.Utc) 
                        : effectiveFrom.ToUniversalTime();
                    _logger.LogInformation("Catalog {CatalogId} effective_from set to: {EffectiveFrom}", catalog.Id, catalog.EffectiveFrom);
                }
                else if (string.IsNullOrEmpty(effectiveFromStr))
                {
                    catalog.EffectiveFrom = null;
                    _logger.LogInformation("Catalog {CatalogId} effective_from cleared", catalog.Id);
                }
            }

            // Handle effective to date (PascalCase from UI)
            if (request.TryGetProperty("EffectiveTo", out var effectiveToElement) && effectiveToElement.ValueKind == JsonValueKind.String)
            {
                var effectiveToStr = effectiveToElement.GetString();
                if (!string.IsNullOrEmpty(effectiveToStr) && DateTime.TryParse(effectiveToStr, out var effectiveTo))
                {
                    // Ensure UTC timestamp for PostgreSQL compatibility
                    catalog.EffectiveTo = effectiveTo.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveTo, DateTimeKind.Utc) 
                        : effectiveTo.ToUniversalTime();
                    _logger.LogInformation("Catalog {CatalogId} EffectiveTo set to: {EffectiveTo}", catalog.Id, catalog.EffectiveTo);
                }
                else if (string.IsNullOrEmpty(effectiveToStr))
                {
                    catalog.EffectiveTo = null;
                    _logger.LogInformation("Catalog {CatalogId} EffectiveTo cleared", catalog.Id);
                }
            }
            // Also handle legacy snake_case effective_to for backwards compatibility
            else if (request.TryGetProperty("effective_to", out var effectiveToElementLegacy) && effectiveToElementLegacy.ValueKind == JsonValueKind.String)
            {
                var effectiveToStr = effectiveToElementLegacy.GetString();
                if (!string.IsNullOrEmpty(effectiveToStr) && DateTime.TryParse(effectiveToStr, out var effectiveTo))
                {
                    // Ensure UTC timestamp for PostgreSQL compatibility
                    catalog.EffectiveTo = effectiveTo.Kind == DateTimeKind.Unspecified 
                        ? DateTime.SpecifyKind(effectiveTo, DateTimeKind.Utc) 
                        : effectiveTo.ToUniversalTime();
                    _logger.LogInformation("Catalog {CatalogId} effective_to set to: {EffectiveTo}", catalog.Id, catalog.EffectiveTo);
                }
                else if (string.IsNullOrEmpty(effectiveToStr))
                {
                    catalog.EffectiveTo = null;
                    _logger.LogInformation("Catalog {CatalogId} effective_to cleared", catalog.Id);
                }
            }

            // Handle IsDefault flag (PascalCase from UI)
            if (request.TryGetProperty("IsDefault", out var isDefaultElement) && 
                (isDefaultElement.ValueKind == JsonValueKind.True || isDefaultElement.ValueKind == JsonValueKind.False))
            {
                var isDefault = isDefaultElement.GetBoolean();
                catalog.IsDefault = isDefault;
                _logger.LogInformation("Catalog {CatalogId} IsDefault flag set to: {IsDefault}", catalog.Id, isDefault);
            }
            // Also handle legacy snake_case is_default for backwards compatibility
            else if (request.TryGetProperty("is_default", out var isDefaultElementLegacy) && 
                     (isDefaultElementLegacy.ValueKind == JsonValueKind.True || isDefaultElementLegacy.ValueKind == JsonValueKind.False))
            {
                var isDefault = isDefaultElementLegacy.GetBoolean();
                catalog.IsDefault = isDefault;
                _logger.LogInformation("Catalog {CatalogId} is_default flag set to: {IsDefault}", catalog.Id, isDefault);
            }

            catalog.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated catalog {CatalogId} - {CatalogName}", catalog.Id, catalog.Name);

            return Ok(new { 
                message = "Catalog updated successfully",
                catalog = new {
                    catalog.Id,
                    catalog.Code,
                    catalog.Name,
                    catalog.Status,
                    catalog.Priority,
                    catalog.MarketSegmentId,
                    catalog.EffectiveFrom,
                    catalog.EffectiveTo,
                    catalog.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating catalog {Id}", id);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

