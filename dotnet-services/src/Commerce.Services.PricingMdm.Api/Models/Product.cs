using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Product entity model - References products from the averis_product schema
/// Maps to the averis_product.products table in PostgreSQL
/// </summary>
[Table("products", Schema = "averis_product")]
public class Product
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [MaxLength(255)]
    [Column("sku")]
    public string Sku { get; set; } = string.Empty;
    
    [MaxLength(500)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("description")]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "draft";
    
    [Column("is_active")]
    public bool IsActive { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    [Column("created_by")]
    public string? CreatedBy { get; set; }
    
    [MaxLength(255)]
    [Column("updated_by")]
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual ICollection<CatalogProduct> CatalogProducts { get; set; } = new List<CatalogProduct>();
    public virtual ICollection<BasePrice> BasePrices { get; set; } = new List<BasePrice>();
}