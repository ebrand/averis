using Microsoft.AspNetCore.Mvc;
using Commerce.Services.PricingMdm.Api.Services;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API controller for export compliance screening and risk assessment
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ComplianceController : ControllerBase
{
    private readonly IComplianceScreeningService _complianceService;
    private readonly ILogger<ComplianceController> _logger;

    public ComplianceController(
        IComplianceScreeningService complianceService,
        ILogger<ComplianceController> logger)
    {
        _complianceService = complianceService;
        _logger = logger;
    }

    /// <summary>
    /// Screen a country for export compliance issues
    /// </summary>
    /// <param name="countryCode">ISO country code (e.g., US, GB, DE)</param>
    /// <param name="countryName">Country name for additional screening</param>
    /// <returns>Compliance screening result with risk assessment</returns>
    [HttpGet("screen/country/{countryCode}")]
    public async Task<ActionResult<ComplianceScreeningResult>> ScreenCountry(
        string countryCode, 
        [FromQuery] string? countryName = null)
    {
        try
        {
            if (string.IsNullOrEmpty(countryCode))
            {
                return BadRequest("Country code is required");
            }

            // Use country code as name if not provided
            countryName ??= countryCode;

            var result = await _complianceService.ScreenCountryAsync(countryCode.ToUpper(), countryName);
            
            _logger.LogInformation("Country screening completed for {CountryCode}: {RiskLevel} risk, {MatchCount} matches", 
                countryCode, result.RiskLevel, result.TotalMatches);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error screening country {CountryCode}", countryCode);
            return StatusCode(500, new { error = "Internal server error during screening", message = ex.Message });
        }
    }

    /// <summary>
    /// Screen an entity (company, person, vessel) for compliance issues
    /// </summary>
    /// <param name="request">Entity screening request</param>
    /// <returns>Compliance screening result</returns>
    [HttpPost("screen/entity")]
    public async Task<ActionResult<ComplianceScreeningResult>> ScreenEntity([FromBody] EntityScreeningRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.EntityName))
            {
                return BadRequest("Entity name is required");
            }

            var result = await _complianceService.ScreenEntityAsync(request.EntityName, request.CountryCode);
            
            _logger.LogInformation("Entity screening completed for '{EntityName}': {RiskLevel} risk, {MatchCount} matches", 
                request.EntityName, result.RiskLevel, result.TotalMatches);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error screening entity '{EntityName}'", request.EntityName);
            return StatusCode(500, new { error = "Internal server error during screening", message = ex.Message });
        }
    }

    /// <summary>
    /// Get active compliance alerts
    /// </summary>
    /// <returns>List of active compliance alerts</returns>
    [HttpGet("alerts")]
    public async Task<ActionResult<List<ComplianceAlert>>> GetActiveAlerts()
    {
        try
        {
            var alerts = await _complianceService.GetActiveAlertsAsync();
            
            _logger.LogInformation("Retrieved {AlertCount} active compliance alerts", alerts.Count);
            
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving compliance alerts");
            return StatusCode(500, new { error = "Internal server error retrieving alerts", message = ex.Message });
        }
    }

    /// <summary>
    /// Assess compliance risk for a region
    /// </summary>
    /// <param name="regionCode">Region code (AMER, EMEA, APJ)</param>
    /// <returns>Regional risk assessment</returns>
    [HttpGet("assess/region/{regionCode}")]
    public async Task<ActionResult<ComplianceRiskAssessment>> AssessRegionRisk(string regionCode)
    {
        try
        {
            if (string.IsNullOrEmpty(regionCode))
            {
                return BadRequest("Region code is required");
            }

            var validRegions = new[] { "AMER", "LATAM", "EMEA", "APAC" };
            if (!validRegions.Contains(regionCode.ToUpper()))
            {
                return BadRequest($"Invalid region code. Valid codes are: {string.Join(", ", validRegions)}");
            }

            var assessment = await _complianceService.AssessRegionRiskAsync(regionCode.ToUpper());
            
            _logger.LogInformation("Region risk assessment completed for {RegionCode}: {OverallRisk} risk", 
                regionCode, assessment.OverallRisk);

            return Ok(assessment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assessing region risk for {RegionCode}", regionCode);
            return StatusCode(500, new { error = "Internal server error during assessment", message = ex.Message });
        }
    }

    /// <summary>
    /// Bulk screen multiple countries for compliance
    /// </summary>
    /// <param name="request">Bulk screening request</param>
    /// <returns>Results for all screened countries</returns>
    [HttpPost("screen/bulk")]
    public async Task<ActionResult<BulkScreeningResult>> BulkScreenCountries([FromBody] BulkScreeningRequest request)
    {
        try
        {
            if (request.Countries == null || !request.Countries.Any())
            {
                return BadRequest("At least one country is required");
            }

            if (request.Countries.Count > 20)
            {
                return BadRequest("Maximum 20 countries allowed per bulk request");
            }

            var results = new List<ComplianceScreeningResult>();
            var errors = new List<string>();

            foreach (var country in request.Countries)
            {
                try
                {
                    var result = await _complianceService.ScreenCountryAsync(country.Code, country.Name);
                    results.Add(result);
                    
                    // Add small delay to respect rate limits
                    await Task.Delay(100);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error screening {country.Code}: {ex.Message}");
                    _logger.LogWarning(ex, "Error in bulk screening for country {CountryCode}", country.Code);
                }
            }

            var bulkResult = new BulkScreeningResult
            {
                TotalRequested = request.Countries.Count,
                SuccessfulScreenings = results.Count,
                FailedScreenings = errors.Count,
                Results = results,
                Errors = errors,
                ScreenedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Bulk screening completed: {Successful}/{Total} successful", 
                results.Count, request.Countries.Count);

            return Ok(bulkResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk screening");
            return StatusCode(500, new { error = "Internal server error during bulk screening", message = ex.Message });
        }
    }

    /// <summary>
    /// Get compliance statistics and metrics
    /// </summary>
    /// <returns>Compliance screening statistics</returns>
    [HttpGet("stats")]
    public async Task<ActionResult<ComplianceStats>> GetComplianceStats()
    {
        try
        {
            // This would typically query a database for historical screening data
            // For now, return sample stats
            var stats = new ComplianceStats
            {
                TotalScreeningsToday = 45,
                HighRiskDetections = 3,
                SanctionsDetected = 1,
                ExportRestrictionsDetected = 7,
                LastUpdated = DateTime.UtcNow,
                ApiStatus = "Operational",
                DataFreshness = "Last updated hourly"
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving compliance statistics");
            return StatusCode(500, new { error = "Internal server error retrieving stats", message = ex.Message });
        }
    }
}

#region Request/Response Models

public class EntityScreeningRequest
{
    public string EntityName { get; set; } = string.Empty;
    public string? CountryCode { get; set; }
}

public class BulkScreeningRequest
{
    public List<CountryScreeningItem> Countries { get; set; } = new();
}

public class CountryScreeningItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class BulkScreeningResult
{
    public int TotalRequested { get; set; }
    public int SuccessfulScreenings { get; set; }
    public int FailedScreenings { get; set; }
    public List<ComplianceScreeningResult> Results { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public DateTime ScreenedAt { get; set; }
}

public class ComplianceStats
{
    public int TotalScreeningsToday { get; set; }
    public int HighRiskDetections { get; set; }
    public int SanctionsDetected { get; set; }
    public int ExportRestrictionsDetected { get; set; }
    public DateTime LastUpdated { get; set; }
    public string ApiStatus { get; set; } = string.Empty;
    public string DataFreshness { get; set; } = string.Empty;
}

#endregion