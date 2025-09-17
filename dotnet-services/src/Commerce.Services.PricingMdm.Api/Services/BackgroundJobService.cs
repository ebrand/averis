using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Background job types for pricing calculations and content generation
/// </summary>
public enum JobType
{
    CalculateLocaleFinancials,
    GenerateMultiLanguageContent,
    RefreshCurrencyRates,
    UpdateComplianceScreening,
    RecalculateCatalogPricing
}

/// <summary>
/// Background job status tracking
/// </summary>
public enum JobStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Background job data model
/// </summary>
public class BackgroundJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public JobType Type { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Pending;
    public string EntityId { get; set; } = string.Empty; // Product ID, Catalog ID, etc.
    public string EntityType { get; set; } = string.Empty; // "Product", "Catalog", etc.
    public JsonDocument? Parameters { get; set; }
    public string? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; } = 0;
    public int MaxRetries { get; set; } = 3;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public TimeSpan? Duration { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public Guid? WorkflowJobId { get; set; } // Link to database workflow job
    public Guid? CatalogProductId { get; set; } // Link to catalog product for status updates
}

/// <summary>
/// Job queue interface for background processing
/// </summary>
public interface IBackgroundJobQueue
{
    Task<Guid> EnqueueAsync(JobType type, string entityId, string entityType, object? parameters = null, string createdBy = "system", Guid? workflowJobId = null, Guid? catalogProductId = null);
    Task<BackgroundJob?> DequeueAsync(CancellationToken cancellationToken);
    Task UpdateJobStatusAsync(Guid jobId, JobStatus status, string? result = null, string? errorMessage = null);
    Task<List<BackgroundJob>> GetJobsByEntityAsync(string entityId, string entityType);
    Task<List<BackgroundJob>> GetJobHistoryAsync(int limit = 50);
    Task<BackgroundJob?> GetJobAsync(Guid jobId);
}

/// <summary>
/// In-memory implementation of background job queue
/// In production, this would be replaced with Redis, RabbitMQ, or Azure Service Bus
/// </summary>
public class InMemoryBackgroundJobQueue : IBackgroundJobQueue
{
    private readonly Queue<BackgroundJob> _jobs = new();
    private readonly Dictionary<Guid, BackgroundJob> _jobStorage = new();
    private readonly SemaphoreSlim _signal = new(0);
    private readonly ILogger<InMemoryBackgroundJobQueue> _logger;

    public InMemoryBackgroundJobQueue(ILogger<InMemoryBackgroundJobQueue> logger)
    {
        _logger = logger;
    }

    public async Task<Guid> EnqueueAsync(JobType type, string entityId, string entityType, object? parameters = null, string createdBy = "system", Guid? workflowJobId = null, Guid? catalogProductId = null)
    {
        var job = new BackgroundJob
        {
            Type = type,
            EntityId = entityId,
            EntityType = entityType,
            Parameters = parameters != null ? JsonSerializer.SerializeToDocument(parameters) : null,
            CreatedBy = createdBy,
            WorkflowJobId = workflowJobId,
            CatalogProductId = catalogProductId
        };

        lock (_jobs)
        {
            _jobs.Enqueue(job);
            _jobStorage[job.Id] = job;
        }

        _logger.LogInformation("Enqueued job {JobId} of type {JobType} for {EntityType} {EntityId}", 
            job.Id, type, entityType, entityId);

        _signal.Release();
        return await Task.FromResult(job.Id);
    }

    public async Task<BackgroundJob?> DequeueAsync(CancellationToken cancellationToken)
    {
        await _signal.WaitAsync(cancellationToken);

        lock (_jobs)
        {
            if (_jobs.TryDequeue(out var job))
            {
                job.Status = JobStatus.Processing;
                job.StartedAt = DateTime.UtcNow;
                return job;
            }
        }

        return null;
    }

    public Task UpdateJobStatusAsync(Guid jobId, JobStatus status, string? result = null, string? errorMessage = null)
    {
        lock (_jobs)
        {
            if (_jobStorage.TryGetValue(jobId, out var job))
            {
                job.Status = status;
                job.Result = result;
                job.ErrorMessage = errorMessage;

                if (status == JobStatus.Completed || status == JobStatus.Failed)
                {
                    job.CompletedAt = DateTime.UtcNow;
                    if (job.StartedAt.HasValue)
                    {
                        job.Duration = job.CompletedAt - job.StartedAt;
                    }
                }

                _logger.LogInformation("Updated job {JobId} status to {Status}", jobId, status);
            }
        }

        return Task.CompletedTask;
    }

    public Task<List<BackgroundJob>> GetJobsByEntityAsync(string entityId, string entityType)
    {
        lock (_jobs)
        {
            var jobs = _jobStorage.Values
                .Where(j => j.EntityId == entityId && j.EntityType == entityType)
                .OrderByDescending(j => j.CreatedAt)
                .ToList();

            return Task.FromResult(jobs);
        }
    }

    public Task<List<BackgroundJob>> GetJobHistoryAsync(int limit = 50)
    {
        lock (_jobs)
        {
            var jobs = _jobStorage.Values
                .OrderByDescending(j => j.CreatedAt)
                .Take(limit)
                .ToList();

            _logger.LogInformation("GetJobHistoryAsync called: Found {JobCount} jobs in storage", jobs.Count);
            foreach (var job in jobs.Take(3)) // Log first 3 jobs for debugging
            {
                _logger.LogInformation("Job {JobId}: Type={Type}, Status={Status}, CreatedAt={CreatedAt}", 
                    job.Id, job.Type, job.Status, job.CreatedAt);
            }

            return Task.FromResult(jobs);
        }
    }

    public Task<BackgroundJob?> GetJobAsync(Guid jobId)
    {
        lock (_jobs)
        {
            _jobStorage.TryGetValue(jobId, out var job);
            return Task.FromResult(job);
        }
    }
}

/// <summary>
/// Background job processor service
/// </summary>
public class BackgroundJobProcessor : BackgroundService
{
    private readonly IBackgroundJobQueue _jobQueue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundJobProcessor> _logger;

    public BackgroundJobProcessor(
        IBackgroundJobQueue jobQueue,
        IServiceProvider serviceProvider,
        ILogger<BackgroundJobProcessor> logger)
    {
        _jobQueue = jobQueue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background job processor starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await _jobQueue.DequeueAsync(stoppingToken);
                if (job != null)
                {
                    await ProcessJobAsync(job);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in background job processor");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("Background job processor stopping");
    }

    private async Task ProcessJobAsync(BackgroundJob job)
    {
        try
        {
            _logger.LogInformation("Processing job {JobId} of type {JobType}", job.Id, job.Type);

            using var scope = _serviceProvider.CreateScope();
            string result = job.Type switch
            {
                JobType.CalculateLocaleFinancials => await ProcessLocaleFinancialsAsync(job, scope.ServiceProvider),
                JobType.GenerateMultiLanguageContent => await ProcessMultiLanguageContentAsync(job, scope.ServiceProvider),
                JobType.RefreshCurrencyRates => await ProcessCurrencyRefreshAsync(job, scope.ServiceProvider),
                JobType.UpdateComplianceScreening => await ProcessComplianceUpdateAsync(job, scope.ServiceProvider),
                JobType.RecalculateCatalogPricing => await ProcessCatalogRecalculationAsync(job, scope.ServiceProvider),
                _ => throw new NotSupportedException($"Job type {job.Type} is not supported")
            };

            await _jobQueue.UpdateJobStatusAsync(job.Id, JobStatus.Completed, result);
            
            // Update database workflow job and catalog product status if linked
            if (job.WorkflowJobId.HasValue || job.CatalogProductId.HasValue)
            {
                await UpdateDatabaseJobStatusAsync(job, scope.ServiceProvider, "completed", result);
            }
            
            _logger.LogInformation("Completed job {JobId} successfully", job.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process job {JobId}: {Error}", job.Id, ex.Message);

            job.RetryCount++;
            if (job.RetryCount >= job.MaxRetries)
            {
                await _jobQueue.UpdateJobStatusAsync(job.Id, JobStatus.Failed, null, ex.Message);
                
                // Update database workflow job and catalog product status if linked
                if (job.WorkflowJobId.HasValue || job.CatalogProductId.HasValue)
                {
                    using var scope = _serviceProvider.CreateScope();
                    await UpdateDatabaseJobStatusAsync(job, scope.ServiceProvider, "failed", ex.Message);
                }
                
                _logger.LogWarning("Job {JobId} failed permanently after {RetryCount} retries", job.Id, job.RetryCount);
            }
            else
            {
                // Re-enqueue for retry
                job.Status = JobStatus.Pending;
                await _jobQueue.EnqueueAsync(job.Type, job.EntityId, job.EntityType, 
                    job.Parameters?.Deserialize<object>(), job.CreatedBy);
                _logger.LogInformation("Re-enqueued job {JobId} for retry {RetryCount}/{MaxRetries}", 
                    job.Id, job.RetryCount, job.MaxRetries);
            }
        }
    }

    private async Task<string> ProcessLocaleFinancialsAsync(BackgroundJob job, IServiceProvider serviceProvider)
    {
        var localeFinancialService = serviceProvider.GetRequiredService<ILocaleFinancialService>();
        
        var parameters = job.Parameters?.Deserialize<LocaleFinancialJobParameters>();
        if (parameters == null)
        {
            throw new InvalidOperationException("Missing parameters for locale financial calculation");
        }

        // Add realistic processing delay for demonstration - simulate complex financial calculations
        _logger.LogInformation("Processing locale financials for {LocaleCount} locales", parameters.LocaleIds.Count);
        await Task.Delay(parameters.LocaleIds.Count * 1500); // 1.5 seconds per locale

        var result = await localeFinancialService.CalculateLocaleFinancialsAsync(
            parameters.ProductId, 
            parameters.CatalogId, 
            parameters.LocaleIds);

        return JsonSerializer.Serialize(new { CalculatedLocales = result.Count, UpdatedAt = DateTime.UtcNow });
    }

    private async Task<string> ProcessMultiLanguageContentAsync(BackgroundJob job, IServiceProvider serviceProvider)
    {
        var contentService = serviceProvider.GetRequiredService<IMultiLanguageContentService>();
        
        var parameters = job.Parameters?.Deserialize<MultiLanguageContentJobParameters>();
        if (parameters == null)
        {
            throw new InvalidOperationException("Missing parameters for multi-language content generation");
        }

        // Add realistic processing delay for demonstration - simulate content translation API calls
        _logger.LogInformation("Processing multi-language content for {LanguageCount} languages", parameters.TargetLocales.Count);
        await Task.Delay(parameters.TargetLocales.Count * 2000); // 2 seconds per language for translation

        var result = await contentService.GenerateMultiLanguageContentAsync(
            parameters.ProductId,
            parameters.SourceLocale,
            parameters.TargetLocales);

        return JsonSerializer.Serialize(new { GeneratedLanguages = result.Count, UpdatedAt = DateTime.UtcNow });
    }

    private async Task<string> ProcessCurrencyRefreshAsync(BackgroundJob job, IServiceProvider serviceProvider)
    {
        // Placeholder for currency rate refresh
        await Task.Delay(1000); // Simulate API call
        return JsonSerializer.Serialize(new { RefreshedCurrencies = 50, UpdatedAt = DateTime.UtcNow });
    }

    private async Task<string> ProcessComplianceUpdateAsync(BackgroundJob job, IServiceProvider serviceProvider)
    {
        // Placeholder for compliance screening update
        await Task.Delay(500); // Simulate compliance check
        return JsonSerializer.Serialize(new { UpdatedCompliance = true, UpdatedAt = DateTime.UtcNow });
    }

    private async Task<string> ProcessCatalogRecalculationAsync(BackgroundJob job, IServiceProvider serviceProvider)
    {
        // Placeholder for catalog-wide price recalculation
        await Task.Delay(2000); // Simulate complex calculation
        return JsonSerializer.Serialize(new { RecalculatedProducts = 100, UpdatedAt = DateTime.UtcNow });
    }

    private async Task UpdateDatabaseJobStatusAsync(BackgroundJob job, IServiceProvider serviceProvider, string status, string? result)
    {
        try
        {
            using var dbContext = serviceProvider.GetRequiredService<Commerce.Services.PricingMdm.Api.Data.PricingDbContext>();
            
            // Update workflow job status in database if linked
            if (job.WorkflowJobId.HasValue)
            {
                var completedItems = status == "completed" ? 1 : 0;
                var failedItems = status == "failed" ? 1 : 0;
                
                await dbContext.Database.ExecuteSqlRawAsync(@"
                    UPDATE averis_pricing.catalog_workflow_jobs 
                    SET status = {1}, completed_items = {2}, failed_items = {3}, 
                        progress_percentage = CASE WHEN total_items > 0 THEN ({2} * 100 / total_items) ELSE 100 END,
                        completed_at = CASE WHEN {1} IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
                    WHERE id = {0}",
                    job.WorkflowJobId.Value, status, completedItems, failedItems);
                
                _logger.LogInformation("Updated workflow job {WorkflowJobId} status to {Status}", job.WorkflowJobId.Value, status);
            }
            
            // Update catalog product workflow status if linked
            if (job.CatalogProductId.HasValue)
            {
                var catalogProduct = await dbContext.CatalogProducts.FindAsync(job.CatalogProductId.Value);
                if (catalogProduct != null)
                {
                    // Update appropriate workflow status based on job type
                    if (job.Type == JobType.CalculateLocaleFinancials)
                    {
                        catalogProduct.LocaleWorkflowStatus = status;
                    }
                    else if (job.Type == JobType.GenerateMultiLanguageContent)
                    {
                        catalogProduct.ContentWorkflowStatus = status;
                    }
                    
                    if (status == "completed" || status == "failed")
                    {
                        catalogProduct.WorkflowCompletedAt = DateTime.UtcNow;
                    }
                    
                    await dbContext.SaveChangesAsync();
                    
                    _logger.LogInformation("Updated catalog product {CatalogProductId} workflow status to {Status}", job.CatalogProductId.Value, status);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating database job status for job {JobId}", job.Id);
        }
    }
}

/// <summary>
/// Job parameter models
/// </summary>
public class LocaleFinancialJobParameters
{
    public Guid ProductId { get; set; }
    public Guid CatalogId { get; set; }
    public List<Guid> LocaleIds { get; set; } = new();
}

public class MultiLanguageContentJobParameters
{
    public Guid ProductId { get; set; }
    public string SourceLocale { get; set; } = string.Empty;
    public List<string> TargetLocales { get; set; } = new();
}

/// <summary>
/// Service interfaces for job processing
/// </summary>
public interface ILocaleFinancialService
{
    Task<List<Guid>> CalculateLocaleFinancialsAsync(Guid productId, Guid catalogId, List<Guid> localeIds);
}

public interface IMultiLanguageContentService
{
    Task<List<string>> GenerateMultiLanguageContentAsync(Guid productId, string sourceLocale, List<string> targetLocales);
}