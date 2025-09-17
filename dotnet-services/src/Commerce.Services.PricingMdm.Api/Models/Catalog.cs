using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Catalog Entity - Represents a pricing catalog with region, market segment and currency
/// Maps to the averis_pricing.catalogs table in PostgreSQL
/// </summary>
[Table("catalogs", Schema = "averis_pricing")]
public class Catalog
{
    /// <summary>
    /// Unique identifier for the catalog
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique catalog code identifier
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Catalog display name
    /// </summary>
    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Region identifier for this catalog
    /// </summary>
    [Required]
    [Column("region_id")]
    public Guid RegionId { get; set; }

    /// <summary>
    /// Market segment identifier for this catalog
    /// </summary>
    [Required]
    [Column("market_segment_id")]
    public Guid MarketSegmentId { get; set; }

    /// <summary>
    /// Currency identifier for this catalog
    /// </summary>
    [Required]
    [Column("currency_id")]
    public Guid CurrencyId { get; set; }

    /// <summary>
    /// When this catalog becomes effective
    /// </summary>
    [Column("effective_from")]
    public DateTime? EffectiveFrom { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this catalog expires (null = no expiration)
    /// </summary>
    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    /// <summary>
    /// Catalog priority for conflict resolution
    /// </summary>
    [Column("priority")]
    public int Priority { get; set; } = 1;

    /// <summary>
    /// Catalog status: active, inactive, draft
    /// </summary>
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "active";

    /// <summary>
    /// Indicates if catalog is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Indicates if this is the default catalog for its region and market segment
    /// </summary>
    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

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
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the record
    /// </summary>
    [MaxLength(255)]
    [Column("updated_by")]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Navigation property for catalog products
    /// </summary>
    public virtual ICollection<CatalogProduct> CatalogProducts { get; set; } = new List<CatalogProduct>();

    /// <summary>
    /// Navigation property for base prices
    /// </summary>
    public virtual ICollection<BasePrice> BasePrices { get; set; } = new List<BasePrice>();

    /// <summary>
    /// Navigation property for region
    /// </summary>
    public virtual Region Region { get; set; } = null!;

    /// <summary>
    /// Navigation property for currency
    /// </summary>
    public virtual Currency Currency { get; set; } = null!;

    /// <summary>
    /// Navigation property for market segment
    /// </summary>
    public virtual MarketSegment MarketSegment { get; set; } = null!;

    /// <summary>
    /// Validates if the catalog is ready for activation
    /// </summary>
    public bool IsReadyForActivation()
    {
        return !string.IsNullOrWhiteSpace(Code) &&
               !string.IsNullOrWhiteSpace(Name) &&
               RegionId != Guid.Empty &&
               MarketSegmentId != Guid.Empty &&
               CurrencyId != Guid.Empty;
    }

    /// <summary>
    /// Checks if this catalog is currently effective
    /// </summary>
    public bool IsCurrentlyEffective()
    {
        var now = DateTime.UtcNow;
        return (EffectiveFrom == null || EffectiveFrom <= now) &&
               (EffectiveTo == null || EffectiveTo > now) &&
               IsActive &&
               Status == "active";
    }
}