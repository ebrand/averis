using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;
using System.Text.Json;

namespace Commerce.Services.Shared.Data;

/// <summary>
/// Entity Framework DbContext for Customer operations
/// Connects to the averis_customer schema in PostgreSQL for customer relationship management
/// </summary>
public class CustomerDbContext : DbContext
{
    public CustomerDbContext(DbContextOptions<CustomerDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Customers table - customer relationship management for commerce applications
    /// </summary>
    public DbSet<Customer> Customers { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Customer entity for averis_customer schema
        ConfigureCustomerEntity(modelBuilder);
    }

    private static void ConfigureCustomerEntity(ModelBuilder modelBuilder)
    {
        var customerEntity = modelBuilder.Entity<Customer>();

        // Configure table and schema
        customerEntity.ToTable("customers", "averis_customer");

        // Configure primary key
        customerEntity.HasKey(c => c.Id);

        // Configure indexes for performance and uniqueness (matching actual database)
        customerEntity.HasIndex(c => c.Email)
            .HasDatabaseName("idx_averis_customer_customers_email");

        customerEntity.HasIndex(c => c.StytchUserId)
            .IsUnique()
            .HasDatabaseName("customers_stytch_user_id_key");

        customerEntity.HasIndex(c => c.CustomerNumber)
            .IsUnique()
            .HasDatabaseName("customers_customer_number_key");

        // Configure properties with proper column names matching actual database schema
        customerEntity.Property(c => c.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        customerEntity.Property(c => c.StytchUserId)
            .HasColumnName("stytch_user_id")
            .HasMaxLength(255);

        customerEntity.Property(c => c.CustomerNumber)
            .HasColumnName("customer_number")
            .HasMaxLength(50);

        customerEntity.Property(c => c.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(100);

        customerEntity.Property(c => c.LastName)
            .HasColumnName("last_name")
            .HasMaxLength(100);

        customerEntity.Property(c => c.Email)
            .HasColumnName("email")
            .HasMaxLength(255);

        customerEntity.Property(c => c.Phone)
            .HasColumnName("phone")
            .HasMaxLength(50);

        customerEntity.Property(c => c.CompanyName)
            .HasColumnName("company_name")
            .HasMaxLength(200);

        customerEntity.Property(c => c.DisclosureLevel)
            .HasColumnName("disclosure_level")
            .HasMaxLength(20)
            .HasDefaultValue("cold");

        customerEntity.Property(c => c.CustomerData)
            .HasColumnName("customer_data")
            .HasColumnType("jsonb")
            .HasDefaultValue(JsonDocument.Parse("{}"));

        customerEntity.Property(c => c.Preferences)
            .HasColumnName("preferences")
            .HasColumnType("jsonb")
            .HasDefaultValue(JsonDocument.Parse("{}"));

        customerEntity.Property(c => c.Status)
            .HasColumnName("status")
            .HasMaxLength(50)
            .HasDefaultValue("active");

        customerEntity.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        customerEntity.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Add check constraints for data integrity (matching actual database)
        customerEntity.HasCheckConstraint("customers_disclosure_level_check", 
            "disclosure_level IN ('cold', 'warm', 'hot')");

        customerEntity.HasCheckConstraint("customers_status_check",
            "status IN ('active', 'inactive', 'suspended')");

        // Ignore computed properties (they're not stored in database)
        customerEntity.Ignore(c => c.DisplayName);
        customerEntity.Ignore(c => c.IsActive);
        customerEntity.Ignore(c => c.IsHighValue);
        customerEntity.Ignore(c => c.IsColdCustomer);
        customerEntity.Ignore(c => c.IsWarmCustomer);
        customerEntity.Ignore(c => c.IsHotCustomer);
        customerEntity.Ignore(c => c.CustomerSegment);
        customerEntity.Ignore(c => c.LifetimeValue);
        customerEntity.Ignore(c => c.EmailVerified);
        customerEntity.Ignore(c => c.LastActivity);
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
            .Where(e => e.Entity is Customer && 
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            var customer = (Customer)entityEntry.Entity;
            
            if (entityEntry.State == EntityState.Added)
                customer.CreatedAt = DateTime.UtcNow;
            if (entityEntry.State == EntityState.Modified)
                customer.UpdatedAt = DateTime.UtcNow;
        }
    }
}