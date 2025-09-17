using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// BasePrice Entity - Represents catalog-specific product pricing
/// Maps to the averis_pricing.base_prices table in PostgreSQL
/// </summary>
[Table("base_prices", Schema = "averis_pricing")]
public class BasePrice
{
    /// <summary>
    /// Unique identifier for the base price
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Catalog identifier
    /// </summary>
    [Required]
    [Column("catalog_id")]
    public Guid CatalogId { get; set; }

    /// <summary>
    /// Product identifier
    /// </summary>
    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// List price for the product in this catalog
    /// </summary>
    [Required]
    [Column("list_price", TypeName = "numeric(15,4)")]
    public decimal ListPrice { get; set; }

    /// <summary>
    /// Cost price for the product (optional)
    /// </summary>
    [Column("cost_price", TypeName = "numeric(15,4)")]
    public decimal? CostPrice { get; set; }

    /// <summary>
    /// Margin percentage (calculated or override)
    /// </summary>
    [Column("margin_percentage", TypeName = "numeric(5,2)")]
    public decimal? MarginPercentage { get; set; }

    /// <summary>
    /// Minimum quantity for this price tier
    /// </summary>
    [Column("min_quantity")]
    public int MinQuantity { get; set; } = 1;

    /// <summary>
    /// Maximum quantity for this price tier (null = no limit)
    /// </summary>
    [Column("max_quantity")]
    public int? MaxQuantity { get; set; }

    /// <summary>
    /// When this price becomes effective
    /// </summary>
    [Column("effective_from")]
    public DateTime? EffectiveFrom { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this price expires (null = no expiration)
    /// </summary>
    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    /// <summary>
    /// Price status: active, inactive, pending_approval
    /// </summary>
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "active";

    /// <summary>
    /// Approval status: draft, pending, approved, rejected
    /// </summary>
    [MaxLength(50)]
    [Column("approval_status")]
    public string ApprovalStatus { get; set; } = "draft";

    /// <summary>
    /// User who approved this price
    /// </summary>
    [MaxLength(255)]
    [Column("approved_by")]
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// When this price was approved
    /// </summary>
    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// Indicates if this price is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

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
    [MaxLength(255)]
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// User who last updated the record
    /// </summary>
    [MaxLength(255)]
    [Column("updated_by")]
    public string UpdatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to Catalog
    /// </summary>
    [ForeignKey(nameof(CatalogId))]
    public virtual Catalog? Catalog { get; set; }

    /// <summary>
    /// Navigation property to Product
    /// </summary>
    [ForeignKey(nameof(ProductId))]
    public virtual Product? Product { get; set; }

    /// <summary>
    /// Alias for ListPrice to match legacy code expectations
    /// </summary>
    [NotMapped]
    public decimal Price => ListPrice;

    /// <summary>
    /// Validates if the base price is valid
    /// </summary>
    public bool IsValid()
    {
        return CatalogId != Guid.Empty && 
               ProductId != Guid.Empty && 
               ListPrice > 0 &&
               MinQuantity > 0 &&
               (MaxQuantity == null || MaxQuantity > MinQuantity);
    }

    /// <summary>
    /// Checks if this price is currently effective
    /// </summary>
    public bool IsCurrentlyEffective()
    {
        var now = DateTime.UtcNow;
        return (EffectiveFrom == null || EffectiveFrom <= now) &&
               (EffectiveTo == null || EffectiveTo > now) &&
               IsActive &&
               Status == "active" &&
               ApprovalStatus == "approved";
    }

    /// <summary>
    /// Calculates margin percentage if cost price is available
    /// </summary>
    public decimal? CalculateMarginPercentage()
    {
        if (CostPrice == null || CostPrice <= 0) return null;
        return ((ListPrice - CostPrice.Value) / ListPrice) * 100;
    }
}