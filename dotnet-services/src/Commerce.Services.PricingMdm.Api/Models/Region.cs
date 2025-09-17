using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Region Entity - Represents geographic regions (AMER, EMEA, APAC)
/// Maps to the averis_pricing.regions table in PostgreSQL
/// </summary>
[Table("regions", Schema = "averis_pricing")]
public class Region
{
    /// <summary>
    /// Unique identifier for the region
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Region code (e.g., AMER, EMEA, APAC)
    /// </summary>
    [Required]
    [MaxLength(10)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Region display name
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Region description
    /// </summary>
    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Default currency for this region
    /// </summary>
    [Column("default_currency_id")]
    public Guid? DefaultCurrencyId { get; set; }

    /// <summary>
    /// Indicates if this region is active
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
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the record
    /// </summary>
    [MaxLength(255)]
    [Column("updated_by")]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Navigation property to catalogs in this region
    /// </summary>
    public virtual ICollection<Catalog> Catalogs { get; set; } = new List<Catalog>();

    /// <summary>
    /// Navigation property to locales in this region
    /// </summary>
    public virtual ICollection<Locale> Locales { get; set; } = new List<Locale>();

    /// <summary>
    /// Navigation property to countries in this region
    /// </summary>
    public virtual ICollection<Country> Countries { get; set; } = new List<Country>();

    /// <summary>
    /// Navigation property to the default currency
    /// </summary>
    public virtual Currency? DefaultCurrency { get; set; }
}