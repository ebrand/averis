using Commerce.Services.SystemApi.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Commerce.Services.SystemApi.Api.Data;

/// <summary>
/// Database context for the Averis System API
/// Handles centralized system functions including message logging
/// </summary>
public class SystemDbContext : DbContext
{
    public SystemDbContext(DbContextOptions<SystemDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Messages table for centralized message logging
    /// </summary>
    public DbSet<Message> Messages { get; set; }

    /// <summary>
    /// Log entries table for centralized log storage
    /// </summary>
    public DbSet<Models.LogEntry> LogEntries { get; set; }

    /// <summary>
    /// Users table for system user management
    /// </summary>
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure the Message entity
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Add check constraint for message_type
            entity.HasCheckConstraint("CK_messages_message_type", 
                "message_type IN ('published', 'consumed')");

            // Configure indexes for actual database columns only
            entity.HasIndex(e => e.MessageType);
            entity.HasIndex(e => e.SourceSystem);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.MessageType, e.SourceSystem, e.CreatedAt });

            // Configure JSONB column
            entity.Property(e => e.PayloadJson)
                .HasColumnType("jsonb");

            // Configure timestamp columns
            entity.Property(e => e.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.ProcessedAt)
                .HasColumnType("timestamp with time zone");
        });

        // Configure the LogEntry entity
        modelBuilder.Entity<Models.LogEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Configure indexes for efficient querying
            entity.HasIndex(e => e.Level);
            entity.HasIndex(e => e.Service);
            entity.HasIndex(e => e.Source);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => new { e.Service, e.Level, e.Timestamp });
            entity.HasIndex(e => new { e.Source, e.Timestamp });

            // Configure timestamp columns
            entity.Property(e => e.Timestamp)
                .HasColumnType("timestamp with time zone");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("NOW()");
        });

        // Configure the User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Configure indexes for efficient querying
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.StytchUserId).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);

            // Configure timestamp columns
            entity.Property(e => e.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("NOW()");

            entity.Property(e => e.LastLoginAt)
                .HasColumnType("timestamp with time zone");

            // Configure JSONB column for roles
            entity.Property(e => e.RolesJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[]");
        });
    }

    /// <summary>
    /// Override SaveChanges to automatically update the UpdatedAt timestamp
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically update the UpdatedAt timestamp
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var messageEntries = ChangeTracker.Entries<Message>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in messageEntries)
        {
            // For messages, we don't have an UpdatedAt field in the new schema
            // ProcessedAt is set when the message is actually processed
        }

        var userEntries = ChangeTracker.Entries<User>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in userEntries)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}