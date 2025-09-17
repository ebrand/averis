namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// DTO for available locale information
/// </summary>
public class AvailableLocaleDto
{
    public Guid LocaleId { get; set; }
    public string LocaleCode { get; set; } = string.Empty;
    public string LocaleName { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int Priority { get; set; }
}

/// <summary>
/// Request DTO for calculating locale-specific financials
/// </summary>
public class CalculateLocaleFinancialsRequest
{
    public List<Guid> LocaleIds { get; set; } = new();
    public bool AutoApprove { get; set; } = false;
    public string? InitiatedBy { get; set; }
    public Dictionary<string, object> Configuration { get; set; } = new();
}

/// <summary>
/// Request DTO for generating multi-language content
/// </summary>
public class GenerateMultiLanguageContentRequest
{
    public string SourceLocaleCode { get; set; } = "en_US";
    public List<string> TargetLocaleCodes { get; set; } = new();
    public string TranslationQuality { get; set; } = "standard"; // standard, high, premium
    public bool RequireReview { get; set; } = true;
    public string? InitiatedBy { get; set; }
    public Dictionary<string, object> Configuration { get; set; } = new();
}

/// <summary>
/// Response DTO for locale workflow operations
/// </summary>
public class LocaleWorkflowResponse
{
    public Guid WorkflowJobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<Guid> ProcessedLocales { get; set; } = new();
    public List<Guid> FailedLocales { get; set; } = new();
    public string Message { get; set; } = string.Empty;
    public DateTime EstimatedCompletion { get; set; }
}

/// <summary>
/// Response DTO for content workflow operations
/// </summary>
public class ContentWorkflowResponse
{
    public Guid WorkflowJobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<string> GeneratedLanguages { get; set; } = new();
    public List<string> FailedLanguages { get; set; } = new();
    public string Message { get; set; } = string.Empty;
    public DateTime EstimatedCompletion { get; set; }
}

/// <summary>
/// Response DTO for workflow progress
/// </summary>
public class WorkflowProgressResponse
{
    public Guid CatalogProductId { get; set; }
    public string LocaleWorkflowStatus { get; set; } = string.Empty;
    public string ContentWorkflowStatus { get; set; } = string.Empty;
    public List<WorkflowProgressItem> LocaleProgress { get; set; } = new();
    public List<WorkflowProgressItem> ContentProgress { get; set; } = new();
    public double OverallProgress { get; set; }
}

/// <summary>
/// DTO for individual workflow progress items
/// </summary>
public class WorkflowProgressItem
{
    public Guid Id { get; set; }
    public string LocaleCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string? ErrorMessage { get; set; }
    public double? QualityScore { get; set; }
    public bool RequiresReview { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// DTO for workflow templates
/// </summary>
public class WorkflowTemplateDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string TemplateType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> SupportedLocales { get; set; } = new();
    public Dictionary<string, object> DefaultConfig { get; set; } = new();
    public bool IsSystemTemplate { get; set; }
    public int EstimatedSecondsPerItem { get; set; }
}

/// <summary>
/// Request DTO for creating batch workflows
/// </summary>
public class CreateBatchWorkflowRequest
{
    public string JobName { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty; // locale_financials, multi_language_content, full_localization
    public Guid CatalogId { get; set; }
    public List<Guid> ProductIds { get; set; } = new();
    public List<Guid> LocaleIds { get; set; } = new();
    public Guid? TemplateId { get; set; }
    public Dictionary<string, object> JobConfig { get; set; } = new();
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for batch workflow creation
/// </summary>
public class BatchWorkflowResponse
{
    public Guid JobId { get; set; }
    public string JobName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public DateTime EstimatedCompletion { get; set; }
    public string Message { get; set; } = string.Empty;
}