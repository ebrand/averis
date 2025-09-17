using System;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// DTO for workflow jobs from the database
/// </summary>
public class WorkflowJobDto
{
    public Guid Id { get; set; }
    public string JobName { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public int FailedItems { get; set; }
    public int ProgressPercentage { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? CatalogCode { get; set; }
    public string? ProductSkus { get; set; }
    public string? LocaleCodes { get; set; }
}