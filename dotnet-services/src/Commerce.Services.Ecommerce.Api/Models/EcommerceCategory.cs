using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.Ecommerce.Api.Models;

/// <summary>
/// Ecommerce Category entity for organizing products
/// </summary>
[Table("categories", Schema = "ecommerce")]
public class EcommerceCategory
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("parent_id")]
    public Guid? ParentId { get; set; }

    [Required]
    [Column("slug")]
    [StringLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;

    [Column("meta_title")]
    [StringLength(255)]
    public string? MetaTitle { get; set; }

    [Column("meta_description")]
    public string? MetaDescription { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ParentId")]
    public virtual EcommerceCategory? Parent { get; set; }

    public virtual ICollection<EcommerceCategory> Children { get; set; } = new List<EcommerceCategory>();
    public virtual ICollection<EcommerceProduct> Products { get; set; } = new List<EcommerceProduct>();
}