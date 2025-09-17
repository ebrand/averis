using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.Shared.Data;

/// <summary>
/// Entity Framework DbContext for Customer MDM database operations
/// Connects to the customer_mdm schema in PostgreSQL for centralized user management
/// </summary>
public class CustomerMdmDbContext : DbContext
{
    public CustomerMdmDbContext(DbContextOptions<CustomerMdmDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Users table - centralized user management for all commerce applications
    /// </summary>
    public DbSet<User> Users { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity for customer_mdm schema
        ConfigureUserEntity(modelBuilder);
    }

    private static void ConfigureUserEntity(ModelBuilder modelBuilder)
    {
        var userEntity = modelBuilder.Entity<User>();

        // Configure table and schema - now using system schema for internal users
        userEntity.ToTable("users", "averis_system");

        // Configure primary key
        userEntity.HasKey(u => u.Id);

        // Configure indexes for performance and uniqueness
        userEntity.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ix_customer_mdm_users_email_unique");

        userEntity.HasIndex(u => u.StytchUserId)
            .IsUnique()
            .HasDatabaseName("ix_customer_mdm_users_stytch_user_id_unique");

        userEntity.HasIndex(u => u.Status)
            .HasDatabaseName("ix_customer_mdm_users_status");

        userEntity.HasIndex(u => u.LastLogin)
            .HasDatabaseName("ix_customer_mdm_users_last_login");

        userEntity.HasIndex(u => u.CreatedAt)
            .HasDatabaseName("ix_customer_mdm_users_created_at");

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

        // Configure array property for roles (PostgreSQL JSONB)
        userEntity.Property(u => u.Roles)
            .HasColumnType("jsonb")
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
        userEntity.HasCheckConstraint("CK_CustomerMdm_Users_Status_Valid", 
            "status IN ('active', 'inactive', 'pending', 'suspended')");

        userEntity.HasCheckConstraint("CK_CustomerMdm_Users_Email_Format",
            "email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'");

        // Ignore computed properties (they're not stored in database)
        userEntity.Ignore(u => u.DisplayName);
        userEntity.Ignore(u => u.IsActive);
        userEntity.Ignore(u => u.IsAdmin);
        userEntity.Ignore(u => u.ProductMdmRoles);
        userEntity.Ignore(u => u.CanApproveProducts);
        userEntity.Ignore(u => u.CanLaunchProducts);
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
            .Where(e => e.Entity is User && 
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            var user = (User)entityEntry.Entity;
            
            if (entityEntry.State == EntityState.Added)
                user.CreatedAt = DateTime.UtcNow;
            if (entityEntry.State == EntityState.Modified)
                user.UpdatedAt = DateTime.UtcNow;
        }
    }
}