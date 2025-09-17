using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.Shared.Models.Entities;

/// <summary>
/// Category Entity - Product categorization hierarchy
/// Supports multi-level hierarchical categories with self-referencing relationships
/// </summary>
[Table("categories", Schema = "product_mdm")]
public class Category
{
    /// <summary>
    /// Unique identifier for the category
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Category name
    /// </summary>
    [Required]
    [MaxLength(200)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Category description
    /// </summary>
    [MaxLength(1000)]
    [Column("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Parent category ID for hierarchy
    /// </summary>
    [Column("parent_id")]
    public Guid? ParentId { get; set; }

    /// <summary>
    /// Hierarchy level (1 = top level, 2 = second level, etc.)
    /// </summary>
    [Column("level")]
    public int Level { get; set; } = 1;

    /// <summary>
    /// Whether this category is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When the category was created
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the category was last updated
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    /// <summary>
    /// Parent category reference
    /// </summary>
    [ForeignKey(nameof(ParentId))]
    public virtual Category? Parent { get; set; }

    /// <summary>
    /// Child categories collection
    /// </summary>
    public virtual ICollection<Category> Children { get; set; } = new List<Category>();
}