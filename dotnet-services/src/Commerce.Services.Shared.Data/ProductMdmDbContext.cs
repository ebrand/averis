using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.Shared.Data;

/// <summary>
/// Entity Framework DbContext for Product MDM database operations
/// Connects to the product_mdm schema in PostgreSQL
/// </summary>
public class ProductMdmDbContext : DbContext
{
    public ProductMdmDbContext(DbContextOptions<ProductMdmDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Products table - the system-of-record for all product data
    /// </summary>
    public DbSet<Product> Products { get; set; } = null!;

    /// <summary>
    /// Users table - manages user accounts and role-based access control
    /// </summary>
    public DbSet<User> Users { get; set; } = null!;

    /// <summary>
    /// Data Dictionary table - metadata for product schema definitions
    /// Controls form rendering, validation rules, and field display properties
    /// </summary>
    public DbSet<DataDictionary> DataDictionary { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Product entity
        ConfigureProductEntity(modelBuilder);

        // Configure User entity
        ConfigureUserEntity(modelBuilder);

        // Configure DataDictionary entity
        ConfigureDataDictionaryEntity(modelBuilder);
    }

    private static void ConfigureProductEntity(ModelBuilder modelBuilder)
    {
        var productEntity = modelBuilder.Entity<Product>();

        // Configure table and schema
        productEntity.ToTable("products", "averis_product");

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
        productEntity.Ignore(p => p.Attributes);
        productEntity.Ignore(p => p.Metadata);
        
        // Ignore computed business logic properties
        productEntity.Ignore(p => p.AllApprovalsComplete);
        productEntity.Ignore(p => p.PendingApprovals);
        productEntity.Ignore(p => p.ReadyForLaunch);
    }

    private static void ConfigureUserEntity(ModelBuilder modelBuilder)
    {
        var userEntity = modelBuilder.Entity<User>();

        // Configure table and schema
        userEntity.ToTable("users", "averis_product");

        // Configure primary key
        userEntity.HasKey(u => u.Id);

        // Configure indexes for performance and uniqueness
        userEntity.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ix_users_email_unique");

        userEntity.HasIndex(u => u.StytchUserId)
            .IsUnique()
            .HasDatabaseName("ix_users_stytch_user_id_unique");

        userEntity.HasIndex(u => u.Status)
            .HasDatabaseName("ix_users_status");

        userEntity.HasIndex(u => u.LastLogin)
            .HasDatabaseName("ix_users_last_login");

        userEntity.HasIndex(u => u.CreatedAt)
            .HasDatabaseName("ix_users_created_at");

        // Configure string properties with proper lengths and requirements
        userEntity.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        userEntity.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        userEntity.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        userEntity.Property(u => u.StytchUserId)
            .HasMaxLength(255);

        userEntity.Property(u => u.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("active");

        userEntity.Property(u => u.CreatedBy)
            .HasMaxLength(100);

        userEntity.Property(u => u.UpdatedBy)
            .HasMaxLength(100);

        // Configure array property for roles (PostgreSQL text array)
        userEntity.Property(u => u.Roles)
            .HasColumnType("text[]")
            .IsRequired();

        // Configure JSONB property for preferences
        userEntity.Property(u => u.PreferencesJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        // Configure timestamp properties with defaults
        userEntity.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        userEntity.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Add check constraints for data integrity
        userEntity.HasCheckConstraint("CK_Users_Status_Valid", 
            "status IN ('active', 'inactive', 'pending', 'suspended')");

        userEntity.HasCheckConstraint("CK_Users_Email_Format",
            "email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'");

        // Ignore computed properties (they're not stored in database)
        userEntity.Ignore(u => u.DisplayName);
        userEntity.Ignore(u => u.IsActive);
        userEntity.Ignore(u => u.IsAdmin);
        userEntity.Ignore(u => u.ProductMdmRoles);
        userEntity.Ignore(u => u.CanApproveProducts);
        userEntity.Ignore(u => u.CanLaunchProducts);
    }

    private static void ConfigureDataDictionaryEntity(ModelBuilder modelBuilder)
    {
        var dataDictionaryEntity = modelBuilder.Entity<DataDictionary>();

        // Configure table and schema - data_dictionary is centralized in averis_system schema
        dataDictionaryEntity.ToTable("data_dictionary", "averis_system");

        // Configure primary key
        dataDictionaryEntity.HasKey(d => d.Id);

        // Configure indexes for performance
        dataDictionaryEntity.HasIndex(d => d.ColumnName)
            .IsUnique()
            .HasDatabaseName("ix_data_dictionary_column_name_unique");

        dataDictionaryEntity.HasIndex(d => d.Category)
            .HasDatabaseName("ix_data_dictionary_category");

        dataDictionaryEntity.HasIndex(d => d.MaintenanceRole)
            .HasDatabaseName("ix_data_dictionary_maintenance_role");

        dataDictionaryEntity.HasIndex(d => d.SortOrder)
            .HasDatabaseName("ix_data_dictionary_sort_order");

        // Configure JSONB column for allowed values (PostgreSQL) with value conversion
        dataDictionaryEntity.Property(d => d.AllowedValues)
            .HasColumnType("jsonb")
            .HasConversion(
                v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => v == null ? null : System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null));

        // Configure string length constraints
        dataDictionaryEntity.Property(d => d.ColumnName)
            .HasMaxLength(255)
            .IsRequired();

        dataDictionaryEntity.Property(d => d.DisplayName)
            .HasMaxLength(255)
            .IsRequired();

        dataDictionaryEntity.Property(d => d.DataType)
            .HasMaxLength(50)
            .IsRequired();

        dataDictionaryEntity.Property(d => d.Category)
            .HasMaxLength(100)
            .IsRequired();

        dataDictionaryEntity.Property(d => d.MaintenanceRole)
            .HasMaxLength(50)
            .HasDefaultValue("system");

        dataDictionaryEntity.Property(d => d.CreatedBy)
            .HasMaxLength(255)
            .HasDefaultValue("system");

        dataDictionaryEntity.Property(d => d.UpdatedBy)
            .HasMaxLength(255)
            .HasDefaultValue("system");

        // Configure default values for boolean fields
        dataDictionaryEntity.Property(d => d.RequiredForActive)
            .HasDefaultValue(false);

        dataDictionaryEntity.Property(d => d.InProductMdm)
            .HasDefaultValue(false);

        dataDictionaryEntity.Property(d => d.InPricingMdm)
            .HasDefaultValue(false);

        dataDictionaryEntity.Property(d => d.InEcommerce)
            .HasDefaultValue(false);

        dataDictionaryEntity.Property(d => d.IsSystemField)
            .HasDefaultValue(false);

        dataDictionaryEntity.Property(d => d.IsEditable)
            .HasDefaultValue(true);

        dataDictionaryEntity.Property(d => d.SortOrder)
            .HasDefaultValue(0);

        // Configure timestamp defaults
        dataDictionaryEntity.Property(d => d.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        dataDictionaryEntity.Property(d => d.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }

    /// <summary>
    /// Override SaveChanges to automatically update UpdatedAt timestamp
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically update UpdatedAt timestamp
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Automatically update timestamps for modified entities
    /// </summary>
    private void UpdateTimestamps()
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => (e.Entity is Product || e.Entity is User || e.Entity is DataDictionary) && 
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            switch (entityEntry.Entity)
            {
                case Product product:
                    if (entityEntry.State == EntityState.Added)
                        product.CreatedAt = DateTime.UtcNow;
                    if (entityEntry.State == EntityState.Modified)
                        product.UpdatedAt = DateTime.UtcNow;
                    break;
                    
                case User user:
                    if (entityEntry.State == EntityState.Added)
                        user.CreatedAt = DateTime.UtcNow;
                    if (entityEntry.State == EntityState.Modified)
                        user.UpdatedAt = DateTime.UtcNow;
                    break;
                    
                case DataDictionary dataDictionary:
                    if (entityEntry.State == EntityState.Added)
                        dataDictionary.CreatedAt = DateTime.UtcNow;
                    if (entityEntry.State == EntityState.Modified)
                        dataDictionary.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
    }
}