using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.Shared.Models.Entities;

/// <summary>
/// Data Dictionary Entity - Metadata for product schema definitions
/// Controls form rendering, validation rules, and field display properties
/// </summary>
[Table("data_dictionary", Schema = "averis_system")]
public class DataDictionary
{
    /// <summary>
    /// Unique identifier for the data dictionary entry
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    /// <summary>
    /// Database column name (must be valid SQL identifier)
    /// </summary>
    [Required]
    [MaxLength(255)]
    [Column("column_name")]
    public string ColumnName { get; set; } = string.Empty;

    /// <summary>
    /// Display name for UI forms
    /// </summary>
    [Required]
    [MaxLength(255)]
    [Column("display_name")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Data type (varchar, integer, boolean, jsonb, etc.)
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("data_type")]
    public string DataType { get; set; } = string.Empty;

    /// <summary>
    /// Field description for help text
    /// </summary>
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Category for grouping related fields
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("category")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Whether field is required for 'active' status validation
    /// </summary>
    [Column("required_for_active")]
    public bool RequiredForActive { get; set; } = false;

    /// <summary>
    /// Maximum length for string fields
    /// </summary>
    [Column("max_length")]
    public int? MaxLength { get; set; }

    /// <summary>
    /// Minimum length for string fields
    /// </summary>
    [Column("min_length")]
    public int? MinLength { get; set; }

    /// <summary>
    /// Regular expression pattern for validation
    /// </summary>
    [Column("validation_pattern")]
    public string? ValidationPattern { get; set; }

    /// <summary>
    /// JSON array of allowed values for dropdown fields
    /// </summary>
    [Column("allowed_values")]
    public List<string>? AllowedValues { get; set; }

    /// <summary>
    /// Role responsible for maintaining this field
    /// </summary>
    [MaxLength(50)]
    [Column("maintenance_role")]
    public string MaintenanceRole { get; set; } = "system";

    /// <summary>
    /// Whether field exists in Product MDM schema
    /// </summary>
    [Column("in_product_mdm")]
    public bool InProductMdm { get; set; } = false;

    /// <summary>
    /// Whether field exists in Pricing MDM schema
    /// </summary>
    [Column("in_pricing_mdm")]
    public bool InPricingMdm { get; set; } = false;

    /// <summary>
    /// Whether field exists in E-commerce schema
    /// </summary>
    [Column("in_ecommerce")]
    public bool InEcommerce { get; set; } = false;

    /// <summary>
    /// Display order for form fields
    /// </summary>
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Whether this is a system field (non-editable)
    /// </summary>
    [Column("is_system_field")]
    public bool IsSystemField { get; set; } = false;

    /// <summary>
    /// Whether field can be edited by users
    /// </summary>
    [Column("is_editable")]
    public bool IsEditable { get; set; } = true;

    /// <summary>
    /// When the entry was created
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the entry was last updated
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created the entry
    /// </summary>
    [MaxLength(255)]
    [Column("created_by")]
    public string CreatedBy { get; set; } = "system";

    /// <summary>
    /// User who last updated the entry
    /// </summary>
    [MaxLength(255)]
    [Column("updated_by")]
    public string UpdatedBy { get; set; } = "system";

    /// <summary>
    /// Get schemas where this field is present
    /// </summary>
    public List<string> GetSchemas()
    {
        var schemas = new List<string>();
        if (InProductMdm) schemas.Add("ProductMDM");
        if (InPricingMdm) schemas.Add("PricingMDM");
        if (InEcommerce) schemas.Add("Ecommerce");
        return schemas;
    }

    /// <summary>
    /// Check if field can be edited by users
    /// </summary>
    public bool CanEdit()
    {
        return IsEditable && !IsSystemField;
    }

    /// <summary>
    /// Get human-readable maintenance role label
    /// </summary>
    public string GetMaintenanceRoleLabel()
    {
        return MaintenanceRole switch
        {
            "product_marketing" => "Product Marketing",
            "product_legal" => "Legal",
            "product_finance" => "Finance",
            "product_salesops" => "Sales Ops",
            "product_contracts" => "Contracts",
            "system" => "System",
            _ => MaintenanceRole
        };
    }
}