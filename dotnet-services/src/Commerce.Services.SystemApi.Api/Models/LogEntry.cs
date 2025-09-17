using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.SystemApi.Api.Models;

/// <summary>
/// LogEntry entity for centralized log storage in the averis_system schema
/// Stores real-time logs from all services including workflow events
/// </summary>
[Table("log_entries", Schema = "averis_system")]
public class LogEntry
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("level")]
    [MaxLength(10)]
    public string Level { get; set; } = string.Empty;

    [Required]
    [Column("source")]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [Required]
    [Column("service")]
    [MaxLength(100)]
    public string Service { get; set; } = string.Empty;

    [Required]
    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("exception")]
    public string? Exception { get; set; }

    [Column("product_id")]
    public Guid? ProductId { get; set; }

    [Column("product_sku")]
    [MaxLength(255)]
    public string? ProductSku { get; set; }

    [Column("user_id")]
    [MaxLength(100)]
    public string? UserId { get; set; }

    [Column("correlation_id")]
    [MaxLength(100)]
    public string? CorrelationId { get; set; }

    [Required]
    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Log levels for the level column
/// </summary>
public static class LogLevels
{
    public const string Debug = "DEBUG";
    public const string Info = "INFO";
    public const string Warning = "WARNING";
    public const string Error = "ERROR";
    public const string Fatal = "FATAL";
}

/// <summary>
/// Common log sources for workflow tracking
/// </summary>
public static class LogSources
{
    public const string ProductMdmWorkflow = "ProductMdm.Workflow";
    public const string ProductMdmLaunch = "ProductMdm.Launch";
    public const string ProductMdmBusinessEvents = "ProductMdm.BusinessEvents";
    public const string ProductMdmPerformance = "ProductMdm.Performance";
    public const string ProductMdmError = "ProductMdm.Error";
}