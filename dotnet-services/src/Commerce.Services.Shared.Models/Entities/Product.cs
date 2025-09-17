using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Commerce.Services.Shared.Models.Entities;

/// <summary>
/// Product Entity - Simplified Product Model with 24 essential fields
/// Maps to the averis_product.products table in PostgreSQL
/// This represents the system-of-record for all product data
/// </summary>
[Table("products", Schema = "averis_product")]
public class Product
{
    /// <summary>
    /// Unique identifier for the product
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Stock Keeping Unit - unique product identifier
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("sku")]
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// Product display name
    /// </summary>
    [Required]
    [MaxLength(500)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Product description
    /// </summary>
    [Required]
    [MaxLength(2000)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Product type/category classification
    /// </summary>
    [MaxLength(100)]
    [Column("type")]
    public string? Type { get; set; }

    /// <summary>
    /// Hierarchical product categorization as JSON array
    /// </summary>
    [Column("categorization", TypeName = "jsonb")]
    public string CategorizationJson { get; set; } = "[]";

    /// <summary>
    /// Base product price in USD
    /// </summary>
    [Column("base_price", TypeName = "decimal(10,4)")]
    public decimal BasePrice { get; set; } = 0m;

    /// <summary>
    /// Product cost price
    /// </summary>
    [Column("cost_price", TypeName = "decimal(10,4)")]
    public decimal CostPrice { get; set; } = 0m;

    /// <summary>
    /// Indicates if license is required for this product
    /// </summary>
    [Column("license_required_flag")]
    public bool LicenseRequiredFlag { get; set; } = false;

    /// <summary>
    /// Indicates if product uses seat-based pricing
    /// </summary>
    [Column("seat_based_pricing_flag")]
    public bool SeatBasedPricingFlag { get; set; } = false;

    /// <summary>
    /// Indicates if product should be displayed on web
    /// </summary>
    [Column("web_display_flag")]
    public bool WebDisplayFlag { get; set; } = false;

    /// <summary>
    /// Avalara tax code for tax calculations
    /// </summary>
    [MaxLength(50)]
    [Column("ava_tax_code")]
    public string? AvaTaxCode { get; set; }

    /// <summary>
    /// Indicates if product can be fulfilled
    /// </summary>
    [Column("can_be_fulfilled_flag")]
    public bool CanBeFulfilledFlag { get; set; } = false;

    /// <summary>
    /// Indicates if this is a contract item
    /// </summary>
    [Column("contract_item_flag")]
    public bool ContractItemFlag { get; set; } = false;

    /// <summary>
    /// URL-friendly slug for e-commerce
    /// </summary>
    [MaxLength(200)]
    [Column("slug")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Extended product description for e-commerce
    /// </summary>
    [Column("long_description")]
    public string? LongDescription { get; set; }

    /// <summary>
    /// Product lifecycle status: draft, active, deprecated, archived
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "draft";

    /// <summary>
    /// Indicates if product is available for sale
    /// </summary>
    [Column("available_flag")]
    public bool AvailableFlag { get; set; } = true;

    /// <summary>
    /// Multi-currency pricing information as JSON
    /// </summary>
    [Column("pricing", TypeName = "jsonb")]
    public string PricingJson { get; set; } = "[]";

    /// <summary>
    /// Approval workflow information as JSON
    /// </summary>
    [Column("approvals", TypeName = "jsonb")]
    public string ApprovalsJson { get; set; } = "[]";

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created the record
    /// </summary>
    [MaxLength(500)]
    [Column("created_by")]
    public string CreatedBy { get; set; } = "system";

    /// <summary>
    /// User who last updated the record
    /// </summary>
    [MaxLength(500)]
    [Column("updated_by")]
    public string UpdatedBy { get; set; } = "system";

    /// <summary>
    /// Cache synchronization timestamp (for Product Cache schema)
    /// </summary>
    [Column("synced_at")]
    public DateTime? SyncedAt { get; set; }

    /// <summary>
    /// Source version identifier for cache synchronization
    /// </summary>
    [MaxLength(50)]
    [Column("source_version")]
    public string? SourceVersion { get; set; }

    // ========================================
    // LEGACY/ADDITIONAL BUSINESS FIELDS
    // ========================================

    /// <summary>
    /// Product brand name
    /// </summary>
    [MaxLength(200)]
    [Column("brand")]
    public string? Brand { get; set; }

    /// <summary>
    /// Product manufacturer name
    /// </summary>
    [MaxLength(200)]
    [Column("manufacturer")]
    public string? Manufacturer { get; set; }

    /// <summary>
    /// Reference to product category (legacy field)
    /// </summary>
    [Column("category_id")]
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Indicates if product is active (legacy field)
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    // ========================================
    // APPROVAL WORKFLOW FIELDS
    // ========================================

    /// <summary>
    /// Marketing team approval status
    /// </summary>
    [Column("marketing_approved")]
    public bool MarketingApproved { get; set; } = false;

    /// <summary>
    /// User ID who approved marketing
    /// </summary>
    [Column("marketing_approved_by")]
    public int? MarketingApprovedBy { get; set; }

    /// <summary>
    /// Marketing approval timestamp
    /// </summary>
    [Column("marketing_approved_at")]
    public DateTime? MarketingApprovedAt { get; set; }

    /// <summary>
    /// Legal team approval status
    /// </summary>
    [Column("legal_approved")]
    public bool LegalApproved { get; set; } = false;

    /// <summary>
    /// User ID who approved legal
    /// </summary>
    [Column("legal_approved_by")]
    public int? LegalApprovedBy { get; set; }

    /// <summary>
    /// Legal approval timestamp
    /// </summary>
    [Column("legal_approved_at")]
    public DateTime? LegalApprovedAt { get; set; }

    /// <summary>
    /// Finance team approval status
    /// </summary>
    [Column("finance_approved")]
    public bool FinanceApproved { get; set; } = false;

    /// <summary>
    /// User ID who approved finance
    /// </summary>
    [Column("finance_approved_by")]
    public int? FinanceApprovedBy { get; set; }

    /// <summary>
    /// Finance approval timestamp
    /// </summary>
    [Column("finance_approved_at")]
    public DateTime? FinanceApprovedAt { get; set; }

    /// <summary>
    /// Sales operations team approval status
    /// </summary>
    [Column("salesops_approved")]
    public bool SalesopsApproved { get; set; } = false;

    /// <summary>
    /// User ID who approved sales operations
    /// </summary>
    [Column("salesops_approved_by")]
    public int? SalesopsApprovedBy { get; set; }

    /// <summary>
    /// Sales operations approval timestamp
    /// </summary>
    [Column("salesops_approved_at")]
    public DateTime? SalesopsApprovedAt { get; set; }

    /// <summary>
    /// Contracts team approval status
    /// </summary>
    [Column("contracts_approved")]
    public bool ContractsApproved { get; set; } = false;

    /// <summary>
    /// User ID who approved contracts
    /// </summary>
    [Column("contracts_approved_by")]
    public int? ContractsApprovedBy { get; set; }

    /// <summary>
    /// Contracts approval timestamp
    /// </summary>
    [Column("contracts_approved_at")]
    public DateTime? ContractsApprovedAt { get; set; }

    /// <summary>
    /// Flexible product attributes as JSONB (legacy)
    /// </summary>
    [Column("attributes", TypeName = "jsonb")]
    public string? AttributesJson { get; set; } = "{}";

    /// <summary>
    /// Product metadata as JSONB (legacy)
    /// </summary>
    [Column("metadata", TypeName = "jsonb")]
    public string? MetadataJson { get; set; } = "{}";

    /// <summary>
    /// User ID who launched the product
    /// </summary>
    [Column("launched_by")]
    public int? LaunchedBy { get; set; }

    /// <summary>
    /// Product launch timestamp
    /// </summary>
    [Column("launched_at")]
    public DateTime? LaunchedAt { get; set; }

    // Navigation properties for the JSON fields
    [NotMapped]
    public List<string> Categorization
    {
        get => string.IsNullOrEmpty(CategorizationJson) 
            ? new List<string>() 
            : JsonSerializer.Deserialize<List<string>>(CategorizationJson) ?? new List<string>();
        set => CategorizationJson = JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<PricingEntry> Pricing
    {
        get => string.IsNullOrEmpty(PricingJson)
            ? new List<PricingEntry>()
            : JsonSerializer.Deserialize<List<PricingEntry>>(PricingJson) ?? new List<PricingEntry>();
        set => PricingJson = JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<ApprovalEntry> Approvals
    {
        get => string.IsNullOrEmpty(ApprovalsJson)
            ? new List<ApprovalEntry>()
            : JsonSerializer.Deserialize<List<ApprovalEntry>>(ApprovalsJson) ?? new List<ApprovalEntry>();
        set => ApprovalsJson = JsonSerializer.Serialize(value);
    }

    /// <summary>
    /// Product attributes as a dictionary for easier access
    /// </summary>
    [NotMapped]
    public Dictionary<string, object> Attributes
    {
        get => string.IsNullOrEmpty(AttributesJson) || AttributesJson == "{}"
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(AttributesJson) ?? new Dictionary<string, object>();
        set => AttributesJson = JsonSerializer.Serialize(value);
    }

    /// <summary>
    /// Product metadata as a dictionary for easier access
    /// </summary>
    [NotMapped]
    public Dictionary<string, object> Metadata
    {
        get => string.IsNullOrEmpty(MetadataJson) || MetadataJson == "{}"
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(MetadataJson) ?? new Dictionary<string, object>();
        set => MetadataJson = JsonSerializer.Serialize(value);
    }

    // ========================================
    // BUSINESS LOGIC METHODS
    // ========================================

    /// <summary>
    /// Checks if all approval workflows are complete
    /// </summary>
    [NotMapped]
    public bool AllApprovalsComplete => MarketingApproved && LegalApproved && FinanceApproved && SalesopsApproved && ContractsApproved;

    /// <summary>
    /// Gets a list of pending approval areas
    /// </summary>
    [NotMapped]
    public List<string> PendingApprovals
    {
        get
        {
            var pending = new List<string>();
            if (!MarketingApproved) pending.Add("Marketing");
            if (!LegalApproved) pending.Add("Legal");
            if (!FinanceApproved) pending.Add("Finance");
            if (!SalesopsApproved) pending.Add("Sales Operations");
            if (!ContractsApproved) pending.Add("Contracts");
            return pending;
        }
    }

    /// <summary>
    /// Checks if the product is ready for launch (all approvals complete)
    /// </summary>
    [NotMapped]
    public bool ReadyForLaunch => AllApprovalsComplete && Status == "draft";

    /// <summary>
    /// Validates if the product is ready for activation
    /// </summary>
    public bool IsReadyForActivation()
    {
        return !string.IsNullOrWhiteSpace(Sku) &&
               !string.IsNullOrWhiteSpace(Name) &&
               !string.IsNullOrWhiteSpace(Description) &&
               Status != "archived";
    }

    /// <summary>
    /// Checks if this product has meaningful changes compared to another
    /// </summary>
    public bool HasSignificantChanges(Product other)
    {
        if (other == null) return true;

        return Name != other.Name ||
               Description != other.Description ||
               Type != other.Type ||
               BasePrice != other.BasePrice ||
               CostPrice != other.CostPrice ||
               WebDisplayFlag != other.WebDisplayFlag ||
               CanBeFulfilledFlag != other.CanBeFulfilledFlag ||
               ContractItemFlag != other.ContractItemFlag ||
               LicenseRequiredFlag != other.LicenseRequiredFlag ||
               SeatBasedPricingFlag != other.SeatBasedPricingFlag ||
               AvaTaxCode != other.AvaTaxCode ||
               Slug != other.Slug ||
               LongDescription != other.LongDescription ||
               AvailableFlag != other.AvailableFlag;
    }
}

/// <summary>
/// Represents a pricing entry for multi-currency support
/// </summary>
public class PricingEntry
{
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; } = 0m;
    public decimal OnlinePrice { get; set; } = 0m;
    public string PriceLevel { get; set; } = string.Empty;
}

/// <summary>
/// Represents an approval entry in the product workflow
/// </summary>
public class ApprovalEntry
{
    public string ApprovalType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime? ApprovedDate { get; set; }
    public string Comments { get; set; } = string.Empty;
}