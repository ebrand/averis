using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service interface for communicating with the dedicated Localization API
/// </summary>
public interface ILocalizationApiService
{
    /// <summary>
    /// Creates a localization workflow job using the dedicated Localization API
    /// </summary>
    Task<LocalizationWorkflowResponse> CreateLocalizationWorkflowAsync(CreateLocalizationWorkflowRequest request);

    /// <summary>
    /// Gets the status of a localization workflow job
    /// </summary>
    Task<LocalizationWorkflowStatusResponse> GetWorkflowStatusAsync(Guid workflowId);

    /// <summary>
    /// Gets all workflow jobs for monitoring
    /// </summary>
    Task<List<LocalizationWorkflowResponse>> GetWorkflowJobsAsync();
}

/// <summary>
/// Request model for creating localization workflows
/// </summary>
public class CreateLocalizationWorkflowRequest
{
    public string JobName { get; set; } = string.Empty;
    public Guid CatalogId { get; set; }
    public List<Guid> ProductIds { get; set; } = new();
    public string FromLocale { get; set; } = string.Empty;
    public string ToLocale { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public object? JobData { get; set; }
}

/// <summary>
/// Response model for localization workflow operations
/// </summary>
public class LocalizationWorkflowResponse
{
    public Guid Id { get; set; }
    public string JobName { get; set; } = string.Empty;
    public Guid CatalogId { get; set; }
    public string FromLocale { get; set; } = string.Empty;
    public string ToLocale { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? CurrentStep { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? WorkerId { get; set; }
}

/// <summary>
/// Response model for workflow status queries
/// </summary>
public class LocalizationWorkflowStatusResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? CurrentStep { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? WorkerId { get; set; }
}