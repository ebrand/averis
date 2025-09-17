using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// MarketSegment Entity - Represents sales channels (Direct, Partner, Reseller)
/// Maps to the averis_pricing.market_segments table in PostgreSQL
/// </summary>
[Table("market_segments", Schema = "averis_pricing")]
public class MarketSegment
{
    /// <summary>
    /// Unique identifier for the market segment
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Market segment code (e.g., DIRECT, PARTNER, RESELLER)
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Market segment display name
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Market segment description
    /// </summary>
    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Indicates if this market segment is active
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
    /// Navigation property to catalogs in this market segment
    /// </summary>
    public virtual ICollection<Catalog> Catalogs { get; set; } = new List<Catalog>();
}