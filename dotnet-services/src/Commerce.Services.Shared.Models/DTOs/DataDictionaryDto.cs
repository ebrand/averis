namespace Commerce.Services.Shared.Models.DTOs;

/// <summary>
/// DTO for Data Dictionary API responses
/// Provides field metadata for dynamic form rendering
/// </summary>
public class DataDictionaryDto
{
    /// <summary>
    /// Unique identifier for the data dictionary entry
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Database column name
    /// </summary>
    public string ColumnName { get; set; } = string.Empty;

    /// <summary>
    /// Display name for UI forms
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Data type (varchar, integer, boolean, jsonb, etc.)
    /// </summary>
    public string DataType { get; set; } = string.Empty;

    /// <summary>
    /// Field description for help text
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category for grouping related fields
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Whether field is required for 'active' status validation
    /// </summary>
    public bool RequiredForActive { get; set; }

    /// <summary>
    /// Maximum length for string fields
    /// </summary>
    public int? MaxLength { get; set; }

    /// <summary>
    /// Minimum length for string fields
    /// </summary>
    public int? MinLength { get; set; }

    /// <summary>
    /// Regular expression pattern for validation
    /// </summary>
    public string? ValidationPattern { get; set; }

    /// <summary>
    /// Array of allowed values for dropdown fields
    /// </summary>
    public List<string>? AllowedValues { get; set; }

    /// <summary>
    /// Role responsible for maintaining this field
    /// </summary>
    public string MaintenanceRole { get; set; } = "system";

    /// <summary>
    /// Whether field exists in Product MDM schema
    /// </summary>
    public bool InProductMdm { get; set; }

    /// <summary>
    /// Whether field exists in Pricing MDM schema
    /// </summary>
    public bool InPricingMdm { get; set; }

    /// <summary>
    /// Whether field exists in E-commerce schema
    /// </summary>
    public bool InEcommerce { get; set; }

    /// <summary>
    /// Display order for form fields
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Whether this is a system field (non-editable)
    /// </summary>
    public bool IsSystemField { get; set; }

    /// <summary>
    /// Whether field can be edited by users
    /// </summary>
    public bool IsEditable { get; set; }

    /// <summary>
    /// When the entry was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the entry was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// User who created the entry
    /// </summary>
    public string CreatedBy { get; set; } = "system";

    /// <summary>
    /// User who last updated the entry
    /// </summary>
    public string UpdatedBy { get; set; } = "system";

    /// <summary>
    /// List of schemas where this field is present
    /// </summary>
    public List<string> Schemas { get; set; } = new();

    /// <summary>
    /// Human-readable maintenance role label
    /// </summary>
    public string MaintenanceRoleLabel { get; set; } = string.Empty;
}

/// <summary>
/// Response wrapper for data dictionary API endpoints
/// </summary>
public class DataDictionaryResponse
{
    /// <summary>
    /// Array of data dictionary entries (snake_case for frontend compatibility)
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("data_dictionary")]
    public List<DataDictionaryDto> DataDictionary { get; set; } = new();

    /// <summary>
    /// Source of the data (for compatibility with Node.js API)
    /// </summary>
    public string Source { get; set; } = "api";
}

/// <summary>
/// Response for validation rules endpoint
/// </summary>
public class ValidationRulesResponse
{
    /// <summary>
    /// Dictionary of validation rules by column name
    /// </summary>
    public Dictionary<string, ValidationRule> ValidationRules { get; set; } = new();

    /// <summary>
    /// Source of the data
    /// </summary>
    public string Source { get; set; } = "api";
}

/// <summary>
/// Validation rule for a specific field
/// </summary>
public class ValidationRule
{
    /// <summary>
    /// Whether field is required
    /// </summary>
    public bool Required { get; set; }

    /// <summary>
    /// Maximum length for string fields
    /// </summary>
    public int? MaxLength { get; set; }

    /// <summary>
    /// Minimum length for string fields
    /// </summary>
    public int? MinLength { get; set; }

    /// <summary>
    /// Regular expression pattern
    /// </summary>
    public string? Pattern { get; set; }

    /// <summary>
    /// Array of allowed values
    /// </summary>
    public List<string>? AllowedValues { get; set; }

    /// <summary>
    /// Data type
    /// </summary>
    public string DataType { get; set; } = string.Empty;
}

/// <summary>
/// Response for categories endpoint
/// </summary>
public class CategoriesResponse
{
    /// <summary>
    /// Array of category names
    /// </summary>
    public List<string> Categories { get; set; } = new();

    /// <summary>
    /// Source of the data
    /// </summary>
    public string Source { get; set; } = "api";
}