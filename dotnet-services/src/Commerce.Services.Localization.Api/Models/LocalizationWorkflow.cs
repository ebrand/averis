using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.Localization.Api.Models;

/// <summary>
/// Represents a localization workflow job in the database
/// </summary>
[Table("localization_workflows", Schema = "averis_pricing")]
public class LocalizationWorkflow
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    public string JobName { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "pending"; // pending, running, completed, failed

    [StringLength(50)]
    public string? JobType { get; set; } // translation, currency_conversion

    /// <summary>
    /// GUID of the worker assigned to this job
    /// </summary>
    public Guid? WorkerId { get; set; }

    [Required]
    public Guid CatalogId { get; set; }

    [Required]
    [StringLength(10)]
    public string FromLocale { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string ToLocale { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int ProgressPercentage { get; set; } = 0;

    [StringLength(200)]
    public string? CurrentStep { get; set; }

    [StringLength(1000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// JSON containing job metadata and parameters
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? JobData { get; set; }

    /// <summary>
    /// JSON containing job results after completion
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Results { get; set; }
}

/// <summary>
/// DTO for creating a new localization job
/// </summary>
public class CreateLocalizationJobRequest
{
    [Required]
    public string JobName { get; set; } = string.Empty;

    [Required]
    public Guid CatalogId { get; set; }

    [Required]
    [StringLength(10)]
    public string FromLocale { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string ToLocale { get; set; } = string.Empty;

    [Required]
    public string CreatedBy { get; set; } = string.Empty;

    [StringLength(50)]
    public string? JobType { get; set; } // translation, currency_conversion

    public Dictionary<string, object>? JobData { get; set; }
}

/// <summary>
/// DTO for job status updates
/// </summary>
public class JobStatusUpdate
{
    public Guid JobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? CurrentStep { get; set; }
    public string? ErrorMessage { get; set; }
}