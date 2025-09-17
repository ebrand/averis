using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;
using Commerce.Services.PricingMdm.Api.Services;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Hierarchical Tree Management
/// Provides comprehensive Region→Country→Locale hierarchy operations
/// </summary>
[ApiController]
[Route("api/tree")]
[Produces("application/json")]
public class TreeManagementController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<TreeManagementController> _logger;
    private readonly IComplianceScreeningService _complianceService;

    public TreeManagementController(
        PricingDbContext context, 
        ILogger<TreeManagementController> logger,
        IComplianceScreeningService complianceService)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _complianceService = complianceService ?? throw new ArgumentNullException(nameof(complianceService));
    }

    /// <summary>
    /// Gets the complete hierarchical tree structure
    /// </summary>
    /// <param name="includeCompliance">Include compliance information</param>
    /// <param name="includeInactive">Include inactive nodes</param>
    /// <returns>Complete tree hierarchy</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<TreeNodeDto>), 200)]
    public async Task<ActionResult<List<TreeNodeDto>>> GetTreeHierarchy(
        bool includeCompliance = true, 
        bool includeInactive = false)
    {
        try
        {
            _logger.LogInformation("Getting complete tree hierarchy - Compliance: {IncludeCompliance}, Inactive: {IncludeInactive}", 
                includeCompliance, includeInactive);

            var regions = await _context.Regions
                .Include(r => r.Countries.Where(c => includeInactive || c.IsActive))
                    .ThenInclude(c => c.Locales.Where(l => includeInactive || l.IsActive))
                        .ThenInclude(l => l.Currency)
                .Include(r => r.Countries)
                    .ThenInclude(c => c.DefaultLocale)
                .Include(r => r.Countries)
                    .ThenInclude(c => c.ComplianceProfile)
                .Where(r => includeInactive || r.IsActive)
                .OrderBy(r => r.Code)
                .ToListAsync();

            var treeNodes = new List<TreeNodeDto>();

            foreach (var region in regions)
            {
                var regionNode = new TreeNodeDto
                {
                    Id = $"region_{region.Id}",
                    Name = $"{region.Name} ({region.Code})",
                    Type = "region",
                    Icon = GetRegionIcon(region.Code),
                    IsExpanded = true,
                    Metadata = new TreeNodeMetadata
                    {
                        EntityId = region.Id,
                        Code = region.Code,
                        Description = region.Description,
                        Status = region.IsActive ? "Active" : "Inactive",
                        ItemCount = region.Countries.Count(c => includeInactive || c.IsActive)
                    },
                    Children = new List<TreeNodeDto>()
                };

                // Add country children
                foreach (var country in region.Countries.Where(c => includeInactive || c.IsActive).OrderBy(c => c.Name))
                {
                    var countryNode = new TreeNodeDto
                    {
                        Id = $"country_{country.Id}",
                        Name = $"{country.Name} {GetCountryFlag(country.Code)}",
                        Type = "country",
                        Icon = GetCountryFlag(country.Code),
                        IsExpanded = false,
                        Metadata = new TreeNodeMetadata
                        {
                            EntityId = country.Id,
                            Code = country.Code,
                            NativeName = country.NativeName,
                            Status = country.IsActive ? "Active" : "Inactive",
                            ItemCount = country.Locales.Count(l => includeInactive || l.IsActive),
                            HasMultipleLocales = country.Locales.Count(l => includeInactive || l.IsActive) > 1,
                            Continent = country.Continent,
                            PhonePrefix = country.PhonePrefix,
                            SupportsShipping = country.SupportsShipping,
                            SupportsBilling = country.SupportsBilling
                        },
                        Children = new List<TreeNodeDto>()
                    };

                    // Add compliance information if requested
                    if (includeCompliance && country.ComplianceProfile != null)
                    {
                        countryNode.Metadata.ComplianceRisk = country.ComplianceProfile.ComplianceRiskLevel.ToString();
                        countryNode.Metadata.HasSanctions = country.ComplianceProfile.HasTradeSanctions;
                        countryNode.Metadata.HasExportRestrictions = country.ComplianceProfile.HasExportRestrictions;
                        countryNode.Metadata.RegulatoryNotes = country.ComplianceProfile.RegulatoryNotes;
                    }

                    // Add locale children
                    foreach (var locale in country.Locales.Where(l => includeInactive || l.IsActive).OrderBy(l => l.PriorityInCountry))
                    {
                        var localeNode = new TreeNodeDto
                        {
                            Id = $"locale_{locale.Id}",
                            Name = locale.Name, // Keep the name clean - no stars or UI indicators
                            Type = "locale",
                            Icon = GetCountryFlag(locale.CountryCode),
                            IsExpanded = false,
                            CanHaveChildren = false,
                            Metadata = new TreeNodeMetadata
                            {
                                EntityId = locale.Id,
                                Code = locale.Code,
                                NativeName = locale.NativeName,
                                Status = locale.IsActive ? "Active" : "Inactive",
                                Currency = locale.Currency?.Code,
                                CurrencySymbol = locale.Currency?.Symbol,
                                IsRtl = locale.IsRtl,
                                IsPrimary = country.DefaultLocaleId == locale.Id,
                                Priority = locale.PriorityInCountry,
                                DateFormat = locale.DateFormat,
                                NumberFormat = locale.NumberFormat,
                                CountryId = locale.CountryId,
                                CountryCode = locale.CountryCode,
                                LanguageCode = locale.LanguageCode
                            }
                        };

                        countryNode.Children.Add(localeNode);
                    }

                    regionNode.Children.Add(countryNode);
                }

                treeNodes.Add(regionNode);
            }

            _logger.LogInformation("Retrieved tree hierarchy with {RegionCount} regions", treeNodes.Count);
            return Ok(treeNodes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tree hierarchy");
            return StatusCode(500, new { error = "Failed to retrieve tree hierarchy", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets detailed information about a specific tree node
    /// </summary>
    /// <param name="nodeId">Node ID (format: type_guid)</param>
    /// <returns>Detailed node information</returns>
    [HttpGet("node/{nodeId}")]
    [ProducesResponseType(typeof(TreeNodeDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TreeNodeDetailDto>> GetNodeDetails(string nodeId)
    {
        try
        {
            _logger.LogInformation("Getting node details for {NodeId}", nodeId);

            var parts = nodeId.Split('_', 2);
            if (parts.Length != 2 || !Guid.TryParse(parts[1], out var entityId))
            {
                return BadRequest(new { error = "Invalid node ID format. Expected format: type_guid" });
            }

            var nodeType = parts[0];
            TreeNodeDetailDto? nodeDetail = null;

            switch (nodeType.ToLower())
            {
                case "region":
                    nodeDetail = await GetRegionNodeDetail(entityId);
                    break;
                case "country":
                    nodeDetail = await GetCountryNodeDetail(entityId);
                    break;
                case "locale":
                    nodeDetail = await GetLocaleNodeDetail(entityId);
                    break;
                default:
                    return BadRequest(new { error = $"Unknown node type: {nodeType}" });
            }

            if (nodeDetail == null)
            {
                return NotFound(new { error = "Node not found", nodeId });
            }

            return Ok(nodeDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting node details for {NodeId}", nodeId);
            return StatusCode(500, new { error = "Failed to retrieve node details", message = ex.Message });
        }
    }

    /// <summary>
    /// Performs bulk operations on tree nodes
    /// </summary>
    /// <param name="request">Bulk operation request</param>
    /// <returns>Operation results</returns>
    [HttpPost("bulk-operations")]
    [ProducesResponseType(typeof(BulkOperationResult), 200)]
    public async Task<ActionResult<BulkOperationResult>> PerformBulkOperations([FromBody] BulkOperationRequest request)
    {
        try
        {
            _logger.LogInformation("Performing bulk operation {Operation} on {NodeCount} nodes", 
                request.Operation, request.NodeIds?.Count ?? 0);

            if (request.NodeIds == null || !request.NodeIds.Any())
            {
                return BadRequest(new { error = "NodeIds are required for bulk operations" });
            }

            var result = new BulkOperationResult
            {
                Operation = request.Operation,
                TotalNodes = request.NodeIds.Count,
                SuccessfulNodes = new List<string>(),
                FailedNodes = new List<BulkOperationError>()
            };

            switch (request.Operation.ToLower())
            {
                case "activate":
                case "deactivate":
                    result = await PerformBulkActivationOperation(request.NodeIds, request.Operation.ToLower() == "activate");
                    break;
                case "delete":
                    result = await PerformBulkDeleteOperation(request.NodeIds);
                    break;
                case "export":
                    result = await PerformBulkExportOperation(request.NodeIds);
                    break;
                default:
                    return BadRequest(new { error = $"Unsupported bulk operation: {request.Operation}" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing bulk operations");
            return StatusCode(500, new { error = "Failed to perform bulk operations", message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new tree node
    /// </summary>
    /// <param name="request">Node creation request</param>
    /// <returns>Created node details</returns>
    [HttpPost("create-node")]
    [ProducesResponseType(typeof(TreeNodeDetailDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<TreeNodeDetailDto>> CreateNode([FromBody] CreateNodeRequest request)
    {
        try
        {
            _logger.LogInformation("Creating new {NodeType} node", request.NodeType);

            TreeNodeDetailDto? createdNode = null;

            switch (request.NodeType.ToLower())
            {
                case "region":
                    createdNode = await CreateRegionNode(request);
                    break;
                case "country":
                    createdNode = await CreateCountryNode(request);
                    break;
                case "locale":
                    createdNode = await CreateLocaleNode(request);
                    break;
                default:
                    return BadRequest(new { error = $"Unsupported node type: {request.NodeType}" });
            }

            if (createdNode == null)
            {
                return StatusCode(500, new { error = "Failed to create node" });
            }

            return CreatedAtAction(nameof(GetNodeDetails), new { nodeId = createdNode.Id }, createdNode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating {NodeType} node", request.NodeType);
            return StatusCode(500, new { error = "Failed to create node", message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing tree node
    /// </summary>
    /// <param name="nodeId">Node ID to update</param>
    /// <param name="request">Update request</param>
    /// <returns>Updated node details</returns>
    [HttpPut("node/{nodeId}")]
    [ProducesResponseType(typeof(TreeNodeDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TreeNodeDetailDto>> UpdateNode(string nodeId, [FromBody] UpdateNodeRequest request)
    {
        try
        {
            _logger.LogInformation("Updating node {NodeId}", nodeId);

            var parts = nodeId.Split('_', 2);
            if (parts.Length != 2 || !Guid.TryParse(parts[1], out var entityId))
            {
                return BadRequest(new { error = "Invalid node ID format" });
            }

            var nodeType = parts[0];
            TreeNodeDetailDto? updatedNode = null;

            switch (nodeType.ToLower())
            {
                case "region":
                    updatedNode = await UpdateRegionNode(entityId, request);
                    break;
                case "country":
                    updatedNode = await UpdateCountryNode(entityId, request);
                    break;
                case "locale":
                    updatedNode = await UpdateLocaleNode(entityId, request);
                    break;
                default:
                    return BadRequest(new { error = $"Unknown node type: {nodeType}" });
            }

            if (updatedNode == null)
            {
                return NotFound(new { error = "Node not found", nodeId });
            }

            return Ok(updatedNode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating node {NodeId}", nodeId);
            return StatusCode(500, new { error = "Failed to update node", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets IP-based country detection with locale recommendations
    /// </summary>
    /// <param name="ipAddress">IP address (optional - uses client IP if not provided)</param>
    /// <returns>Detected country and recommended locales</returns>
    [HttpGet("detect-from-ip")]
    [ProducesResponseType(typeof(IpDetectionResult), 200)]
    public async Task<ActionResult<IpDetectionResult>> DetectFromIp(string? ipAddress = null)
    {
        try
        {
            var targetIp = ipAddress ?? GetClientIpAddress();
            _logger.LogInformation("Detecting country and locale from IP: {IpAddress}", targetIp);

            // Simple detection for demo (in production, use MaxMind or similar)
            var detectedCountryCode = DetectCountryFromIpSimple(targetIp);

            var country = await _context.Countries
                .Include(c => c.Region)
                .Include(c => c.Locales.Where(l => l.IsActive))
                    .ThenInclude(l => l.Currency)
                .Include(c => c.DefaultLocale)
                .Include(c => c.ComplianceProfile)
                .Where(c => c.Code == detectedCountryCode && c.IsActive)
                .FirstOrDefaultAsync();

            if (country == null)
            {
                return Ok(new IpDetectionResult
                {
                    IpAddress = targetIp,
                    DetectionSuccessful = false,
                    Message = "Country not found or not supported"
                });
            }

            var result = new IpDetectionResult
            {
                IpAddress = targetIp,
                DetectionSuccessful = true,
                DetectedCountry = new CountryInfo
                {
                    Id = country.Id,
                    Code = country.Code,
                    Name = country.Name,
                    NativeName = country.NativeName,
                    Flag = GetCountryFlag(country.Code),
                    Region = new RegionInfo
                    {
                        Id = country.Region.Id,
                        Code = country.Region.Code,
                        Name = country.Region.Name
                    },
                    ComplianceRisk = country.ComplianceProfile?.ComplianceRiskLevel.ToString() ?? "Medium",
                    SupportsShipping = country.SupportsShipping,
                    SupportsBilling = country.SupportsBilling
                },
                RecommendedLocale = country.DefaultLocale != null ? new LocaleInfo
                {
                    Id = country.DefaultLocale.Id,
                    Code = country.DefaultLocale.Code,
                    Name = country.DefaultLocale.Name,
                    NativeName = country.DefaultLocale.NativeName,
                    Currency = country.DefaultLocale.Currency?.Code ?? "",
                    CurrencySymbol = country.DefaultLocale.Currency?.Symbol ?? "",
                    IsRtl = country.DefaultLocale.IsRtl
                } : null,
                AvailableLocales = country.Locales.OrderBy(l => l.PriorityInCountry).Select(l => new LocaleInfo
                {
                    Id = l.Id,
                    Code = l.Code,
                    Name = l.Name,
                    NativeName = l.NativeName,
                    Currency = l.Currency?.Code ?? "",
                    CurrencySymbol = l.Currency?.Symbol ?? "",
                    IsRtl = l.IsRtl,
                    IsPrimary = country.DefaultLocaleId == l.Id,
                    Priority = l.PriorityInCountry
                }).ToList(),
                ComplianceRequired = country.ComplianceProfile?.RequiresDeniedPartyScreening ?? false,
                DetectionMethod = "GeoIP",
                Confidence = "High"
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting from IP {IpAddress}", ipAddress);
            return StatusCode(500, new { error = "Failed to detect country from IP", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets available currencies for locale creation
    /// </summary>
    /// <returns>List of active currencies</returns>
    [HttpGet("currencies")]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetCurrencies()
    {
        try
        {
            _logger.LogInformation("Getting available currencies");

            var currencies = await _context.Currencies
                .AsNoTracking() // Don't track for better performance
                .Where(c => c.IsActive)
                .OrderBy(c => c.Code)
                .Select(c => new
                {
                    id = c.Id,
                    code = c.Code,
                    symbol = c.Symbol,
                    name = c.Name,
                    decimalPlaces = c.DecimalPlaces
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved {CurrencyCount} active currencies", currencies.Count);
            return Ok(currencies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting currencies");
            return StatusCode(500, new { error = "Failed to retrieve currencies", message = ex.Message });
        }
    }

    /// <summary>
    /// Sets up user session with detected preferences and compliance checking
    /// </summary>
    /// <param name="request">Session setup request</param>
    /// <returns>User session details with compliance status</returns>
    [HttpPost("setup-session")]
    [ProducesResponseType(typeof(SessionSetupResult), 200)]
    public async Task<ActionResult<SessionSetupResult>> SetupUserSession([FromBody] SessionSetupRequest request)
    {
        try
        {
            _logger.LogInformation("Setting up session for user {UserId}", request.UserId ?? "anonymous");

            var detectionResult = await DetectFromIp(request.IpAddress);
            if (detectionResult.Result is not OkObjectResult okResult || okResult.Value is not IpDetectionResult detection)
            {
                return StatusCode(500, new { error = "Failed to detect country for session setup" });
            }

            // Create or update user preferences
            var preference = await _context.UserLocalePreferences
                .Where(p => 
                    (request.UserId != null && p.UserId == request.UserId) ||
                    (request.SessionId != null && p.SessionId == request.SessionId))
                .FirstOrDefaultAsync();

            if (preference == null)
            {
                preference = new UserLocalePreference
                {
                    UserId = request.UserId ?? request.SessionId ?? Guid.NewGuid().ToString(),
                    SessionId = request.SessionId
                };
                _context.UserLocalePreferences.Add(preference);
            }

            // Update preferences with detection results
            preference.DetectedCountryId = detection.DetectedCountry?.Id;
            preference.DetectedIpAddress = detection.IpAddress;
            preference.UserAgent = request.UserAgent;
            preference.Referrer = request.Referrer;

            // Set defaults if not already chosen
            if (preference.ChosenCountryId == null && detection.DetectedCountry != null)
            {
                preference.ChosenCountryId = detection.DetectedCountry.Id;
            }

            if (preference.ChosenLocaleId == null && detection.RecommendedLocale != null)
            {
                preference.ChosenLocaleId = detection.RecommendedLocale.Id;
            }

            preference.ComplianceScreeningRequired = detection.ComplianceRequired;
            preference.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = new SessionSetupResult
            {
                SessionId = preference.SessionId ?? preference.UserId,
                UserId = preference.UserId,
                DetectedCountry = detection.DetectedCountry,
                SelectedLocale = detection.RecommendedLocale,
                AvailableLocales = detection.AvailableLocales,
                ComplianceRequired = detection.ComplianceRequired,
                SessionEstablished = true,
                Message = "Session established successfully"
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up user session");
            return StatusCode(500, new { error = "Failed to setup user session", message = ex.Message });
        }
    }

    #region Private Helper Methods

    private async Task<TreeNodeDetailDto?> GetRegionNodeDetail(Guid regionId)
    {
        var region = await _context.Regions
            .Include(r => r.Countries)
            .Where(r => r.Id == regionId)
            .FirstOrDefaultAsync();

        if (region == null) return null;

        return new TreeNodeDetailDto
        {
            Id = $"region_{region.Id}",
            Type = "region",
            Name = region.Name,
            Code = region.Code,
            Description = region.Description,
            IsActive = region.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["countryCount"] = region.Countries.Count(c => c.IsActive),
                ["totalCountries"] = region.Countries.Count
            }
        };
    }

    private async Task<TreeNodeDetailDto?> GetCountryNodeDetail(Guid countryId)
    {
        var country = await _context.Countries
            .Include(c => c.Region)
            .Include(c => c.Locales)
                .ThenInclude(l => l.Currency)
            .Include(c => c.ComplianceProfile)
            .Where(c => c.Id == countryId)
            .FirstOrDefaultAsync();

        if (country == null) return null;

        var properties = new Dictionary<string, object>
        {
            ["nativeName"] = country.NativeName,
            ["continent"] = country.Continent ?? "",
            ["phonePrefix"] = country.PhonePrefix ?? "",
            ["localeCount"] = country.Locales.Count(l => l.IsActive),
            ["hasMultipleLocales"] = country.Locales.Count(l => l.IsActive) > 1,
            ["supportsShipping"] = country.SupportsShipping,
            ["supportsBilling"] = country.SupportsBilling,
            ["regionId"] = country.RegionId,
            ["regionName"] = country.Region.Name
        };

        if (country.ComplianceProfile != null)
        {
            properties["complianceRisk"] = country.ComplianceProfile.ComplianceRiskLevel.ToString();
            properties["hasTradeSanctions"] = country.ComplianceProfile.HasTradeSanctions;
            properties["hasExportRestrictions"] = country.ComplianceProfile.HasExportRestrictions;
            properties["regulatoryNotes"] = country.ComplianceProfile.RegulatoryNotes ?? "";
        }

        return new TreeNodeDetailDto
        {
            Id = $"country_{country.Id}",
            Type = "country",
            Name = country.Name,
            Code = country.Code,
            Description = $"Country in {country.Region.Name} region",
            IsActive = country.IsActive,
            Properties = properties
        };
    }

    private async Task<TreeNodeDetailDto?> GetLocaleNodeDetail(Guid localeId)
    {
        var locale = await _context.Locales
            .Include(l => l.Country)
                .ThenInclude(c => c.Region)
            .Include(l => l.Currency)
            .Where(l => l.Id == localeId)
            .FirstOrDefaultAsync();

        if (locale == null) return null;

        return new TreeNodeDetailDto
        {
            Id = $"locale_{locale.Id}",
            Type = "locale",
            Name = locale.Name,
            Code = locale.Code,
            Description = $"Locale in {locale.Country?.Name ?? "Unknown Country"}",
            IsActive = locale.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["nativeName"] = locale.NativeName,
                ["languageCode"] = locale.LanguageCode,
                ["countryCode"] = locale.CountryCode,
                ["currency"] = locale.Currency?.Code ?? "",
                ["currencySymbol"] = locale.Currency?.Symbol ?? "",
                ["isRtl"] = locale.IsRtl,
                ["dateFormat"] = locale.DateFormat,
                ["numberFormat"] = locale.NumberFormat,
                ["priority"] = locale.PriorityInCountry,
                ["isPrimary"] = locale.Country?.DefaultLocaleId == locale.Id,
                ["countryId"] = locale.CountryId,
                ["countryName"] = locale.Country?.Name ?? ""
            }
        };
    }

    private async Task<BulkOperationResult> PerformBulkActivationOperation(List<string> nodeIds, bool activate)
    {
        var result = new BulkOperationResult
        {
            Operation = activate ? "activate" : "deactivate",
            TotalNodes = nodeIds.Count,
            SuccessfulNodes = new List<string>(),
            FailedNodes = new List<BulkOperationError>()
        };

        foreach (var nodeId in nodeIds)
        {
            try
            {
                var parts = nodeId.Split('_', 2);
                if (parts.Length != 2 || !Guid.TryParse(parts[1], out var entityId))
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = "Invalid node ID format"
                    });
                    continue;
                }

                var updated = false;
                switch (parts[0].ToLower())
                {
                    case "region":
                        var region = await _context.Regions.FindAsync(entityId);
                        if (region != null)
                        {
                            region.IsActive = activate;
                            region.UpdatedAt = DateTime.UtcNow;
                            updated = true;
                        }
                        break;
                    case "country":
                        var country = await _context.Countries.FindAsync(entityId);
                        if (country != null)
                        {
                            country.IsActive = activate;
                            country.UpdatedAt = DateTime.UtcNow;
                            updated = true;
                        }
                        break;
                    case "locale":
                        var locale = await _context.Locales.FindAsync(entityId);
                        if (locale != null)
                        {
                            locale.IsActive = activate;
                            locale.UpdatedAt = DateTime.UtcNow;
                            updated = true;
                        }
                        break;
                }

                if (updated)
                {
                    result.SuccessfulNodes.Add(nodeId);
                }
                else
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = "Node not found"
                    });
                }
            }
            catch (Exception ex)
            {
                result.FailedNodes.Add(new BulkOperationError
                {
                    NodeId = nodeId,
                    Error = ex.Message
                });
            }
        }

        if (result.SuccessfulNodes.Any())
        {
            await _context.SaveChangesAsync();
        }

        return result;
    }

    private async Task<BulkOperationResult> PerformBulkDeleteOperation(List<string> nodeIds)
    {
        var result = new BulkOperationResult
        {
            Operation = "delete",
            TotalNodes = nodeIds.Count,
            SuccessfulNodes = new List<string>(),
            FailedNodes = new List<BulkOperationError>()
        };

        foreach (var nodeId in nodeIds)
        {
            try
            {
                var parts = nodeId.Split('_', 2);
                if (parts.Length != 2 || !Guid.TryParse(parts[1], out var entityId))
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = "Invalid node ID format"
                    });
                    continue;
                }

                var nodeType = parts[0].ToLower();
                var canDelete = false;
                var deleteError = "";

                switch (nodeType)
                {
                    case "region":
                        var region = await _context.Regions.Include(r => r.Countries).FirstOrDefaultAsync(r => r.Id == entityId);
                        if (region == null)
                        {
                            deleteError = "Region not found";
                        }
                        else if (region.Countries.Any(c => c.IsActive))
                        {
                            deleteError = "Cannot delete region with active countries. Deactivate all countries first.";
                        }
                        else
                        {
                            region.IsActive = false;
                            region.UpdatedAt = DateTime.UtcNow;
                            canDelete = true;
                        }
                        break;

                    case "country":
                        var country = await _context.Countries.Include(c => c.Locales).FirstOrDefaultAsync(c => c.Id == entityId);
                        if (country == null)
                        {
                            deleteError = "Country not found";
                        }
                        else if (country.Locales.Any(l => l.IsActive))
                        {
                            deleteError = "Cannot delete country with active locales. Deactivate all locales first.";
                        }
                        else
                        {
                            country.IsActive = false;
                            country.UpdatedAt = DateTime.UtcNow;
                            canDelete = true;
                        }
                        break;

                    case "locale":
                        var locale = await _context.Locales.FindAsync(entityId);
                        if (locale == null)
                        {
                            deleteError = "Locale not found";
                        }
                        else
                        {
                            // Check if this is the default locale for its country
                            var isDefaultLocale = await _context.Countries
                                .AnyAsync(c => c.DefaultLocaleId == entityId && c.IsActive);
                            
                            if (isDefaultLocale)
                            {
                                deleteError = "Cannot delete default locale for country. Set another locale as default first.";
                            }
                            else
                            {
                                locale.IsActive = false;
                                locale.UpdatedAt = DateTime.UtcNow;
                                canDelete = true;
                            }
                        }
                        break;

                    default:
                        deleteError = $"Unknown node type: {nodeType}";
                        break;
                }

                if (canDelete)
                {
                    result.SuccessfulNodes.Add(nodeId);
                }
                else
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = deleteError
                    });
                }
            }
            catch (Exception ex)
            {
                result.FailedNodes.Add(new BulkOperationError
                {
                    NodeId = nodeId,
                    Error = ex.Message
                });
            }
        }

        if (result.SuccessfulNodes.Any())
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Soft deleted {Count} nodes", result.SuccessfulNodes.Count);
        }

        return result;
    }

    private async Task<BulkOperationResult> PerformBulkExportOperation(List<string> nodeIds)
    {
        var result = new BulkOperationResult
        {
            Operation = "export",
            TotalNodes = nodeIds.Count,
            SuccessfulNodes = new List<string>(),
            FailedNodes = new List<BulkOperationError>()
        };

        var exportData = new List<object>();

        foreach (var nodeId in nodeIds)
        {
            try
            {
                var parts = nodeId.Split('_', 2);
                if (parts.Length != 2 || !Guid.TryParse(parts[1], out var entityId))
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = "Invalid node ID format"
                    });
                    continue;
                }

                var nodeType = parts[0].ToLower();
                object? nodeData = null;

                switch (nodeType)
                {
                    case "region":
                        var region = await _context.Regions
                            .Include(r => r.Countries)
                                .ThenInclude(c => c.Locales)
                            .Where(r => r.Id == entityId)
                            .Select(r => new
                            {
                                type = "region",
                                id = r.Id,
                                code = r.Code,
                                name = r.Name,
                                description = r.Description,
                                isActive = r.IsActive,
                                countries = r.Countries.Select(c => new
                                {
                                    id = c.Id,
                                    code = c.Code,
                                    name = c.Name,
                                    nativeName = c.NativeName,
                                    isActive = c.IsActive,
                                    localeCount = c.Locales.Count
                                })
                            })
                            .FirstOrDefaultAsync();
                        nodeData = region;
                        break;

                    case "country":
                        var country = await _context.Countries
                            .Include(c => c.Region)
                            .Include(c => c.Locales)
                                .ThenInclude(l => l.Currency)
                            .Include(c => c.ComplianceProfile)
                            .Where(c => c.Id == entityId)
                            .Select(c => new
                            {
                                type = "country",
                                id = c.Id,
                                code = c.Code,
                                name = c.Name,
                                nativeName = c.NativeName,
                                isActive = c.IsActive,
                                region = new { id = c.Region.Id, code = c.Region.Code, name = c.Region.Name },
                                continent = c.Continent,
                                phonePrefix = c.PhonePrefix,
                                supportsShipping = c.SupportsShipping,
                                supportsBilling = c.SupportsBilling,
                                compliance = c.ComplianceProfile != null ? new
                                {
                                    riskLevel = c.ComplianceProfile.ComplianceRiskLevel.ToString(),
                                    hasTradeSanctions = c.ComplianceProfile.HasTradeSanctions,
                                    hasExportRestrictions = c.ComplianceProfile.HasExportRestrictions
                                } : null,
                                locales = c.Locales.Select(l => new
                                {
                                    id = l.Id,
                                    code = l.Code,
                                    name = l.Name,
                                    nativeName = l.NativeName,
                                    priority = l.PriorityInCountry,
                                    isDefault = c.DefaultLocaleId == l.Id,
                                    currency = new { code = l.Currency.Code, symbol = l.Currency.Symbol }
                                })
                            })
                            .FirstOrDefaultAsync();
                        nodeData = country;
                        break;

                    case "locale":
                        var locale = await _context.Locales
                            .Include(l => l.Country)
                                .ThenInclude(c => c.Region)
                            .Include(l => l.Currency)
                            .Where(l => l.Id == entityId)
                            .Select(l => new
                            {
                                type = "locale",
                                id = l.Id,
                                code = l.Code,
                                name = l.Name,
                                nativeName = l.NativeName,
                                isActive = l.IsActive,
                                languageCode = l.LanguageCode,
                                countryCode = l.CountryCode,
                                isRtl = l.IsRtl,
                                dateFormat = l.DateFormat,
                                numberFormat = l.NumberFormat,
                                priority = l.PriorityInCountry,
                                isPrimary = l.Country.DefaultLocaleId == l.Id,
                                country = new { id = l.Country.Id, code = l.Country.Code, name = l.Country.Name },
                                region = new { id = l.Country.Region.Id, code = l.Country.Region.Code, name = l.Country.Region.Name },
                                currency = new { id = l.Currency.Id, code = l.Currency.Code, symbol = l.Currency.Symbol }
                            })
                            .FirstOrDefaultAsync();
                        nodeData = locale;
                        break;
                }

                if (nodeData != null)
                {
                    exportData.Add(nodeData);
                    result.SuccessfulNodes.Add(nodeId);
                }
                else
                {
                    result.FailedNodes.Add(new BulkOperationError
                    {
                        NodeId = nodeId,
                        Error = $"Node not found: {nodeType}"
                    });
                }
            }
            catch (Exception ex)
            {
                result.FailedNodes.Add(new BulkOperationError
                {
                    NodeId = nodeId,
                    Error = ex.Message
                });
            }
        }

        // In a real implementation, you'd save this to a file or blob storage
        // For now, we'll serialize the data and provide metadata
        var exportFileName = $"locale-hierarchy-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json";
        var exportJson = JsonSerializer.Serialize(new
        {
            exportDate = DateTime.UtcNow,
            exportedNodes = exportData.Count,
            data = exportData
        }, new JsonSerializerOptions { WriteIndented = true });

        // In production, save to storage and return download URL
        result.ExportUrl = $"/api/tree/download-export/{exportFileName}";
        
        _logger.LogInformation("Generated export for {SuccessCount} nodes", result.SuccessfulNodes.Count);

        return result;
    }

    private async Task<TreeNodeDetailDto?> CreateRegionNode(CreateNodeRequest request)
    {
        var region = new Region
        {
            Code = request.Code.ToUpper(),
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Regions.Add(region);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created region {RegionCode} - {RegionName}", region.Code, region.Name);

        return new TreeNodeDetailDto
        {
            Id = $"region_{region.Id}",
            Type = "region",
            Name = region.Name,
            Code = region.Code,
            Description = region.Description,
            IsActive = region.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["countryCount"] = 0,
                ["totalCountries"] = 0
            }
        };
    }

    private async Task<TreeNodeDetailDto?> CreateCountryNode(CreateNodeRequest request)
    {
        if (!request.ParentId.HasValue)
        {
            throw new ArgumentException("ParentId (Region ID) is required for country creation");
        }

        var region = await _context.Regions.FindAsync(request.ParentId.Value);
        if (region == null)
        {
            throw new ArgumentException("Parent region not found");
        }

        // Extract properties from request
        var properties = request.Properties;
        var nativeName = properties.GetValueOrDefault("nativeName", request.Name)?.ToString() ?? request.Name;
        var continent = properties.GetValueOrDefault("continent", "")?.ToString();
        var phonePrefix = properties.GetValueOrDefault("phonePrefix", "")?.ToString();
        var supportsShipping = bool.Parse(properties.GetValueOrDefault("supportsShipping", true)?.ToString() ?? "true");
        var supportsBilling = bool.Parse(properties.GetValueOrDefault("supportsBilling", true)?.ToString() ?? "true");

        var country = new Country
        {
            Code = request.Code.ToUpper(),
            Name = request.Name,
            NativeName = nativeName,
            RegionId = request.ParentId.Value,
            Continent = continent,
            PhonePrefix = phonePrefix,
            SupportsShipping = supportsShipping,
            SupportsBilling = supportsBilling,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Countries.Add(country);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created country {CountryCode} - {CountryName} in region {RegionCode}", 
            country.Code, country.Name, region.Code);

        return new TreeNodeDetailDto
        {
            Id = $"country_{country.Id}",
            Type = "country",
            Name = country.Name,
            Code = country.Code,
            Description = $"Country in {region.Name} region",
            IsActive = country.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["nativeName"] = country.NativeName,
                ["continent"] = country.Continent ?? "",
                ["phonePrefix"] = country.PhonePrefix ?? "",
                ["localeCount"] = 0,
                ["hasMultipleLocales"] = false,
                ["supportsShipping"] = country.SupportsShipping,
                ["supportsBilling"] = country.SupportsBilling,
                ["regionId"] = country.RegionId,
                ["regionName"] = region.Name
            }
        };
    }

    private async Task<TreeNodeDetailDto?> CreateLocaleNode(CreateNodeRequest request)
    {
        if (!request.ParentId.HasValue)
        {
            throw new ArgumentException("ParentId (Country ID) is required for locale creation");
        }

        var country = await _context.Countries
            .Include(c => c.Region)
            .Where(c => c.Id == request.ParentId.Value)
            .FirstOrDefaultAsync();

        if (country == null)
        {
            throw new ArgumentException("Parent country not found");
        }

        // Extract properties from request
        var properties = request.Properties;
        var languageCode = properties.GetValueOrDefault("languageCode", request.Code.Split('_')[0])?.ToString() ?? "en";
        var countryCode = properties.GetValueOrDefault("countryCode", country.Code)?.ToString() ?? country.Code;
        var nativeName = properties.GetValueOrDefault("nativeName", request.Name)?.ToString() ?? request.Name;
        
        // Parse currency ID safely
        var currencyId = Guid.Empty;
        var currencyIdString = properties.GetValueOrDefault("currencyId", "")?.ToString();
        if (!string.IsNullOrEmpty(currencyIdString) && Guid.TryParse(currencyIdString, out var parsedCurrencyId))
        {
            currencyId = parsedCurrencyId;
        }
        
        var isRtl = bool.Parse(properties.GetValueOrDefault("isRtl", false)?.ToString() ?? "false");
        var dateFormat = properties.GetValueOrDefault("dateFormat", "MM/dd/yyyy")?.ToString() ?? "MM/dd/yyyy";
        var numberFormat = properties.GetValueOrDefault("numberFormat", "{}")?.ToString() ?? "{}";
        var priorityInCountry = int.Parse(properties.GetValueOrDefault("priority", 100)?.ToString() ?? "100");

        // Get default currency if not specified
        if (currencyId == Guid.Empty)
        {
            var defaultCurrency = await _context.Currencies.FirstOrDefaultAsync(c => c.Code == "USD");
            if (defaultCurrency != null)
            {
                currencyId = defaultCurrency.Id;
            }
        }

        // Check for duplicate locale code
        var existingLocale = await _context.Locales
            .FirstOrDefaultAsync(l => l.Code.ToLower() == request.Code.ToLower());
        if (existingLocale != null)
        {
            throw new ArgumentException($"A locale with code '{request.Code}' already exists");
        }

        var locale = new Locale
        {
            Code = request.Code.ToLower(),
            LanguageCode = languageCode.ToLower(),
            CountryCode = countryCode.ToUpper(),
            RegionId = country.RegionId,
            CountryId = request.ParentId.Value,
            CurrencyId = currencyId,
            Name = request.Name,
            NativeName = nativeName,
            IsRtl = isRtl,
            DateFormat = dateFormat,
            NumberFormat = numberFormat,
            PriorityInCountry = priorityInCountry,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Locales.Add(locale);

        // Set as default locale if this is the first/highest priority locale for the country
        var existingLocales = await _context.Locales
            .Where(l => l.CountryId == request.ParentId.Value && l.IsActive)
            .CountAsync();

        if (existingLocales == 0 || priorityInCountry == 1)
        {
            country.DefaultLocaleId = locale.Id;
            _context.Countries.Update(country);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created locale {LocaleCode} - {LocaleName} in country {CountryCode}", 
            locale.Code, locale.Name, country.Code);

        // Load currency for response
        var currency = await _context.Currencies.FindAsync(currencyId);

        return new TreeNodeDetailDto
        {
            Id = $"locale_{locale.Id}",
            Type = "locale",
            Name = locale.Name,
            Code = locale.Code,
            Description = $"Locale in {country.Name}",
            IsActive = locale.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["nativeName"] = locale.NativeName,
                ["languageCode"] = locale.LanguageCode,
                ["countryCode"] = locale.CountryCode,
                ["currency"] = currency?.Code ?? "",
                ["currencySymbol"] = currency?.Symbol ?? "",
                ["isRtl"] = locale.IsRtl,
                ["dateFormat"] = locale.DateFormat,
                ["numberFormat"] = locale.NumberFormat,
                ["priority"] = locale.PriorityInCountry,
                ["isPrimary"] = country.DefaultLocaleId == locale.Id,
                ["countryId"] = locale.CountryId,
                ["countryName"] = country.Name
            }
        };
    }

    private async Task<TreeNodeDetailDto?> UpdateRegionNode(Guid entityId, UpdateNodeRequest request)
    {
        var region = await _context.Regions
            .Include(r => r.Countries)
            .Where(r => r.Id == entityId)
            .FirstOrDefaultAsync();

        if (region == null) return null;

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.Name))
            region.Name = request.Name;
        
        if (!string.IsNullOrEmpty(request.Code))
            region.Code = request.Code.ToUpper();
        
        if (!string.IsNullOrEmpty(request.Description))
            region.Description = request.Description;
        
        if (request.IsActive.HasValue)
            region.IsActive = request.IsActive.Value;

        region.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated region {RegionCode} - {RegionName}", region.Code, region.Name);

        return new TreeNodeDetailDto
        {
            Id = $"region_{region.Id}",
            Type = "region",
            Name = region.Name,
            Code = region.Code,
            Description = region.Description,
            IsActive = region.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["countryCount"] = region.Countries.Count(c => c.IsActive),
                ["totalCountries"] = region.Countries.Count
            }
        };
    }

    private async Task<TreeNodeDetailDto?> UpdateCountryNode(Guid entityId, UpdateNodeRequest request)
    {
        var country = await _context.Countries
            .Include(c => c.Region)
            .Include(c => c.Locales)
            .Include(c => c.ComplianceProfile)
            .Where(c => c.Id == entityId)
            .FirstOrDefaultAsync();

        if (country == null) return null;

        // Update core fields if provided
        if (!string.IsNullOrEmpty(request.Name))
            country.Name = request.Name;
        
        if (!string.IsNullOrEmpty(request.Code))
            country.Code = request.Code.ToUpper();
        
        if (request.IsActive.HasValue)
            country.IsActive = request.IsActive.Value;

        // Update extended properties
        var properties = request.Properties;
        if (properties.ContainsKey("nativeName"))
            country.NativeName = properties["nativeName"]?.ToString() ?? country.NativeName;
        
        if (properties.ContainsKey("continent"))
            country.Continent = properties["continent"]?.ToString();
        
        if (properties.ContainsKey("phonePrefix"))
            country.PhonePrefix = properties["phonePrefix"]?.ToString();
        
        if (properties.ContainsKey("supportsShipping"))
            country.SupportsShipping = bool.Parse(properties["supportsShipping"]?.ToString() ?? "true");
        
        if (properties.ContainsKey("supportsBilling"))
            country.SupportsBilling = bool.Parse(properties["supportsBilling"]?.ToString() ?? "true");

        country.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated country {CountryCode} - {CountryName}", country.Code, country.Name);

        var responseProperties = new Dictionary<string, object>
        {
            ["nativeName"] = country.NativeName,
            ["continent"] = country.Continent ?? "",
            ["phonePrefix"] = country.PhonePrefix ?? "",
            ["localeCount"] = country.Locales.Count(l => l.IsActive),
            ["hasMultipleLocales"] = country.Locales.Count(l => l.IsActive) > 1,
            ["supportsShipping"] = country.SupportsShipping,
            ["supportsBilling"] = country.SupportsBilling,
            ["regionId"] = country.RegionId,
            ["regionName"] = country.Region.Name
        };

        if (country.ComplianceProfile != null)
        {
            responseProperties["complianceRisk"] = country.ComplianceProfile.ComplianceRiskLevel.ToString();
            responseProperties["hasTradeSanctions"] = country.ComplianceProfile.HasTradeSanctions;
            responseProperties["hasExportRestrictions"] = country.ComplianceProfile.HasExportRestrictions;
            responseProperties["regulatoryNotes"] = country.ComplianceProfile.RegulatoryNotes ?? "";
        }

        return new TreeNodeDetailDto
        {
            Id = $"country_{country.Id}",
            Type = "country",
            Name = country.Name,
            Code = country.Code,
            Description = $"Country in {country.Region.Name} region",
            IsActive = country.IsActive,
            Properties = responseProperties
        };
    }

    private async Task<TreeNodeDetailDto?> UpdateLocaleNode(Guid entityId, UpdateNodeRequest request)
    {
        var locale = await _context.Locales
            .Include(l => l.Country)
                .ThenInclude(c => c.Region)
            .Include(l => l.Currency)
            .Where(l => l.Id == entityId)
            .FirstOrDefaultAsync();

        if (locale == null) return null;

        // Update core fields if provided
        if (!string.IsNullOrEmpty(request.Name))
            locale.Name = request.Name;
        
        if (!string.IsNullOrEmpty(request.Code))
            locale.Code = request.Code.ToLower();
        
        if (request.IsActive.HasValue)
            locale.IsActive = request.IsActive.Value;

        // Update extended properties
        var properties = request.Properties;
        if (properties.ContainsKey("nativeName"))
            locale.NativeName = properties["nativeName"]?.ToString() ?? locale.NativeName;
        
        if (properties.ContainsKey("languageCode"))
            locale.LanguageCode = properties["languageCode"]?.ToString()?.ToLower() ?? locale.LanguageCode;
        
        if (properties.ContainsKey("isRtl"))
            locale.IsRtl = bool.Parse(properties["isRtl"]?.ToString() ?? "false");
        
        if (properties.ContainsKey("dateFormat"))
            locale.DateFormat = properties["dateFormat"]?.ToString() ?? locale.DateFormat;
        
        if (properties.ContainsKey("numberFormat"))
            locale.NumberFormat = properties["numberFormat"]?.ToString() ?? locale.NumberFormat;
        
        if (properties.ContainsKey("priority"))
        {
            var newPriority = int.Parse(properties["priority"]?.ToString() ?? "100");
            locale.PriorityInCountry = newPriority;
            
            // Update default locale if this becomes priority 1
            if (newPriority == 1 && locale.Country != null)
            {
                locale.Country.DefaultLocaleId = locale.Id;
                _context.Countries.Update(locale.Country);
            }
        }

        if (properties.ContainsKey("currencyId"))
        {
            if (Guid.TryParse(properties["currencyId"]?.ToString(), out var currencyId))
            {
                locale.CurrencyId = currencyId;
            }
        }

        locale.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated locale {LocaleCode} - {LocaleName}", locale.Code, locale.Name);

        return new TreeNodeDetailDto
        {
            Id = $"locale_{locale.Id}",
            Type = "locale",
            Name = locale.Name,
            Code = locale.Code,
            Description = $"Locale in {locale.Country?.Name ?? "Unknown Country"}",
            IsActive = locale.IsActive,
            Properties = new Dictionary<string, object>
            {
                ["nativeName"] = locale.NativeName,
                ["languageCode"] = locale.LanguageCode,
                ["countryCode"] = locale.CountryCode,
                ["currency"] = locale.Currency?.Code ?? "",
                ["currencySymbol"] = locale.Currency?.Symbol ?? "",
                ["isRtl"] = locale.IsRtl,
                ["dateFormat"] = locale.DateFormat,
                ["numberFormat"] = locale.NumberFormat,
                ["priority"] = locale.PriorityInCountry,
                ["isPrimary"] = locale.Country?.DefaultLocaleId == locale.Id,
                ["countryId"] = locale.CountryId,
                ["countryName"] = locale.Country?.Name ?? ""
            }
        };
    }

    private string GetClientIpAddress()
    {
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    private static string DetectCountryFromIpSimple(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "127.0.0.1" || ipAddress == "::1")
            return "US";

        var hash = ipAddress.GetHashCode();
        var countryIndex = Math.Abs(hash) % 10;

        return countryIndex switch
        {
            0 => "US", 1 => "CA", 2 => "GB", 3 => "FR", 4 => "DE",
            5 => "JP", 6 => "AU", 7 => "BR", 8 => "CN", _ => "US"
        };
    }

    private static string GetRegionIcon(string regionCode)
    {
        return regionCode switch
        {
            "AMER" => "🌎",
            "EMEA" => "🌍", 
            "APJ" => "🌏",
            "LA" => "🌎",
            _ => "🌐"
        };
    }

    private static string GetCountryFlag(string countryCode)
    {
        return countryCode switch
        {
            "US" => "🇺🇸", "CA" => "🇨🇦", "MX" => "🇲🇽", "FR" => "🇫🇷", "DE" => "🇩🇪",
            "GB" => "🇬🇧", "IT" => "🇮🇹", "ES" => "🇪🇸", "CH" => "🇨🇭", "JP" => "🇯🇵",
            "CN" => "🇨🇳", "AU" => "🇦🇺", "BR" => "🇧🇷", "RU" => "🇷🇺", _ => "🏳️"
        };
    }

    #endregion
}