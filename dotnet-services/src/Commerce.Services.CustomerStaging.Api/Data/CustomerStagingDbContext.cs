using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Models.Entities;
using System.Text.Json;

namespace Commerce.Services.CustomerStaging.Api.Data;

/// <summary>
/// Entity Framework DbContext for Customer Staging operations
/// Connects to the averis_customer_staging schema in PostgreSQL for customer analytics and comparison
/// </summary>
public class CustomerStagingDbContext : DbContext
{
    public CustomerStagingDbContext(DbContextOptions<CustomerStagingDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Customers table - customer staging data for analytics and comparison
    /// </summary>
    public DbSet<Customer> Customers { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Customer entity for averis_customer_staging schema
        ConfigureCustomerEntity(modelBuilder);
    }

    private static void ConfigureCustomerEntity(ModelBuilder modelBuilder)
    {
        var customerEntity = modelBuilder.Entity<Customer>();

        // Configure table and schema - Use staging schema instead of production
        customerEntity.ToTable("customers", "averis_customer_staging");

        // Configure primary key
        customerEntity.HasKey(c => c.Id);

        // Configure indexes for performance and uniqueness
        customerEntity.HasIndex(c => c.Email)
            .HasDatabaseName("idx_averis_customer_staging_customers_email");

        customerEntity.HasIndex(c => c.StytchUserId)
            .IsUnique()
            .HasDatabaseName("staging_customers_stytch_user_id_key");

        customerEntity.HasIndex(c => c.VisitorCookie)
            .IsUnique()
            .HasDatabaseName("staging_customers_visitor_cookie_key");

        customerEntity.HasIndex(c => c.DisclosureLevel)
            .HasDatabaseName("idx_averis_customer_staging_customers_disclosure");

        customerEntity.HasIndex(c => c.Status)
            .HasDatabaseName("idx_averis_customer_staging_customers_status");

        // Configure properties with proper column names and constraints
        customerEntity.Property(c => c.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("uuid_generate_v4()");

        customerEntity.Property(c => c.DisclosureLevel)
            .HasColumnName("disclosure_level")
            .HasMaxLength(20)
            .HasDefaultValue("cold");

        customerEntity.Property(c => c.VisitorFlag)
            .HasColumnName("visitor_flag")
            .HasDefaultValue(true);

        customerEntity.Property(c => c.VisitorCookie)
            .HasColumnName("visitor_cookie")
            .HasMaxLength(255);

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

        customerEntity.Property(c => c.StytchUserId)
            .HasColumnName("stytch_user_id")
            .HasMaxLength(255);

        customerEntity.Property(c => c.EmailVerified)
            .HasColumnName("email_verified")
            .HasDefaultValue(false);

        customerEntity.Property(c => c.CustomerSegment)
            .HasColumnName("customer_segment")
            .HasMaxLength(50);

        customerEntity.Property(c => c.LifetimeValue)
            .HasColumnName("lifetime_value")
            .HasPrecision(15, 2)
            .HasDefaultValue(0.00m);

        customerEntity.Property(c => c.AcquisitionChannel)
            .HasColumnName("acquisition_channel")
            .HasMaxLength(100);

        customerEntity.Property(c => c.MarketingConsent)
            .HasColumnName("marketing_consent")
            .HasDefaultValue(false);

        customerEntity.Property(c => c.DataProcessingConsent)
            .HasColumnName("data_processing_consent")
            .HasDefaultValue(false);

        customerEntity.Property(c => c.ConsentDate)
            .HasColumnName("consent_date");

        customerEntity.Property(c => c.Status)
            .HasColumnName("status")
            .HasMaxLength(50)
            .HasDefaultValue("active");

        customerEntity.Property(c => c.FirstPurchaseDate)
            .HasColumnName("first_purchase_date");

        customerEntity.Property(c => c.LastActivity)
            .HasColumnName("last_activity")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        customerEntity.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        customerEntity.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Configure JSONB properties with column names
        customerEntity.Property(c => c.SessionData)
            .HasColumnName("session_data")
            .HasColumnType("jsonb")
            .HasDefaultValue(JsonDocument.Parse("{}"));

        customerEntity.Property(c => c.BillingAddress)
            .HasColumnName("billing_address")
            .HasColumnType("jsonb");

        customerEntity.Property(c => c.ShippingAddresses)
            .HasColumnName("shipping_addresses")
            .HasColumnType("jsonb")
            .HasDefaultValue(JsonDocument.Parse("[]"));

        // Add check constraints for data integrity
        customerEntity.HasCheckConstraint("staging_customers_disclosure_level_check", 
            "disclosure_level IN ('cold', 'warm', 'hot')");

        customerEntity.HasCheckConstraint("staging_customers_status_check",
            "status IN ('active', 'inactive', 'suspended', 'deleted')");

        // Ignore computed properties (they're not stored in database)
        customerEntity.Ignore(c => c.DisplayName);
        customerEntity.Ignore(c => c.IsActive);
        customerEntity.Ignore(c => c.IsHighValue);
        customerEntity.Ignore(c => c.IsColdCustomer);
        customerEntity.Ignore(c => c.IsWarmCustomer);
        customerEntity.Ignore(c => c.IsHotCustomer);
    }
}