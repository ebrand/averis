using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.ProductStaging.Api.Data;

/// <summary>
/// Product Staging Database Context
/// Uses the 'averis_product_staging' schema to access staged product data for consumer systems
/// </summary>
public class ProductStagingDbContext : DbContext
{
    public ProductStagingDbContext(DbContextOptions<ProductStagingDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Products table - staged product data from the Product MDM system
    /// </summary>
    public DbSet<Product> Products { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Product entity for staging schema
        ConfigureProductEntity(modelBuilder);
    }

    private static void ConfigureProductEntity(ModelBuilder modelBuilder)
    {
        var productEntity = modelBuilder.Entity<Product>();

        // Configure table and schema - use averis_product_staging schema (where ingest service writes)
        productEntity.ToTable("products", "averis_product_staging");

        // Configure primary key
        productEntity.HasKey(p => p.Id);

        // Configure indexes for performance
        productEntity.HasIndex(p => p.Sku)
            .IsUnique()
            .HasDatabaseName("ix_products_sku_unique");

        productEntity.HasIndex(p => p.Name)
            .HasDatabaseName("ix_products_name");

        productEntity.HasIndex(p => p.Status)
            .HasDatabaseName("ix_products_status");

        productEntity.HasIndex(p => p.Type)
            .HasDatabaseName("ix_products_type");

        productEntity.HasIndex(p => p.AvailableFlag)
            .HasDatabaseName("ix_products_available_flag");

        productEntity.HasIndex(p => p.WebDisplayFlag)
            .HasDatabaseName("ix_products_web_display_flag");

        productEntity.HasIndex(p => p.CreatedAt)
            .HasDatabaseName("ix_products_created_at");

        productEntity.HasIndex(p => p.UpdatedAt)
            .HasDatabaseName("ix_products_updated_at");

        // Configure decimal precision for prices
        productEntity.Property(p => p.BasePrice)
            .HasPrecision(10, 4);

        productEntity.Property(p => p.CostPrice)
            .HasPrecision(10, 4);

        // Configure JSONB columns for PostgreSQL
        productEntity.Property(p => p.CategorizationJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("[]");

        productEntity.Property(p => p.PricingJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("[]");

        productEntity.Property(p => p.ApprovalsJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("[]");

        // Configure string length constraints
        productEntity.Property(p => p.Sku)
            .HasMaxLength(100)
            .IsRequired();

        productEntity.Property(p => p.Name)
            .HasMaxLength(500)
            .IsRequired();

        productEntity.Property(p => p.Description)
            .HasMaxLength(2000)
            .IsRequired();

        productEntity.Property(p => p.Type)
            .HasMaxLength(100);

        productEntity.Property(p => p.AvaTaxCode)
            .HasMaxLength(50);

        productEntity.Property(p => p.Slug)
            .HasMaxLength(200);

        productEntity.Property(p => p.Status)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("draft");

        productEntity.Property(p => p.CreatedBy)
            .HasMaxLength(500)
            .HasDefaultValue("system");

        productEntity.Property(p => p.UpdatedBy)
            .HasMaxLength(500)
            .HasDefaultValue("system");

        // Configure default values for boolean flags
        productEntity.Property(p => p.LicenseRequiredFlag)
            .HasDefaultValue(false);

        productEntity.Property(p => p.SeatBasedPricingFlag)
            .HasDefaultValue(false);

        productEntity.Property(p => p.WebDisplayFlag)
            .HasDefaultValue(false);

        productEntity.Property(p => p.CanBeFulfilledFlag)
            .HasDefaultValue(false);

        productEntity.Property(p => p.ContractItemFlag)
            .HasDefaultValue(false);

        productEntity.Property(p => p.AvailableFlag)
            .HasDefaultValue(true);

        // Configure timestamp defaults (PostgreSQL will handle these)
        productEntity.Property(p => p.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        productEntity.Property(p => p.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Configure decimal defaults
        productEntity.Property(p => p.BasePrice)
            .HasDefaultValue(0m);

        productEntity.Property(p => p.CostPrice)
            .HasDefaultValue(0m);

        // Add check constraints for data integrity
        productEntity.HasCheckConstraint("CK_Products_BasePrice_NonNegative", "base_price >= 0");
        productEntity.HasCheckConstraint("CK_Products_CostPrice_NonNegative", "cost_price >= 0");
        productEntity.HasCheckConstraint("CK_Products_Status_Valid", 
            "status IN ('draft', 'active', 'deprecated', 'archived')");

        // Configure value conversions for the navigation properties
        // This ensures the JSON serialization/deserialization works correctly
        productEntity.Ignore(p => p.Categorization);
        productEntity.Ignore(p => p.Pricing);  
        productEntity.Ignore(p => p.Approvals);

        // Ignore approval workflow columns - these don't exist in the staging schema
        productEntity.Ignore(p => p.MarketingApproved);
        productEntity.Ignore(p => p.MarketingApprovedBy);
        productEntity.Ignore(p => p.MarketingApprovedAt);
        productEntity.Ignore(p => p.LegalApproved);
        productEntity.Ignore(p => p.LegalApprovedBy);
        productEntity.Ignore(p => p.LegalApprovedAt);
        productEntity.Ignore(p => p.FinanceApproved);
        productEntity.Ignore(p => p.FinanceApprovedBy);
        productEntity.Ignore(p => p.FinanceApprovedAt);
        productEntity.Ignore(p => p.SalesopsApproved);
        productEntity.Ignore(p => p.SalesopsApprovedBy);
        productEntity.Ignore(p => p.SalesopsApprovedAt);
        productEntity.Ignore(p => p.ContractsApproved);
        productEntity.Ignore(p => p.ContractsApprovedBy);
        productEntity.Ignore(p => p.ContractsApprovedAt);
        productEntity.Ignore(p => p.LaunchedBy);
        productEntity.Ignore(p => p.LaunchedAt);

        // Ignore computed properties that don't map to database columns
        productEntity.Ignore(p => p.AllApprovalsComplete);
        productEntity.Ignore(p => p.PendingApprovals);
        productEntity.Ignore(p => p.ReadyForLaunch);

        // Configure JSONB properties that DO exist in staging schema
        productEntity.Property(p => p.AttributesJson)
            .HasColumnName("attributes")
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        productEntity.Property(p => p.MetadataJson)
            .HasColumnName("metadata")
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        // Ignore computed properties for attributes/metadata
        productEntity.Ignore(p => p.Attributes);
        productEntity.Ignore(p => p.Metadata);

        // Include Product Cache-specific properties since we're reading from product_cache schema
        productEntity.Property(p => p.SyncedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        productEntity.Property(p => p.SourceVersion)
            .HasMaxLength(50)
            .HasDefaultValue("1.0");
    }
}