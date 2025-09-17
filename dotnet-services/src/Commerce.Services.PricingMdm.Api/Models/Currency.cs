using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Currency Entity - Represents currencies (USD, EUR, GBP, etc.)
/// Maps to the averis_pricing.currencies table in PostgreSQL
/// </summary>
[Table("currencies", Schema = "averis_pricing")]
public class Currency
{
    /// <summary>
    /// Unique identifier for the currency
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Currency code (e.g., USD, EUR, GBP)
    /// </summary>
    [Required]
    [MaxLength(3)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Currency display name
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Currency symbol (e.g., $, €, £)
    /// </summary>
    [MaxLength(10)]
    [Column("symbol")]
    public string? Symbol { get; set; }

    /// <summary>
    /// Number of decimal places for this currency
    /// </summary>
    [Column("decimal_places")]
    public int DecimalPlaces { get; set; } = 2;

    /// <summary>
    /// Indicates if this currency is active
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
    /// Navigation property to catalogs using this currency
    /// </summary>
    public virtual ICollection<Catalog> Catalogs { get; set; } = new List<Catalog>();

    /// <summary>
    /// Navigation property to locales using this currency
    /// </summary>
    public virtual ICollection<Locale> Locales { get; set; } = new List<Locale>();

    /// <summary>
    /// Navigation property to regions using this as default currency
    /// </summary>
    public virtual ICollection<Region> RegionsUsingAsDefault { get; set; } = new List<Region>();
}