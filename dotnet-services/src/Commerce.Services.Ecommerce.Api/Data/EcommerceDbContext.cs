using Microsoft.EntityFrameworkCore;
using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Data;

/// <summary>
/// Entity Framework DbContext for Ecommerce database operations
/// Connects to the ecommerce schema in PostgreSQL
/// Consumer system optimized for e-commerce display and shopping operations
/// </summary>
public class EcommerceDbContext : DbContext
{
    public EcommerceDbContext(DbContextOptions<EcommerceDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Products table - consumer copy of products optimized for e-commerce operations
    /// </summary>
    public DbSet<EcommerceProduct> Products { get; set; } = null!;

    /// <summary>
    /// Categories table - hierarchical product categorization
    /// </summary>
    public DbSet<EcommerceCategory> Categories { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure EcommerceProduct entity
        ConfigureEcommerceProductEntity(modelBuilder);

        // Configure EcommerceCategory entity
        ConfigureEcommerceCategoryEntity(modelBuilder);

        // Set default schema
        modelBuilder.HasDefaultSchema("averis_ecomm");
    }

    private static void ConfigureEcommerceProductEntity(ModelBuilder modelBuilder)
    {
        var productEntity = modelBuilder.Entity<EcommerceProduct>();

        // Configure table and schema
        productEntity.ToTable("products", "averis_ecomm");

        // Configure primary key
        productEntity.HasKey(p => p.Id);

        // Configure required fields
        productEntity.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(255);

        productEntity.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(500);

        // Configure unique constraints
        productEntity.HasIndex(p => p.Sku)
            .IsUnique()
            .HasDatabaseName("products_sku_key");

        productEntity.HasIndex(p => p.Slug)
            .IsUnique()
            .HasDatabaseName("products_slug_key");

        // Configure indexes for performance
        productEntity.HasIndex(p => p.Brand)
            .HasDatabaseName("idx_ecommerce_products_brand");

        productEntity.HasIndex(p => p.CategoryId)
            .HasDatabaseName("idx_ecommerce_products_category");

        productEntity.HasIndex(p => p.Status)
            .HasDatabaseName("idx_ecommerce_products_status");

        productEntity.HasIndex(p => p.StockStatus)
            .HasDatabaseName("idx_ecommerce_products_stock_status");

        productEntity.HasIndex(p => p.RatingAverage)
            .HasDatabaseName("idx_ecommerce_products_rating");

        // Configure array columns for PostgreSQL
        productEntity.Property(p => p.Tags)
            .HasColumnType("text[]");

        productEntity.Property(p => p.Features)
            .HasColumnType("text[]");

        productEntity.Property(p => p.ImageUrls)
            .HasColumnType("text[]");

        productEntity.Property(p => p.SearchKeywords)
            .HasColumnType("text[]");

        // Configure JSON columns
        productEntity.Property(p => p.Specifications)
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        productEntity.Property(p => p.DocumentUrls)
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        // Configure decimal precision
        productEntity.Property(p => p.Weight)
            .HasPrecision(10, 3);

        productEntity.Property(p => p.Length)
            .HasPrecision(10, 2);

        productEntity.Property(p => p.Width)
            .HasPrecision(10, 2);

        productEntity.Property(p => p.Height)
            .HasPrecision(10, 2);

        productEntity.Property(p => p.RatingAverage)
            .HasPrecision(3, 2);

        // Configure default values
        productEntity.Property(p => p.StockStatus)
            .HasDefaultValue("in_stock");

        productEntity.Property(p => p.StockQuantity)
            .HasDefaultValue(0);

        productEntity.Property(p => p.LowStockThreshold)
            .HasDefaultValue(10);

        productEntity.Property(p => p.BackorderAllowed)
            .HasDefaultValue(false);

        productEntity.Property(p => p.DimensionUnit)
            .HasDefaultValue("cm");

        productEntity.Property(p => p.WeightUnit)
            .HasDefaultValue("kg");

        productEntity.Property(p => p.Status)
            .HasDefaultValue("active");

        productEntity.Property(p => p.RatingAverage)
            .HasDefaultValue(0.00m);

        productEntity.Property(p => p.RatingCount)
            .HasDefaultValue(0);

        productEntity.Property(p => p.ReviewCount)
            .HasDefaultValue(0);

        productEntity.Property(p => p.ViewCount)
            .HasDefaultValue(0);

        productEntity.Property(p => p.SourceSystem)
            .HasDefaultValue("product-mdm");

        productEntity.Property(p => p.LastSyncAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        productEntity.Property(p => p.SyncVersion)
            .HasDefaultValue(1);

        productEntity.Property(p => p.IsActive)
            .HasDefaultValue(true);

        productEntity.Property(p => p.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        productEntity.Property(p => p.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        productEntity.Property(p => p.CreatedBy)
            .HasDefaultValue("system");

        productEntity.Property(p => p.UpdatedBy)
            .HasDefaultValue("system");

        // Configure relationship with Category
        productEntity.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureEcommerceCategoryEntity(ModelBuilder modelBuilder)
    {
        var categoryEntity = modelBuilder.Entity<EcommerceCategory>();

        // Configure table and schema
        categoryEntity.ToTable("categories", "averis_ecomm");

        // Configure primary key
        categoryEntity.HasKey(c => c.Id);

        // Configure required fields
        categoryEntity.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(255);

        categoryEntity.Property(c => c.Slug)
            .IsRequired()
            .HasMaxLength(255);

        // Configure unique constraints
        categoryEntity.HasIndex(c => c.Slug)
            .IsUnique()
            .HasDatabaseName("categories_slug_key");

        // Configure indexes
        categoryEntity.HasIndex(c => c.ParentId)
            .HasDatabaseName("idx_ecommerce_categories_parent");

        categoryEntity.HasIndex(c => c.Slug)
            .HasDatabaseName("idx_ecommerce_categories_slug");

        // Configure default values
        categoryEntity.Property(c => c.DisplayOrder)
            .HasDefaultValue(0);

        categoryEntity.Property(c => c.IsActive)
            .HasDefaultValue(true);

        categoryEntity.Property(c => c.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        categoryEntity.Property(c => c.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Configure self-referential relationship for hierarchy
        categoryEntity.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}