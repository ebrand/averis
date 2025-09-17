using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Data;

/// <summary>
/// Entity Framework DbContext for Pricing MDM operations
/// </summary>
public class PricingDbContext : DbContext
{
    public PricingDbContext(DbContextOptions<PricingDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Catalogs table
    /// </summary>
    public DbSet<Catalog> Catalogs { get; set; } = null!;

    /// <summary>
    /// Catalog Products junction table
    /// </summary>
    public DbSet<CatalogProduct> CatalogProducts { get; set; } = null!;

    /// <summary>
    /// Base Prices table
    /// </summary>
    public DbSet<BasePrice> BasePrices { get; set; } = null!;

    /// <summary>
    /// Regions table
    /// </summary>
    public DbSet<Region> Regions { get; set; } = null!;

    /// <summary>
    /// Market Segments table
    /// </summary>
    public DbSet<MarketSegment> MarketSegments { get; set; } = null!;

    /// <summary>
    /// Currencies table
    /// </summary>
    public DbSet<Currency> Currencies { get; set; } = null!;

    /// <summary>
    /// Locales table
    /// </summary>
    public DbSet<Locale> Locales { get; set; } = null!;

    /// <summary>
    /// Countries table
    /// </summary>
    public DbSet<Country> Countries { get; set; } = null!;

    /// <summary>
    /// Country Compliance table
    /// </summary>
    public DbSet<CountryCompliance> CountryCompliance { get; set; } = null!;

    /// <summary>
    /// IP Country Ranges table
    /// </summary>
    public DbSet<IpCountryRange> IpCountryRanges { get; set; } = null!;

    /// <summary>
    /// User Locale Preferences table
    /// </summary>
    public DbSet<UserLocalePreference> UserLocalePreferences { get; set; } = null!;

    /// <summary>
    /// Products table
    /// </summary>
    // Products DbSet removed - handled by Product Staging API in microservices architecture

    /// <summary>
    /// Product Locale Financials table
    /// </summary>
    public DbSet<ProductLocaleFinancial> ProductLocaleFinancials { get; set; } = null!;

    /// <summary>
    /// Product Contents table
    /// </summary>
    public DbSet<ProductContent> ProductContents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Catalog entity
        modelBuilder.Entity<Catalog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => new { e.RegionId, e.MarketSegmentId }).IsUnique();
            
            entity.Property(e => e.Status)
                .HasConversion<string>();
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure relationships
            entity.HasMany(e => e.CatalogProducts)
                .WithOne(cp => cp.Catalog)
                .HasForeignKey(cp => cp.CatalogId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.BasePrices)
                .WithOne(bp => bp.Catalog)
                .HasForeignKey(bp => bp.CatalogId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure CatalogProduct entity
        modelBuilder.Entity<CatalogProduct>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CatalogId, e.ProductId }).IsUnique();
            entity.HasIndex(e => e.CatalogId);
            entity.HasIndex(e => e.ProductId);
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure BasePrice entity
        modelBuilder.Entity<BasePrice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CatalogId, e.ProductId, e.EffectiveFrom }).IsUnique();
            entity.HasIndex(e => new { e.EffectiveFrom, e.EffectiveTo });
            
            entity.Property(e => e.ListPrice)
                .HasPrecision(15, 4);
            
            entity.Property(e => e.CostPrice)
                .HasPrecision(15, 4);
            
            entity.Property(e => e.MarginPercentage)
                .HasPrecision(5, 2);
            
            entity.Property(e => e.Status)
                .HasConversion<string>();
            
            entity.Property(e => e.ApprovalStatus)
                .HasConversion<string>();
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure Locale entity
        modelBuilder.Entity<Locale>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => new { e.RegionId, e.Code }).IsUnique();
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure relationships
            entity.HasOne(e => e.Region)
                .WithMany(r => r.Locales)
                .HasForeignKey(e => e.RegionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Currency)
                .WithMany(c => c.Locales)
                .HasForeignKey(e => e.CurrencyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Region entity relationships
        modelBuilder.Entity<Region>(entity =>
        {
            entity.HasOne(e => e.DefaultCurrency)
                .WithMany(c => c.RegionsUsingAsDefault)
                .HasForeignKey(e => e.DefaultCurrencyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Countries)
                .WithOne(c => c.Region)
                .HasForeignKey(c => c.RegionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Country entity
        modelBuilder.Entity<Country>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.DefaultLocale)
                .WithMany()
                .HasForeignKey(e => e.DefaultLocaleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Locales)
                .WithOne(l => l.Country)
                .HasForeignKey(l => l.CountryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ComplianceProfile)
                .WithOne(cp => cp.Country)
                .HasForeignKey<CountryCompliance>(cp => cp.CountryCode)
                .HasPrincipalKey<Country>(c => c.Code)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure CountryCompliance entity
        modelBuilder.Entity<CountryCompliance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CountryCode).IsUnique();
            
            entity.Property(e => e.ComplianceRiskLevel)
                .HasConversion<string>();
            
            entity.Property(e => e.ScreeningThresholdAmount)
                .HasPrecision(15, 4);
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure IpCountryRange entity
        modelBuilder.Entity<IpCountryRange>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CountryCode, e.IpStart, e.IpEnd });
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Country)
                .WithMany()
                .HasForeignKey(e => e.CountryCode)
                .HasPrincipalKey(c => c.Code)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure UserLocalePreference entity
        modelBuilder.Entity<UserLocalePreference>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.IsActive });
            entity.HasIndex(e => e.SessionId);
            
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.DetectedCountry)
                .WithMany()
                .HasForeignKey(e => e.DetectedCountryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ChosenCountry)
                .WithMany()
                .HasForeignKey(e => e.ChosenCountryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ChosenLocale)
                .WithMany()
                .HasForeignKey(e => e.ChosenLocaleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ShoppingCountry)
                .WithMany()
                .HasForeignKey(e => e.ShoppingCountryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ShippingCountry)
                .WithMany()
                .HasForeignKey(e => e.ShippingCountryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.BillingCountry)
                .WithMany()
                .HasForeignKey(e => e.BillingCountryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Product entity removed - handled by Product Staging API in microservices architecture
        // Products are retrieved via HTTP API calls, not database relationships

        // Configure ProductLocaleFinancial entity
        modelBuilder.Entity<ProductLocaleFinancial>(entity =>
        {
            entity.ToTable("product_locale_financials", "averis_pricing");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProductId, e.LocaleId, e.CatalogId }).IsUnique();
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.LocaleId);
            entity.HasIndex(e => e.CatalogId);
            entity.HasIndex(e => new { e.EffectiveFrom, e.EffectiveTo });

            // Map Pascal case properties to snake case columns
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.LocaleId).HasColumnName("locale_id");
            entity.Property(e => e.CatalogId).HasColumnName("catalog_id");
            // BasePrice and BaseCost properties are not mapped to database columns as they don't exist in the table
            entity.Ignore(e => e.BasePrice);
            entity.Ignore(e => e.BaseCost);
            
            // Map only the columns that actually exist in the database table
            entity.Property(e => e.CurrencyConversionRate).HasColumnName("currency_conversion_rate")
                .HasPrecision(15, 8);
            entity.Property(e => e.ConversionDate).HasColumnName("conversion_date");
            entity.Property(e => e.LocalPrice).HasColumnName("local_price")
                .HasPrecision(15, 4);
            entity.Property(e => e.TaxRate).HasColumnName("tax_rate")
                .HasPrecision(8, 4);
            entity.Property(e => e.TaxAmount).HasColumnName("tax_amount")
                .HasPrecision(15, 4);
            entity.Property(e => e.TaxIncludedPrice).HasColumnName("tax_included_price")
                .HasPrecision(15, 4);
            entity.Property(e => e.RegulatoryFees).HasColumnName("regulatory_fees")
                .HasPrecision(15, 4);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Properties not mapped to database columns (these exist in model but not in table):
            entity.Ignore(e => e.LocalCost);
            entity.Ignore(e => e.EnvironmentalFees);
            entity.Ignore(e => e.PriceRoundingRules);
            entity.Ignore(e => e.DisplayFormat);
            entity.Ignore(e => e.PromotionalPrice);
            entity.Ignore(e => e.PromotionStartDate);
            entity.Ignore(e => e.PromotionEndDate);
            entity.Ignore(e => e.EffectiveFrom);
            entity.Ignore(e => e.EffectiveTo);
            entity.Ignore(e => e.CreatedBy);
            entity.Ignore(e => e.UpdatedBy);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Locale)
                .WithMany()
                .HasForeignKey(e => e.LocaleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Catalog)
                .WithMany()
                .HasForeignKey(e => e.CatalogId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure ProductContent entity
        modelBuilder.Entity<ProductContent>(entity =>
        {
            entity.ToTable("product_locale_content", "averis_pricing");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ProductId, e.LocaleId }).IsUnique();
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.LocaleId);
            
            // Map Pascal case properties to snake case columns
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.LocaleId).HasColumnName("locale_id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ShortDescription).HasColumnName("short_description");
            entity.Property(e => e.MarketingCopy).HasColumnName("marketing_copy");
            entity.Property(e => e.TechnicalSpecs).HasColumnName("technical_specs");
            entity.Property(e => e.Features).HasColumnName("features");
            entity.Property(e => e.Benefits).HasColumnName("benefits");
            entity.Property(e => e.MetaTitle).HasColumnName("meta_title");
            entity.Property(e => e.MetaDescription).HasColumnName("meta_description");
            entity.Property(e => e.Keywords).HasColumnName("keywords");
            entity.Property(e => e.ContentVersion).HasColumnName("content_version");
            entity.Property(e => e.ReviewedBy).HasColumnName("reviewed_by");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.TranslationStatus).HasColumnName("translation_status");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Locale)
                .WithMany()
                .HasForeignKey(e => e.LocaleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    /// <summary>
    /// Override SaveChanges to automatically update UpdatedAt timestamps
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically update UpdatedAt timestamps
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Updates CreatedAt and UpdatedAt timestamps for added and modified entities
    /// </summary>
    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        var utcNow = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

        foreach (var entry in entries)
        {
            // First, fix any DateTime properties that aren't UTC
            foreach (var property in entry.Properties)
            {
                if (property.CurrentValue is DateTime dateTime && dateTime.Kind != DateTimeKind.Utc)
                {
                    property.CurrentValue = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
                }
            }
            
            // Then handle specific entity timestamp updates
            if (entry.Entity is Catalog catalog)
            {
                if (entry.State == EntityState.Added) catalog.CreatedAt = utcNow;
                catalog.UpdatedAt = utcNow;
            }
            else if (entry.Entity is CatalogProduct catalogProduct)
            {
                if (entry.State == EntityState.Added) catalogProduct.CreatedAt = utcNow;
                catalogProduct.UpdatedAt = utcNow;
            }
            else if (entry.Entity is BasePrice basePrice)
            {
                if (entry.State == EntityState.Added) basePrice.CreatedAt = utcNow;
                basePrice.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Region region)
            {
                if (entry.State == EntityState.Added) region.CreatedAt = utcNow;
                region.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Currency currency)
            {
                if (entry.State == EntityState.Added) currency.CreatedAt = utcNow;
                currency.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Locale locale)
            {
                if (entry.State == EntityState.Added) locale.CreatedAt = utcNow;
                locale.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Country country)
            {
                if (entry.State == EntityState.Added) country.CreatedAt = utcNow;
                country.UpdatedAt = utcNow;
            }
            else if (entry.Entity is CountryCompliance countryCompliance)
            {
                if (entry.State == EntityState.Added) countryCompliance.CreatedAt = utcNow;
                countryCompliance.UpdatedAt = utcNow;
            }
            else if (entry.Entity is IpCountryRange ipCountryRange)
            {
                if (entry.State == EntityState.Added) ipCountryRange.CreatedAt = utcNow;
                ipCountryRange.UpdatedAt = utcNow;
            }
            else if (entry.Entity is UserLocalePreference userLocalePreference)
            {
                if (entry.State == EntityState.Added) userLocalePreference.CreatedAt = utcNow;
                userLocalePreference.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Product product)
            {
                if (entry.State == EntityState.Added) product.CreatedAt = utcNow;
                product.UpdatedAt = utcNow;
            }
            else if (entry.Entity is ProductLocaleFinancial productLocaleFinancial)
            {
                if (entry.State == EntityState.Added) productLocaleFinancial.CreatedAt = utcNow;
                productLocaleFinancial.UpdatedAt = utcNow;
            }
            else if (entry.Entity is ProductContent productContent)
            {
                if (entry.State == EntityState.Added) productContent.CreatedAt = utcNow;
                productContent.UpdatedAt = utcNow;
                
                // Ensure ApprovedAt is UTC if set
                if (productContent.ApprovedAt.HasValue && productContent.ApprovedAt.Value.Kind != DateTimeKind.Utc)
                {
                    productContent.ApprovedAt = DateTime.SpecifyKind(productContent.ApprovedAt.Value, DateTimeKind.Utc);
                }
            }
        }
    }
}