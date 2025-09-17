using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;
using System.Net;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Countries Management
/// Provides CRUD operations and IP-based country detection
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CountriesController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<CountriesController> _logger;

    public CountriesController(PricingDbContext context, ILogger<CountriesController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active countries with their region and compliance information
    /// </summary>
    /// <param name="regionId">Optional filter by region ID</param>
    /// <param name="includeCompliance">Include compliance information</param>
    /// <returns>List of countries</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetCountries(
        Guid? regionId = null, 
        bool includeCompliance = false)
    {
        try
        {
            _logger.LogInformation("Getting countries with filters - RegionId: {RegionId}, IncludeCompliance: {IncludeCompliance}", 
                regionId, includeCompliance);

            var query = _context.Countries
                .Include(c => c.Region)
                .Include(c => c.DefaultLocale)
                .Where(c => c.IsActive);

            if (includeCompliance)
            {
                query = query.Include(c => c.ComplianceProfile);
            }

            if (regionId.HasValue)
            {
                query = query.Where(c => c.RegionId == regionId.Value);
            }

            var countries = await query
                .OrderBy(c => c.Region.Name)
                .ThenBy(c => c.Name)
                .Select(c => new
                {
                    id = c.Id,
                    code = c.Code,
                    name = c.Name,
                    nativeName = c.NativeName,
                    continent = c.Continent,
                    phonePrefix = c.PhonePrefix,
                    region = new
                    {
                        id = c.Region.Id,
                        code = c.Region.Code,
                        name = c.Region.Name
                    },
                    defaultLocale = c.DefaultLocale != null ? new
                    {
                        id = c.DefaultLocale.Id,
                        code = c.DefaultLocale.Code,
                        name = c.DefaultLocale.Name
                    } : null,
                    supportsShipping = c.SupportsShipping,
                    supportsBilling = c.SupportsBilling,
                    compliance = includeCompliance && c.ComplianceProfile != null ? new
                    {
                        riskLevel = c.ComplianceProfile.ComplianceRiskLevel.ToString(),
                        hasTradeSanctions = c.ComplianceProfile.HasTradeSanctions,
                        hasExportRestrictions = c.ComplianceProfile.HasExportRestrictions,
                        requiresScreening = c.ComplianceProfile.RequiresDeniedPartyScreening,
                        regulatoryNotes = c.ComplianceProfile.RegulatoryNotes
                    } : null,
                    isActive = c.IsActive,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} countries", countries.Count);
            return Ok(countries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting countries");
            return StatusCode(500, new { error = "Failed to retrieve countries", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific country by ID with its locales
    /// </summary>
    /// <param name="id">Country ID</param>
    /// <returns>Country details with locales</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetCountry(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting country {CountryId}", id);

            var country = await _context.Countries
                .Include(c => c.Region)
                .Include(c => c.Locales.Where(l => l.IsActive))
                    .ThenInclude(l => l.Currency)
                .Include(c => c.DefaultLocale)
                .Include(c => c.ComplianceProfile)
                .Where(c => c.Id == id && c.IsActive)
                .Select(c => new
                {
                    id = c.Id,
                    code = c.Code,
                    name = c.Name,
                    nativeName = c.NativeName,
                    continent = c.Continent,
                    phonePrefix = c.PhonePrefix,
                    region = new
                    {
                        id = c.Region.Id,
                        code = c.Region.Code,
                        name = c.Region.Name
                    },
                    defaultLocale = c.DefaultLocale != null ? new
                    {
                        id = c.DefaultLocale.Id,
                        code = c.DefaultLocale.Code,
                        name = c.DefaultLocale.Name
                    } : null,
                    locales = c.Locales.Select(l => new
                    {
                        id = l.Id,
                        code = l.Code,
                        name = l.Name,
                        nativeName = l.NativeName,
                        priorityInCountry = l.PriorityInCountry,
                        isDefault = c.DefaultLocaleId == l.Id,
                        currency = new
                        {
                            id = l.Currency.Id,
                            code = l.Currency.Code,
                            symbol = l.Currency.Symbol
                        },
                        isRtl = l.IsRtl
                    }).OrderBy(l => l.priorityInCountry).ToList(),
                    compliance = c.ComplianceProfile != null ? new
                    {
                        riskLevel = c.ComplianceProfile.ComplianceRiskLevel.ToString(),
                        hasTradeSanctions = c.ComplianceProfile.HasTradeSanctions,
                        hasExportRestrictions = c.ComplianceProfile.HasExportRestrictions,
                        requiresScreening = c.ComplianceProfile.RequiresDeniedPartyScreening,
                        screeningThreshold = c.ComplianceProfile.ScreeningThresholdAmount,
                        restrictedCategories = c.ComplianceProfile.RestrictedCategories,
                        regulatoryNotes = c.ComplianceProfile.RegulatoryNotes,
                        specialRequirements = c.ComplianceProfile.SpecialRequirements
                    } : null,
                    supportsShipping = c.SupportsShipping,
                    supportsBilling = c.SupportsBilling,
                    isActive = c.IsActive,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (country == null)
            {
                _logger.LogWarning("Country {CountryId} not found", id);
                return NotFound(new { error = "Country not found", countryId = id });
            }

            return Ok(country);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting country {CountryId}", id);
            return StatusCode(500, new { error = "Failed to retrieve country", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a country by its ISO code
    /// </summary>
    /// <param name="code">ISO 3166-1 alpha-2 country code (US, CA, FR, etc.)</param>
    /// <returns>Country details</returns>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetCountryByCode(string code)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(code) || code.Length != 2)
            {
                return BadRequest(new { error = "Invalid country code. Must be 2-character ISO code." });
            }

            var country = await _context.Countries
                .Include(c => c.Region)
                .Include(c => c.DefaultLocale)
                .Where(c => c.Code.ToUpper() == code.ToUpper() && c.IsActive)
                .FirstOrDefaultAsync();

            if (country == null)
            {
                return NotFound(new { error = "Country not found", code });
            }

            var countryId = country.Id;
            return await GetCountry(countryId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting country by code {Code}", code);
            return StatusCode(500, new { error = "Failed to retrieve country", message = ex.Message });
        }
    }

    /// <summary>
    /// Detects country from IP address
    /// </summary>
    /// <param name="ipAddress">IP address to lookup (optional - uses client IP if not provided)</param>
    /// <returns>Detected country information</returns>
    [HttpGet("detect-from-ip")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<ActionResult<object>> DetectCountryFromIp(string? ipAddress = null)
    {
        try
        {
            // Use provided IP or detect from request
            var targetIp = ipAddress ?? GetClientIpAddress();
            
            _logger.LogInformation("Detecting country for IP: {IpAddress}", targetIp);

            // For demo purposes, we'll use a simple mapping
            // In production, this would query the ip_country_ranges table
            var detectedCountryCode = DetectCountryFromIpSimple(targetIp);

            var country = await _context.Countries
                .Include(c => c.Region)
                .Include(c => c.DefaultLocale)
                .Include(c => c.ComplianceProfile)
                .Where(c => c.Code == detectedCountryCode && c.IsActive)
                .Select(c => new
                {
                    detectedIp = targetIp,
                    country = new
                    {
                        id = c.Id,
                        code = c.Code,
                        name = c.Name,
                        nativeName = c.NativeName,
                        region = new
                        {
                            id = c.Region.Id,
                            code = c.Region.Code,
                            name = c.Region.Name
                        },
                        defaultLocale = c.DefaultLocale != null ? new
                        {
                            id = c.DefaultLocale.Id,
                            code = c.DefaultLocale.Code,
                            name = c.DefaultLocale.Name
                        } : null,
                        compliance = c.ComplianceProfile != null ? new
                        {
                            riskLevel = c.ComplianceProfile.ComplianceRiskLevel.ToString(),
                            requiresScreening = c.ComplianceProfile.RequiresDeniedPartyScreening
                        } : null
                    },
                    detectionMethod = "GeoIP",
                    confidence = "High"
                })
                .FirstOrDefaultAsync();

            if (country == null)
            {
                // Default to US if country not found
                return await DetectCountryFromIp("8.8.8.8"); // Google DNS = US
            }

            return Ok(country);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting country from IP {IpAddress}", ipAddress);
            return StatusCode(500, new { error = "Failed to detect country", message = ex.Message });
        }
    }

    /// <summary>
    /// Sets up user locale preferences with compliance checking
    /// </summary>
    /// <param name="request">User preference setup request</param>
    /// <returns>User preferences with compliance status</returns>
    [HttpPost("setup-preferences")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<ActionResult<object>> SetupUserPreferences([FromBody] UserPreferenceSetupRequest request)
    {
        try
        {
            _logger.LogInformation("Setting up preferences for user {UserId}", request.UserId);

            // Detect country from IP if not provided
            var detectedCountry = "US"; // Default
            if (!string.IsNullOrEmpty(request.IpAddress))
            {
                detectedCountry = DetectCountryFromIpSimple(request.IpAddress);
            }

            // Get or create user preferences
            var preference = await _context.UserLocalePreferences
                .Include(p => p.DetectedCountry)
                .Include(p => p.ChosenLocale)
                .Where(p => p.UserId == request.UserId && p.IsActive)
                .FirstOrDefaultAsync();

            if (preference == null)
            {
                preference = new UserLocalePreference
                {
                    UserId = request.UserId,
                    SessionId = request.SessionId,
                    DetectedIpAddress = request.IpAddress,
                    UserAgent = request.UserAgent,
                    Referrer = request.Referrer
                };
                _context.UserLocalePreferences.Add(preference);
            }

            // Set detected country
            var country = await _context.Countries
                .Include(c => c.DefaultLocale)
                .Include(c => c.ComplianceProfile)
                .Where(c => c.Code == detectedCountry && c.IsActive)
                .FirstOrDefaultAsync();

            if (country != null)
            {
                preference.DetectedCountryId = country.Id;
                
                // Set default locale if not already chosen
                if (preference.ChosenLocaleId == null && country.DefaultLocaleId.HasValue)
                {
                    preference.ChosenLocaleId = country.DefaultLocaleId;
                    preference.ChosenCountryId = country.Id;
                }

                // Check compliance requirements
                if (country.ComplianceProfile != null)
                {
                    preference.ComplianceScreeningRequired = 
                        country.ComplianceProfile.RequiresDeniedPartyScreening ||
                        country.ComplianceProfile.ComplianceRiskLevel == ComplianceRiskLevel.High;
                }
            }

            preference.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var result = new
            {
                userId = preference.UserId,
                sessionId = preference.SessionId,
                detectedCountry = country != null ? new
                {
                    code = country.Code,
                    name = country.Name,
                    nativeName = country.NativeName
                } : null,
                defaultLocale = country?.DefaultLocale != null ? new
                {
                    code = country.DefaultLocale.Code,
                    name = country.DefaultLocale.Name
                } : null,
                complianceRequired = preference.ComplianceScreeningRequired,
                complianceStatus = preference.ComplianceStatus,
                riskLevel = country?.ComplianceProfile?.ComplianceRiskLevel.ToString() ?? "Medium"
            };

            _logger.LogInformation("User preferences set up successfully for {UserId}", request.UserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up user preferences for {UserId}", request.UserId);
            return StatusCode(500, new { error = "Failed to setup user preferences", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets countries grouped by region for hierarchy display
    /// </summary>
    /// <returns>Hierarchical country data grouped by region</returns>
    [HttpGet("hierarchy")]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetCountryHierarchy()
    {
        try
        {
            _logger.LogInformation("Getting country hierarchy");

            var hierarchy = await _context.Regions
                .Include(r => r.Countries.Where(c => c.IsActive))
                    .ThenInclude(c => c.Locales.Where(l => l.IsActive))
                .Include(r => r.Countries)
                    .ThenInclude(c => c.ComplianceProfile)
                .Where(r => r.IsActive)
                .OrderBy(r => r.Code)
                .Select(r => new
                {
                    region = new
                    {
                        id = r.Id,
                        code = r.Code,
                        name = r.Name,
                        description = r.Description
                    },
                    countries = r.Countries.Select(c => new
                    {
                        id = c.Id,
                        code = c.Code,
                        name = c.Name,
                        nativeName = c.NativeName,
                        continent = c.Continent,
                        localeCount = c.Locales.Count,
                        hasMultipleLocales = c.Locales.Count > 1,
                        complianceRiskLevel = c.ComplianceProfile != null ? 
                            c.ComplianceProfile.ComplianceRiskLevel.ToString() : "Medium",
                        supportsShipping = c.SupportsShipping,
                        supportsBilling = c.SupportsBilling
                    }).OrderBy(c => c.name).ToList()
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved hierarchy for {RegionCount} regions", hierarchy.Count);
            return Ok(hierarchy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting country hierarchy");
            return StatusCode(500, new { error = "Failed to retrieve country hierarchy", message = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to get client IP address from request
    /// </summary>
    private string GetClientIpAddress()
    {
        // Check for forwarded IP first (reverse proxy/load balancer)
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        // Check for real IP header
        var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        // Fall back to connection remote IP
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    /// <summary>
    /// Simple IP to country mapping (demo implementation)
    /// In production, this would query the ip_country_ranges table
    /// </summary>
    private static string DetectCountryFromIpSimple(string ipAddress)
    {
        // Simple mock detection based on IP patterns
        // In production, use MaxMind GeoIP2 or similar service
        
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "127.0.0.1" || ipAddress == "::1")
            return "US"; // localhost defaults to US

        // Mock some IP ranges for demo
        if (ipAddress.StartsWith("192.168.") || ipAddress.StartsWith("10.") || ipAddress.StartsWith("172."))
            return "US"; // Private networks default to US

        // Some simple patterns for demo
        var hash = ipAddress.GetHashCode();
        var countryIndex = Math.Abs(hash) % 10;

        return countryIndex switch
        {
            0 => "US",
            1 => "CA", 
            2 => "GB",
            3 => "FR",
            4 => "DE",
            5 => "JP",
            6 => "AU",
            7 => "BR",
            8 => "CN",
            _ => "US"
        };
    }
}

/// <summary>
/// Request DTO for setting up user locale preferences
/// </summary>
public class UserPreferenceSetupRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public string? PreferredCountryCode { get; set; }
    public string? PreferredLocaleCode { get; set; }
}