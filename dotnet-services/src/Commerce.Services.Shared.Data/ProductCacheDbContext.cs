using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.Shared.Data;

/// <summary>
/// Database context for Product Cache schema
/// Read-optimized separate database for active products only
/// Decoupled from Product MDM for independent scalability
/// </summary>
public class ProductCacheDbContext : DbContext
{
    public ProductCacheDbContext(DbContextOptions<ProductCacheDbContext> options) : base(options)
    {
    }

    // Product cache tables - optimized for read performance
    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure schema for product_cache
        modelBuilder.HasDefaultSchema("product_cache");

        // Product entity configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products", "product_cache");
            entity.HasKey(e => e.Id);

            // Primary identifiers
            entity.Property(e => e.Sku)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasMaxLength(2000);

            entity.Property(e => e.LongDescription)
                .HasColumnType("text");

            // Business attributes
            entity.Property(e => e.Type)
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("draft");


            entity.Property(e => e.Slug)
                .HasMaxLength(500);

            entity.Property(e => e.AvaTaxCode)
                .HasMaxLength(50);

            // Financial columns with precision
            entity.Property(e => e.BasePrice)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);

            entity.Property(e => e.CostPrice)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);

            // Boolean flags
            entity.Property(e => e.AvailableFlag)
                .HasDefaultValue(false);

            entity.Property(e => e.WebDisplayFlag)
                .HasDefaultValue(false);

            entity.Property(e => e.LicenseRequiredFlag)
                .HasDefaultValue(false);

            entity.Property(e => e.SeatBasedPricingFlag)
                .HasDefaultValue(false);

            entity.Property(e => e.CanBeFulfilledFlag)
                .HasDefaultValue(false);

            entity.Property(e => e.ContractItemFlag)
                .HasDefaultValue(false);

            // JSONB columns for flexible data
            entity.Property(e => e.Categorization)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(e => e.Pricing)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<PricingEntry>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<PricingEntry>());

            entity.Property(e => e.Approvals)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<ApprovalEntry>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<ApprovalEntry>());

            // Audit columns
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(200)
                .IsRequired();

            // Cache-specific columns
            entity.Property(e => e.SyncedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.SourceVersion)
                .HasMaxLength(50);

            // Indexes for performance
            entity.HasIndex(e => e.Sku)
                .IsUnique()
                .HasDatabaseName("idx_product_cache_sku");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("idx_product_cache_status");

            entity.HasIndex(e => e.Type)
                .HasDatabaseName("idx_product_cache_type");

            entity.HasIndex(e => e.AvailableFlag)
                .HasDatabaseName("idx_product_cache_available");

            entity.HasIndex(e => e.WebDisplayFlag)
                .HasDatabaseName("idx_product_cache_web_display");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("idx_product_cache_created_at");

            entity.HasIndex(e => e.SyncedAt)
                .HasDatabaseName("idx_product_cache_synced_at");

            // Constraint: only active products allowed in cache
            entity.HasCheckConstraint("chk_product_cache_active_only", "status = 'active'");
        });

        // Category entity configuration (lightweight for cache)
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories", "product_cache");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.ParentId);

            entity.Property(e => e.Level)
                .HasDefaultValue(1);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Audit columns
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Self-referencing relationship for hierarchy
            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for category hierarchy queries
            entity.HasIndex(e => e.ParentId)
                .HasDatabaseName("idx_product_cache_category_parent");

            entity.HasIndex(e => e.Level)
                .HasDatabaseName("idx_product_cache_category_level");
        });

        base.OnModelCreating(modelBuilder);
    }
}