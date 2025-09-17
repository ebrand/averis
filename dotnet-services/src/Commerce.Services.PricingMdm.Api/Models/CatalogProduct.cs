using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// CatalogProduct Entity - Junction table linking catalogs to products
/// Maps to the averis_pricing.catalog_products table in PostgreSQL
/// </summary>
[Table("catalog_products", Schema = "averis_pricing")]
public class CatalogProduct
{
    /// <summary>
    /// Unique identifier for the catalog-product relationship
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
    /// Indicates if this catalog-product relationship is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Override price for this product in this catalog (null = use base price)
    /// </summary>
    [Column("override_price")]
    public decimal? OverridePrice { get; set; }

    /// <summary>
    /// Discount percentage applied to base price (0-100)
    /// </summary>
    [Column("discount_percentage")]
    public decimal DiscountPercentage { get; set; } = 0;

    /// <summary>
    /// Product SKU (cached from Product Staging API for local access)
    /// </summary>
    [MaxLength(100)]
    [Column("sku")]
    public string? Sku { get; set; }

    /// <summary>
    /// Base price (cached from Product Staging API for local calculations)
    /// </summary>
    [Column("base_price")]
    public decimal? BasePrice { get; set; }

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
    /// Locale workflow status (pending, in_progress, completed, failed, skipped)
    /// </summary>
    [Column("locale_workflow_status")]
    public string? LocaleWorkflowStatus { get; set; } = "pending";

    /// <summary>
    /// Content workflow status (pending, in_progress, completed, failed, skipped)
    /// </summary>
    [Column("content_workflow_status")]
    public string? ContentWorkflowStatus { get; set; } = "pending";

    /// <summary>
    /// Array of selected locale IDs for this product workflow
    /// </summary>
    [Column("selected_locales")]
    public string[]? SelectedLocales { get; set; }

    /// <summary>
    /// User who initiated the workflow
    /// </summary>
    [Column("workflow_initiated_by")]
    public string? WorkflowInitiatedBy { get; set; }

    /// <summary>
    /// Timestamp when workflow was initiated
    /// </summary>
    [Column("workflow_initiated_at")]
    public DateTime? WorkflowInitiatedAt { get; set; }

    /// <summary>
    /// Timestamp when workflow was completed
    /// </summary>
    [Column("workflow_completed_at")]
    public DateTime? WorkflowCompletedAt { get; set; }

    /// <summary>
    /// Navigation property to Catalog
    /// </summary>
    [ForeignKey(nameof(CatalogId))]
    public virtual Catalog? Catalog { get; set; }

    // Navigation property to Product removed for microservices architecture
    // Product data is now retrieved via HTTP API calls to Product Staging service


    /// <summary>
    /// Validates if the catalog-product relationship is valid
    /// </summary>
    public bool IsValid()
    {
        return CatalogId != Guid.Empty && ProductId != Guid.Empty;
    }
}