using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Commerce.Services.Ecommerce.Api.Models;

/// <summary>
/// Ecommerce Product entity - consumer system for products from Product MDM
/// Optimized for e-commerce display and shopping cart operations
/// </summary>
[Table("products", Schema = "ecommerce")]
public class EcommerceProduct
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("sku")]
    [StringLength(255)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [Column("name")]
    [StringLength(500)]
    public string Name { get; set; } = string.Empty;

    [Column("display_name")]
    [StringLength(500)]
    public string? DisplayName { get; set; }

    [Column("short_description")]
    [StringLength(1000)]
    public string? ShortDescription { get; set; }

    [Column("long_description")]
    public string? LongDescription { get; set; }

    [Column("category_id")]
    public Guid? CategoryId { get; set; }

    [Column("slug")]
    [StringLength(255)]
    public string? Slug { get; set; }

    [Column("brand")]
    [StringLength(255)]
    public string? Brand { get; set; }

    [Column("tags", TypeName = "text[]")]
    public string[]? Tags { get; set; }

    [Column("specifications", TypeName = "jsonb")]
    public string? Specifications { get; set; } = "{}";

    [Column("features", TypeName = "text[]")]
    public string[]? Features { get; set; }

    [Column("primary_image_url")]
    public string? PrimaryImageUrl { get; set; }

    [Column("image_urls", TypeName = "text[]")]
    public string[]? ImageUrls { get; set; }

    [Column("video_url")]
    public string? VideoUrl { get; set; }

    [Column("document_urls", TypeName = "jsonb")]
    public string? DocumentUrls { get; set; } = "{}";

    [Column("stock_status")]
    [StringLength(50)]
    public string StockStatus { get; set; } = "in_stock";

    [Column("stock_quantity")]
    public int StockQuantity { get; set; } = 0;

    [Column("low_stock_threshold")]
    public int LowStockThreshold { get; set; } = 10;

    [Column("backorder_allowed")]
    public bool BackorderAllowed { get; set; } = false;

    [Column("expected_restock_date", TypeName = "date")]
    public DateOnly? ExpectedRestockDate { get; set; }

    [Column("weight")]
    [Precision(10, 3)]
    public decimal? Weight { get; set; }

    [Column("length")]
    [Precision(10, 2)]
    public decimal? Length { get; set; }

    [Column("width")]
    [Precision(10, 2)]
    public decimal? Width { get; set; }

    [Column("height")]
    [Precision(10, 2)]
    public decimal? Height { get; set; }

    [Column("dimension_unit")]
    [StringLength(10)]
    public string DimensionUnit { get; set; } = "cm";

    [Column("weight_unit")]
    [StringLength(10)]
    public string WeightUnit { get; set; } = "kg";

    [Column("search_keywords", TypeName = "text[]")]
    public string[]? SearchKeywords { get; set; }

    [Column("meta_title")]
    [StringLength(255)]
    public string? MetaTitle { get; set; }

    [Column("meta_description")]
    public string? MetaDescription { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = "active";

    [Column("launch_date", TypeName = "date")]
    public DateOnly? LaunchDate { get; set; }

    [Column("end_of_life_date", TypeName = "date")]
    public DateOnly? EndOfLifeDate { get; set; }

    [Column("rating_average")]
    [Precision(3, 2)]
    public decimal RatingAverage { get; set; } = 0.00m;

    [Column("rating_count")]
    public int RatingCount { get; set; } = 0;

    [Column("review_count")]
    public int ReviewCount { get; set; } = 0;

    [Column("view_count")]
    public int ViewCount { get; set; } = 0;

    [Column("source_system")]
    [StringLength(50)]
    public string SourceSystem { get; set; } = "product-mdm";

    [Column("last_sync_at")]
    public DateTime LastSyncAt { get; set; } = DateTime.UtcNow;

    [Column("sync_version")]
    public int SyncVersion { get; set; } = 1;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    [StringLength(255)]
    public string CreatedBy { get; set; } = "system";

    [Column("updated_by")]
    [StringLength(255)]
    public string UpdatedBy { get; set; } = "system";

    // Navigation property
    [ForeignKey("CategoryId")]
    public virtual EcommerceCategory? Category { get; set; }
}