using Microsoft.EntityFrameworkCore;
using Commerce.Services.Localization.Api.Models;

namespace Commerce.Services.Localization.Api.Data;

/// <summary>
/// Entity Framework DbContext for the Localization service
/// </summary>
public class LocalizationDbContext : DbContext
{
    public LocalizationDbContext(DbContextOptions<LocalizationDbContext> options) : base(options)
    {
    }

    public DbSet<LocalizationWorkflow> LocalizationWorkflows { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure LocalizationWorkflow entity
        modelBuilder.Entity<LocalizationWorkflow>(entity =>
        {
            entity.ToTable("localization_workflows", "averis_pricing");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.JobName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("pending");

            entity.Property(e => e.FromLocale)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.ToLocale)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.ProgressPercentage)
                .HasDefaultValue(0);

            entity.Property(e => e.CurrentStep)
                .HasMaxLength(200);

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(1000);

            entity.Property(e => e.JobData)
                .HasColumnType("jsonb");

            entity.Property(e => e.Results)
                .HasColumnType("jsonb");

            // Indexes for performance
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.WorkerId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Status, e.CreatedAt });
        });
    }
}