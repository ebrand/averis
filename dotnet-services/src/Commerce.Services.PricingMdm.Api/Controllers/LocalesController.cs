using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Locales Management
/// Provides CRUD operations for international locales
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class LocalesController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<LocalesController> _logger;

    public LocalesController(PricingDbContext context, ILogger<LocalesController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active locales with their region and currency information
    /// </summary>
    /// <param name="regionId">Optional filter by region ID</param>
    /// <param name="currencyId">Optional filter by currency ID</param>
    /// <returns>List of locales</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetLocales(Guid? regionId = null, Guid? currencyId = null)
    {
        try
        {
            _logger.LogInformation("Getting locales with filters - RegionId: {RegionId}, CurrencyId: {CurrencyId}", regionId, currencyId);

            var query = _context.Locales
                .Include(l => l.Region)
                .Include(l => l.Currency)
                .Where(l => l.IsActive);

            if (regionId.HasValue)
            {
                query = query.Where(l => l.RegionId == regionId.Value);
            }

            if (currencyId.HasValue)
            {
                query = query.Where(l => l.CurrencyId == currencyId.Value);
            }

            var locales = await query
                .OrderBy(l => l.Region.Name)
                .ThenBy(l => l.Name)
                .Select(l => new
                {
                    id = l.Id,
                    code = l.Code,
                    name = l.Name,
                    nativeName = l.NativeName,
                    languageCode = l.LanguageCode,
                    countryCode = l.CountryCode,
                    isRtl = l.IsRtl,
                    dateFormat = l.DateFormat,
                    numberFormat = l.NumberFormat,
                    region = new
                    {
                        id = l.Region.Id,
                        code = l.Region.Code,
                        name = l.Region.Name
                    },
                    currency = new
                    {
                        id = l.Currency.Id,
                        code = l.Currency.Code,
                        name = l.Currency.Name,
                        symbol = l.Currency.Symbol
                    },
                    isActive = l.IsActive,
                    createdAt = l.CreatedAt,
                    updatedAt = l.UpdatedAt
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} locales", locales.Count);
            return Ok(locales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locales");
            return StatusCode(500, new { error = "Failed to retrieve locales", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific locale by ID
    /// </summary>
    /// <param name="id">Locale ID</param>
    /// <returns>Locale details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetLocale(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting locale {LocaleId}", id);

            var locale = await _context.Locales
                .Include(l => l.Region)
                .Include(l => l.Currency)
                .Where(l => l.Id == id && l.IsActive)
                .Select(l => new
                {
                    id = l.Id,
                    code = l.Code,
                    name = l.Name,
                    nativeName = l.NativeName,
                    languageCode = l.LanguageCode,
                    countryCode = l.CountryCode,
                    isRtl = l.IsRtl,
                    dateFormat = l.DateFormat,
                    numberFormat = l.NumberFormat,
                    region = new
                    {
                        id = l.Region.Id,
                        code = l.Region.Code,
                        name = l.Region.Name
                    },
                    currency = new
                    {
                        id = l.Currency.Id,
                        code = l.Currency.Code,
                        name = l.Currency.Name,
                        symbol = l.Currency.Symbol
                    },
                    isActive = l.IsActive,
                    createdAt = l.CreatedAt,
                    updatedAt = l.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (locale == null)
            {
                _logger.LogWarning("Locale {LocaleId} not found", id);
                return NotFound(new { error = "Locale not found", localeId = id });
            }

            return Ok(locale);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locale {LocaleId}", id);
            return StatusCode(500, new { error = "Failed to retrieve locale", message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new locale
    /// </summary>
    /// <param name="locale">Locale data</param>
    /// <returns>Created locale</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<object>> CreateLocale([FromBody] Locale locale)
    {
        try
        {
            _logger.LogInformation("Creating new locale: {LocaleCode}", locale.Code);

            if (locale == null)
            {
                return BadRequest(new { error = "Locale data is required" });
            }

            if (string.IsNullOrWhiteSpace(locale.Code) || string.IsNullOrWhiteSpace(locale.Name))
            {
                return BadRequest(new { error = "Locale code and name are required" });
            }

            // Check if locale code already exists
            var existingLocale = await _context.Locales
                .FirstOrDefaultAsync(l => l.Code == locale.Code);

            if (existingLocale != null)
            {
                return BadRequest(new { error = $"Locale with code '{locale.Code}' already exists" });
            }

            // Validate region exists
            var region = await _context.Regions.FindAsync(locale.RegionId);
            if (region == null)
            {
                return BadRequest(new { error = "Invalid region ID" });
            }

            // Validate currency exists
            var currency = await _context.Currencies.FindAsync(locale.CurrencyId);
            if (currency == null)
            {
                return BadRequest(new { error = "Invalid currency ID" });
            }

            locale.Id = Guid.NewGuid();
            locale.CreatedAt = DateTime.UtcNow;
            locale.UpdatedAt = DateTime.UtcNow;

            _context.Locales.Add(locale);
            await _context.SaveChangesAsync();

            // Return the created locale with relationships
            var createdLocale = await GetLocale(locale.Id);
            if (createdLocale.Result is OkObjectResult okResult)
            {
                _logger.LogInformation("Successfully created locale: {LocaleId}", locale.Id);
                return CreatedAtAction(nameof(GetLocale), new { id = locale.Id }, okResult.Value);
            }

            return StatusCode(500, new { error = "Locale created but failed to retrieve" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating locale");
            return StatusCode(500, new { error = "Failed to create locale", message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing locale
    /// </summary>
    /// <param name="id">Locale ID</param>
    /// <param name="locale">Updated locale data</param>
    /// <returns>Updated locale</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<object>> UpdateLocale(Guid id, [FromBody] Locale locale)
    {
        try
        {
            _logger.LogInformation("Updating locale: {LocaleId}", id);

            if (locale == null)
            {
                return BadRequest(new { error = "Locale data is required" });
            }

            var existingLocale = await _context.Locales.FindAsync(id);
            if (existingLocale == null)
            {
                _logger.LogWarning("Locale {LocaleId} not found for update", id);
                return NotFound(new { error = "Locale not found", localeId = id });
            }

            // Validate region exists if changed
            if (existingLocale.RegionId != locale.RegionId)
            {
                var region = await _context.Regions.FindAsync(locale.RegionId);
                if (region == null)
                {
                    return BadRequest(new { error = "Invalid region ID" });
                }
            }

            // Validate currency exists if changed
            if (existingLocale.CurrencyId != locale.CurrencyId)
            {
                var currency = await _context.Currencies.FindAsync(locale.CurrencyId);
                if (currency == null)
                {
                    return BadRequest(new { error = "Invalid currency ID" });
                }
            }

            // Update properties (don't allow code changes for data integrity)
            existingLocale.Name = locale.Name;
            existingLocale.NativeName = locale.NativeName;
            existingLocale.LanguageCode = locale.LanguageCode;
            existingLocale.CountryCode = locale.CountryCode;
            existingLocale.RegionId = locale.RegionId;
            existingLocale.CurrencyId = locale.CurrencyId;
            existingLocale.IsRtl = locale.IsRtl;
            existingLocale.DateFormat = locale.DateFormat;
            existingLocale.NumberFormat = locale.NumberFormat;
            existingLocale.IsActive = locale.IsActive;
            existingLocale.UpdatedAt = DateTime.UtcNow;
            existingLocale.UpdatedBy = locale.UpdatedBy;

            await _context.SaveChangesAsync();

            // Return the updated locale with relationships
            var updatedLocale = await GetLocale(id);
            if (updatedLocale.Result is OkObjectResult okResult)
            {
                _logger.LogInformation("Successfully updated locale: {LocaleId}", id);
                return Ok(okResult.Value);
            }

            return StatusCode(500, new { error = "Locale updated but failed to retrieve" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating locale {LocaleId}", id);
            return StatusCode(500, new { error = "Failed to update locale", message = ex.Message });
        }
    }

    /// <summary>
    /// Deactivates a locale (soft delete)
    /// </summary>
    /// <param name="id">Locale ID</param>
    /// <returns>Success confirmation</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> DeleteLocale(Guid id)
    {
        try
        {
            _logger.LogInformation("Deactivating locale: {LocaleId}", id);

            var locale = await _context.Locales.FindAsync(id);
            if (locale == null)
            {
                _logger.LogWarning("Locale {LocaleId} not found for deletion", id);
                return NotFound(new { error = "Locale not found", localeId = id });
            }

            // Soft delete - set to inactive
            locale.IsActive = false;
            locale.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully deactivated locale: {LocaleId}", id);
            return Ok(new { message = "Locale deactivated successfully", localeId = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating locale {LocaleId}", id);
            return StatusCode(500, new { error = "Failed to deactivate locale", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets available locales that can be added to a specific region
    /// </summary>
    /// <param name="regionId">Region ID</param>
    /// <returns>List of available locales not yet assigned to the region</returns>
    [HttpGet("available/{regionId}")]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableLocalesForRegion(Guid regionId)
    {
        try
        {
            _logger.LogInformation("Getting available locales for region {RegionId}", regionId);

            var region = await _context.Regions.FindAsync(regionId);
            if (region == null)
            {
                return NotFound(new { error = "Region not found", regionId });
            }

            // Get locales that are not yet in this region
            var assignedLocaleCodes = await _context.Locales
                .Where(l => l.RegionId == regionId && l.IsActive)
                .Select(l => l.Code)
                .ToListAsync();

            // For this example, we'll return a curated list of common locale codes
            // In a real implementation, this might be from a master list or external service
            var availableLocales = new[]
            {
                new { code = "en_US", name = "English (United States)", languageCode = "en", countryCode = "US" },
                new { code = "en_GB", name = "English (United Kingdom)", languageCode = "en", countryCode = "GB" },
                new { code = "fr_FR", name = "French (France)", languageCode = "fr", countryCode = "FR" },
                new { code = "de_DE", name = "German (Germany)", languageCode = "de", countryCode = "DE" },
                new { code = "es_ES", name = "Spanish (Spain)", languageCode = "es", countryCode = "ES" },
                new { code = "it_IT", name = "Italian (Italy)", languageCode = "it", countryCode = "IT" },
                new { code = "ja_JP", name = "Japanese (Japan)", languageCode = "ja", countryCode = "JP" },
                new { code = "zh_CN", name = "Chinese (China)", languageCode = "zh", countryCode = "CN" },
                new { code = "pt_BR", name = "Portuguese (Brazil)", languageCode = "pt", countryCode = "BR" },
                new { code = "ru_RU", name = "Russian (Russia)", languageCode = "ru", countryCode = "RU" }
            }
            .Where(l => !assignedLocaleCodes.Contains(l.code))
            .ToList();

            _logger.LogInformation("Found {Count} available locales for region {RegionId}", availableLocales.Count, regionId);
            return Ok(availableLocales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locales for region {RegionId}", regionId);
            return StatusCode(500, new { error = "Failed to retrieve available locales", message = ex.Message });
        }
    }

    /// <summary>
    /// Bulk assigns multiple locales to a region
    /// </summary>
    /// <param name="regionId">Region ID</param>
    /// <param name="localeAssignments">List of locale assignment data</param>
    /// <returns>Summary of assignments</returns>
    [HttpPost("bulk-assign/{regionId}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> BulkAssignLocales(Guid regionId, [FromBody] List<LocaleAssignmentDto> localeAssignments)
    {
        try
        {
            _logger.LogInformation("Bulk assigning {Count} locales to region {RegionId}", localeAssignments?.Count ?? 0, regionId);

            if (localeAssignments == null || localeAssignments.Count == 0)
            {
                return BadRequest(new { error = "Locale assignments data is required" });
            }

            var region = await _context.Regions.FindAsync(regionId);
            if (region == null)
            {
                return NotFound(new { error = "Region not found", regionId });
            }

            var createdLocales = new List<object>();
            var errors = new List<string>();

            foreach (var assignment in localeAssignments)
            {
                try
                {
                    // Check if locale already exists
                    var existingLocale = await _context.Locales
                        .FirstOrDefaultAsync(l => l.Code == assignment.LocaleCode);

                    if (existingLocale != null)
                    {
                        errors.Add($"Locale {assignment.LocaleCode} already exists");
                        continue;
                    }

                    // Validate currency
                    var currency = await _context.Currencies
                        .FirstOrDefaultAsync(c => c.Code == assignment.CurrencyCode);

                    if (currency == null)
                    {
                        errors.Add($"Currency {assignment.CurrencyCode} not found for locale {assignment.LocaleCode}");
                        continue;
                    }

                    var newLocale = new Locale
                    {
                        Id = Guid.NewGuid(),
                        Code = assignment.LocaleCode,
                        Name = assignment.Name,
                        NativeName = assignment.NativeName ?? assignment.Name,
                        LanguageCode = assignment.LanguageCode,
                        CountryCode = assignment.CountryCode,
                        RegionId = regionId,
                        CurrencyId = currency.Id,
                        DateFormat = assignment.DateFormat ?? "MM/DD/YYYY",
                        NumberFormat = assignment.NumberFormat ?? "{}",
                        IsRtl = assignment.IsRtl,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Locales.Add(newLocale);
                    createdLocales.Add(new
                    {
                        id = newLocale.Id,
                        code = newLocale.Code,
                        name = newLocale.Name
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating locale {LocaleCode}", assignment.LocaleCode);
                    errors.Add($"Failed to create locale {assignment.LocaleCode}: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();

            var result = new
            {
                regionId,
                created = createdLocales.Count,
                errors = errors.Count,
                createdLocales,
                errorMessages = errors
            };

            _logger.LogInformation("Bulk assignment completed: {Created} created, {Errors} errors", createdLocales.Count, errors.Count);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk locale assignment for region {RegionId}", regionId);
            return StatusCode(500, new { error = "Failed to bulk assign locales", message = ex.Message });
        }
    }
}

/// <summary>
/// DTO for bulk locale assignment operations
/// </summary>
public class LocaleAssignmentDto
{
    public string LocaleCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NativeName { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public string? DateFormat { get; set; }
    public string? NumberFormat { get; set; }
    public bool IsRtl { get; set; } = false;
}