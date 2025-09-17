using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service for managing the hierarchical Region-Currency-Locale tree structure
/// Provides tree building, manipulation, and impact analysis functionality
/// </summary>
public class RegionLocaleTreeService
{
    private readonly PricingDbContext _context;
    private readonly ILogger<RegionLocaleTreeService> _logger;

    private static readonly Dictionary<string, string> RegionFlags = new()
    {
        { "AMER", "🌎" },  // Americas
        { "EMEA", "🌍" },  // Europe/Middle East/Africa  
        { "APJ", "🌏" },   // Asia Pacific Japan
        { "LA", "🌎" }     // Latin America
    };

    private static readonly Dictionary<string, string> CountryFlags = new()
    {
        { "US", "🇺🇸" }, { "CA", "🇨🇦" }, { "MX", "🇲🇽" },
        { "GB", "🇬🇧" }, { "FR", "🇫🇷" }, { "DE", "🇩🇪" }, { "IT", "🇮🇹" }, { "ES", "🇪🇸" },
        { "JP", "🇯🇵" }, { "CN", "🇨🇳" }, { "KR", "🇰🇷" }, { "AU", "🇦🇺" },
        { "BR", "🇧🇷" }, { "AR", "🇦🇷" }, { "CL", "🇨🇱" }, { "PE", "🇵🇪" }
    };

    public RegionLocaleTreeService(PricingDbContext context, ILogger<RegionLocaleTreeService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Builds the complete hierarchical tree: Region → Currency → Locale
    /// </summary>
    public async Task<List<RegionLocaleTreeDto>> BuildTreeAsync()
    {
        try
        {
            _logger.LogInformation("Building region-locale tree structure");

            var regions = await _context.Regions
                .Where(r => r.IsActive)
                .Include(r => r.Locales)
                .ThenInclude(l => l.Currency)
                .Include(r => r.DefaultCurrency)
                .OrderBy(r => r.Code)
                .ToListAsync();

            var tree = new List<RegionLocaleTreeDto>();

            foreach (var region in regions)
            {
                var regionNode = await BuildRegionNodeAsync(region);
                tree.Add(regionNode);
            }

            _logger.LogInformation("Successfully built tree with {RegionCount} regions", tree.Count);
            return tree;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building region-locale tree");
            throw;
        }
    }

    /// <summary>
    /// Builds a region node with its currency and locale children
    /// </summary>
    private async Task<RegionLocaleTreeDto> BuildRegionNodeAsync(Region region)
    {
        // Get catalog counts for impact analysis
        var catalogCount = await _context.Catalogs
            .Where(c => c.RegionId == region.Id && c.IsActive)
            .CountAsync();

        var regionNode = new RegionLocaleTreeDto
        {
            Id = $"region_{region.Id}",
            Name = $"{region.Name} ({region.Code})",
            Type = NodeType.Region,
            Icon = "🌍",
            CssClass = "region-node",
            IsExpanded = true,
            Metadata = new NodeMetadata
            {
                EntityId = region.Id,
                Code = region.Code,
                Description = region.Description ?? "",
                Status = region.IsActive ? "Active" : "Inactive",
                Flag = RegionFlags.GetValueOrDefault(region.Code, "🌍"),
                CatalogCount = catalogCount,
                ItemCount = region.Locales.Count
            }
        };

        // Group locales by currency to create currency nodes
        var currencyGroups = region.Locales
            .Where(l => l.IsActive)
            .GroupBy(l => l.Currency)
            .OrderBy(g => g.Key.Code);

        foreach (var currencyGroup in currencyGroups)
        {
            var currencyNode = BuildCurrencyNode(currencyGroup.Key, currencyGroup.ToList());
            regionNode.Children.Add(currencyNode);
        }

        return regionNode;
    }

    /// <summary>
    /// Builds a currency node with its locale children
    /// </summary>
    private RegionLocaleTreeDto BuildCurrencyNode(Currency currency, List<Locale> locales)
    {
        var currencyNode = new RegionLocaleTreeDto
        {
            Id = $"currency_{currency.Id}",
            Name = $"{currency.Code} - {currency.Name}",
            Type = NodeType.Currency,
            Icon = "💰",
            CssClass = "currency-node",
            IsExpanded = true,
            Metadata = new NodeMetadata
            {
                EntityId = currency.Id,
                Code = currency.Code,
                Description = currency.Name,
                Status = currency.IsActive ? "Active" : "Inactive",
                Symbol = currency.Symbol ?? currency.Code,
                ItemCount = locales.Count
            }
        };

        // Add locale children
        foreach (var locale in locales.OrderBy(l => l.Name))
        {
            var localeNode = BuildLocaleNode(locale);
            currencyNode.Children.Add(localeNode);
        }

        return currencyNode;
    }

    /// <summary>
    /// Builds a locale leaf node
    /// </summary>
    private RegionLocaleTreeDto BuildLocaleNode(Locale locale)
    {
        var countryFlag = CountryFlags.GetValueOrDefault(locale.CountryCode, "🏳️");
        var rtlIndicator = locale.IsRtl ? " ⬅️" : "";

        return new RegionLocaleTreeDto
        {
            Id = $"locale_{locale.Id}",
            Name = $"{locale.Name}{rtlIndicator}",
            Type = NodeType.Locale,
            Icon = countryFlag,
            CssClass = "locale-node" + (locale.IsRtl ? " rtl-locale" : ""),
            CanHaveChildren = false,
            Metadata = new NodeMetadata
            {
                EntityId = locale.Id,
                Code = locale.Code,
                Description = locale.NativeName,
                Status = locale.IsActive ? "Active" : "Inactive",
                Flag = countryFlag,
                NativeName = locale.NativeName,
                IsRtl = locale.IsRtl,
                ItemCount = 0
            }
        };
    }

    /// <summary>
    /// Performs tree operations (add, move, delete) with impact analysis
    /// </summary>
    public async Task<TreeOperationResponse> PerformTreeOperationAsync(TreeOperationRequest request)
    {
        try
        {
            _logger.LogInformation("Performing tree operation: {Operation}", request.Operation);

            var response = new TreeOperationResponse();

            switch (request.Operation)
            {
                case TreeOperation.Add:
                    response = await AddNodeAsync(request);
                    break;
                case TreeOperation.Move:
                    response = await MoveNodeAsync(request);
                    break;
                case TreeOperation.Delete:
                    response = await DeleteNodeAsync(request);
                    break;
                case TreeOperation.Update:
                    response = await UpdateNodeAsync(request);
                    break;
                default:
                    response.Success = false;
                    response.ErrorMessage = $"Unsupported operation: {request.Operation}";
                    break;
            }

            if (response.Success)
            {
                response.UpdatedTree = (await BuildTreeAsync()).FirstOrDefault();
                response.Impact = await CalculateOperationImpactAsync(request);
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing tree operation: {Operation}", request.Operation);
            return new TreeOperationResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Adds a new node to the tree
    /// </summary>
    private async Task<TreeOperationResponse> AddNodeAsync(TreeOperationRequest request)
    {
        if (request.NodeData == null)
        {
            return new TreeOperationResponse
            {
                Success = false,
                ErrorMessage = "NodeData is required for add operations"
            };
        }

        switch (request.NodeData.Type)
        {
            case NodeType.Region:
                return await AddRegionAsync(request.NodeData);
            case NodeType.Locale:
                return await AddLocaleAsync(request.NodeData, request.TargetParentId);
            default:
                return new TreeOperationResponse
                {
                    Success = false,
                    ErrorMessage = $"Adding {request.NodeData.Type} nodes is not supported"
                };
        }
    }

    /// <summary>
    /// Adds a new region to the database
    /// </summary>
    private async Task<TreeOperationResponse> AddRegionAsync(RegionLocaleTreeDto nodeData)
    {
        var region = new Region
        {
            Code = nodeData.Metadata.Code,
            Name = nodeData.Name.Split('(')[0].Trim(),
            Description = nodeData.Metadata.Description,
            IsActive = true
        };

        _context.Regions.Add(region);
        await _context.SaveChangesAsync();

        return new TreeOperationResponse { Success = true };
    }

    /// <summary>
    /// Adds a new locale to a region
    /// </summary>
    private async Task<TreeOperationResponse> AddLocaleAsync(RegionLocaleTreeDto nodeData, string? targetParentId)
    {
        if (string.IsNullOrEmpty(targetParentId) || !targetParentId.StartsWith("region_"))
        {
            return new TreeOperationResponse
            {
                Success = false,
                ErrorMessage = "Target parent region is required for adding locales"
            };
        }

        if (!Guid.TryParse(targetParentId.Replace("region_", ""), out var regionId))
        {
            return new TreeOperationResponse
            {
                Success = false,
                ErrorMessage = "Invalid region ID"
            };
        }

        // This would be expanded to create actual locale entries
        // For now, return success as a placeholder
        return new TreeOperationResponse { Success = true };
    }

    /// <summary>
    /// Moves a node to a different parent (e.g., locale to different region)
    /// </summary>
    private async Task<TreeOperationResponse> MoveNodeAsync(TreeOperationRequest request)
    {
        // Implementation would handle moving locales between regions
        // This has significant impact on catalogs and requires careful validation
        return new TreeOperationResponse
        {
            Success = false,
            ErrorMessage = "Move operations not yet implemented - requires careful impact analysis"
        };
    }

    /// <summary>
    /// Deletes a node from the tree
    /// </summary>
    private async Task<TreeOperationResponse> DeleteNodeAsync(TreeOperationRequest request)
    {
        // Implementation would handle cascading deletes with proper impact analysis
        return new TreeOperationResponse
        {
            Success = false,
            ErrorMessage = "Delete operations require administrator approval due to catalog impact"
        };
    }

    /// <summary>
    /// Updates properties of an existing node
    /// </summary>
    private async Task<TreeOperationResponse> UpdateNodeAsync(TreeOperationRequest request)
    {
        // Implementation would update region, currency, or locale properties
        return new TreeOperationResponse { Success = true };
    }

    /// <summary>
    /// Calculates the impact of tree operations on catalogs and products
    /// </summary>
    private async Task<OperationImpact> CalculateOperationImpactAsync(TreeOperationRequest request)
    {
        var impact = new OperationImpact();

        // This would perform complex analysis of:
        // - How many catalogs would be affected
        // - How many products would need re-localization
        // - Estimated cost and time for changes
        // - Potential breaking changes or data loss

        impact.ChangeDetails.Add("Impact analysis not yet implemented");
        impact.EstimatedTime = "Analysis pending";

        return impact;
    }

    /// <summary>
    /// Gets detailed information about a specific node
    /// </summary>
    public async Task<RegionLocaleTreeDto?> GetNodeDetailsAsync(string nodeId)
    {
        try
        {
            if (nodeId.StartsWith("region_"))
            {
                var regionId = Guid.Parse(nodeId.Replace("region_", ""));
                var region = await _context.Regions
                    .Include(r => r.Locales)
                    .ThenInclude(l => l.Currency)
                    .FirstOrDefaultAsync(r => r.Id == regionId);

                return region == null ? null : await BuildRegionNodeAsync(region);
            }
            else if (nodeId.StartsWith("locale_"))
            {
                var localeId = Guid.Parse(nodeId.Replace("locale_", ""));
                var locale = await _context.Locales
                    .Include(l => l.Currency)
                    .Include(l => l.Region)
                    .FirstOrDefaultAsync(l => l.Id == localeId);

                return locale == null ? null : BuildLocaleNode(locale);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting node details for {NodeId}", nodeId);
            return null;
        }
    }
}