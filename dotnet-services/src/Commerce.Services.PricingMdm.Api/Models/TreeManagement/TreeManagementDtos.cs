using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Tree node DTO for hierarchical display
/// </summary>
public class TreeNodeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool IsExpanded { get; set; }
    public bool CanHaveChildren { get; set; } = true;
    public TreeNodeMetadata Metadata { get; set; } = new();
    public List<TreeNodeDto> Children { get; set; } = new();
}

/// <summary>
/// Metadata for tree nodes
/// </summary>
public class TreeNodeMetadata
{
    public Guid EntityId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? NativeName { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public int ItemCount { get; set; }
    public bool HasMultipleLocales { get; set; }
    public string? Continent { get; set; }
    public string? PhonePrefix { get; set; }
    public bool SupportsShipping { get; set; }
    public bool SupportsBilling { get; set; }
    public string? ComplianceRisk { get; set; }
    public bool HasSanctions { get; set; }
    public bool HasExportRestrictions { get; set; }
    public string? RegulatoryNotes { get; set; }
    public string? Currency { get; set; }
    public string? CurrencySymbol { get; set; }
    public bool IsRtl { get; set; }
    public bool IsPrimary { get; set; }
    public int Priority { get; set; }
    public string? DateFormat { get; set; }
    public string? NumberFormat { get; set; }
    public Guid? CountryId { get; set; }
    public string? CountryCode { get; set; }
    public string? LanguageCode { get; set; }
}

/// <summary>
/// Detailed tree node information
/// </summary>
public class TreeNodeDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}

/// <summary>
/// Bulk operation request
/// </summary>
public class BulkOperationRequest
{
    [Required]
    public string Operation { get; set; } = string.Empty; // activate, deactivate, delete, export
    
    [Required]
    public List<string> NodeIds { get; set; } = new();
    
    public Dictionary<string, object>? Parameters { get; set; }
}

/// <summary>
/// Bulk operation result
/// </summary>
public class BulkOperationResult
{
    public string Operation { get; set; } = string.Empty;
    public int TotalNodes { get; set; }
    public List<string> SuccessfulNodes { get; set; } = new();
    public List<BulkOperationError> FailedNodes { get; set; } = new();
    public string? ExportUrl { get; set; }
}

/// <summary>
/// Bulk operation error
/// </summary>
public class BulkOperationError
{
    public string NodeId { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}

/// <summary>
/// Node creation request
/// </summary>
public class CreateNodeRequest
{
    [Required]
    public string NodeType { get; set; } = string.Empty; // region, country, locale
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string Code { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}

/// <summary>
/// Node update request
/// </summary>
public class UpdateNodeRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}

/// <summary>
/// IP detection result
/// </summary>
public class IpDetectionResult
{
    public string IpAddress { get; set; } = string.Empty;
    public bool DetectionSuccessful { get; set; }
    public CountryInfo? DetectedCountry { get; set; }
    public LocaleInfo? RecommendedLocale { get; set; }
    public List<LocaleInfo> AvailableLocales { get; set; } = new();
    public bool ComplianceRequired { get; set; }
    public string DetectionMethod { get; set; } = string.Empty;
    public string Confidence { get; set; } = string.Empty;
    public string? Message { get; set; }
}

/// <summary>
/// Country information
/// </summary>
public class CountryInfo
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NativeName { get; set; }
    public string Flag { get; set; } = string.Empty;
    public RegionInfo? Region { get; set; }
    public string ComplianceRisk { get; set; } = string.Empty;
    public bool SupportsShipping { get; set; }
    public bool SupportsBilling { get; set; }
}

/// <summary>
/// Region information
/// </summary>
public class RegionInfo
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Locale information
/// </summary>
public class LocaleInfo
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NativeName { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string CurrencySymbol { get; set; } = string.Empty;
    public bool IsRtl { get; set; }
    public bool IsPrimary { get; set; }
    public int Priority { get; set; }
}

/// <summary>
/// Session setup request
/// </summary>
public class SessionSetupRequest
{
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public string? PreferredCountryCode { get; set; }
    public string? PreferredLocaleCode { get; set; }
}

/// <summary>
/// Session setup result
/// </summary>
public class SessionSetupResult
{
    public string SessionId { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public CountryInfo? DetectedCountry { get; set; }
    public LocaleInfo? SelectedLocale { get; set; }
    public List<LocaleInfo> AvailableLocales { get; set; } = new();
    public bool ComplianceRequired { get; set; }
    public bool SessionEstablished { get; set; }
    public string? Message { get; set; }
}