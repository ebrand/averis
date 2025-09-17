using Microsoft.EntityFrameworkCore;
using Commerce.Services.Localization.Api.Data;
using Commerce.Services.Localization.Api.Models;

namespace Commerce.Services.Localization.Api.Services;

/// <summary>
/// Background service that polls for pending localization jobs and assigns them to workers
/// </summary>
public class JobPollingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<JobPollingService> _logger;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(10); // Poll every 10 seconds
    private readonly int _maxJobsPerPoll = 10; // Maximum jobs to grab per polling cycle

    public JobPollingService(IServiceProvider serviceProvider, ILogger<JobPollingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Job polling service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndAssignJobsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during job polling cycle");
            }

            // Wait for the next polling interval
            await Task.Delay(_pollingInterval, stoppingToken);
        }

        _logger.LogInformation("Job polling service stopped");
    }

    private async Task PollAndAssignJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<LocalizationDbContext>();
        var workerPool = scope.ServiceProvider.GetRequiredService<IWorkerPoolService>();

        try
        {
            // Get available workers
            var availableWorkers = await workerPool.GetAvailableWorkersAsync();
            if (availableWorkers.Count == 0)
            {
                _logger.LogDebug("No available workers, skipping job polling");
                return;
            }

            // Fetch pending jobs from the database
            var pendingJobs = await dbContext.LocalizationWorkflows
                .Where(j => j.Status == "pending")
                .OrderBy(j => j.CreatedAt)
                .Take(Math.Min(_maxJobsPerPoll, availableWorkers.Count))
                .ToListAsync(cancellationToken);

            if (pendingJobs.Count == 0)
            {
                _logger.LogDebug("No pending jobs found");
                return;
            }

            _logger.LogInformation("Found {PendingJobCount} pending jobs, {AvailableWorkerCount} available workers", 
                pendingJobs.Count, availableWorkers.Count);

            // Assign jobs to workers
            foreach (var job in pendingJobs)
            {
                try
                {
                    var workerId = await workerPool.AssignJobToWorkerAsync(job);
                    if (workerId.HasValue)
                    {
                        // Update the job record with worker ID and status
                        job.WorkerId = workerId.Value;
                        job.Status = "running";
                        job.StartedAt = DateTime.UtcNow;
                        job.ProgressPercentage = 0;
                        job.CurrentStep = "Initializing";

                        await dbContext.SaveChangesAsync(cancellationToken);

                        _logger.LogInformation("Assigned job {JobId} ({JobName}) to worker {WorkerId}", 
                            job.Id, job.JobName, workerId.Value);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to assign job {JobId} to a worker", job.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error assigning job {JobId} to worker", job.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during job polling and assignment");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Job polling service is stopping");
        await base.StopAsync(cancellationToken);
    }
}

/// <summary>
/// Service for managing localization workflow jobs
/// </summary>
public interface IJobManagementService
{
    Task<Guid> CreateJobAsync(CreateLocalizationJobRequest request);
    Task<LocalizationWorkflow?> GetJobAsync(Guid jobId);
    Task<List<LocalizationWorkflow>> GetJobsAsync(string? status = null, int page = 1, int pageSize = 20);
    Task UpdateJobStatusAsync(Guid jobId, string status, int? progressPercentage = null, string? currentStep = null, string? errorMessage = null);
    Task CompleteJobAsync(Guid jobId, string results);
    Task FailJobAsync(Guid jobId, string errorMessage);
}

public class JobManagementService : IJobManagementService
{
    private readonly LocalizationDbContext _dbContext;
    private readonly ILogger<JobManagementService> _logger;

    public JobManagementService(LocalizationDbContext dbContext, ILogger<JobManagementService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Guid> CreateJobAsync(CreateLocalizationJobRequest request)
    {
        var job = new LocalizationWorkflow
        {
            Id = Guid.NewGuid(),
            JobName = request.JobName,
            CatalogId = request.CatalogId,
            FromLocale = request.FromLocale,
            ToLocale = request.ToLocale,
            CreatedBy = request.CreatedBy,
            JobType = request.JobType,
            Status = "pending",
            JobData = request.JobData != null ? System.Text.Json.JsonSerializer.Serialize(request.JobData) : null
        };

        _dbContext.LocalizationWorkflows.Add(job);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created localization job {JobId} ({JobName}) for catalog {CatalogId}", 
            job.Id, job.JobName, job.CatalogId);

        return job.Id;
    }

    public async Task<LocalizationWorkflow?> GetJobAsync(Guid jobId)
    {
        return await _dbContext.LocalizationWorkflows
            .FirstOrDefaultAsync(j => j.Id == jobId);
    }

    public async Task<List<LocalizationWorkflow>> GetJobsAsync(string? status = null, int page = 1, int pageSize = 20)
    {
        var query = _dbContext.LocalizationWorkflows.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(j => j.Status == status);
        }

        return await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task UpdateJobStatusAsync(Guid jobId, string status, int? progressPercentage = null, 
        string? currentStep = null, string? errorMessage = null)
    {
        var job = await _dbContext.LocalizationWorkflows.FindAsync(jobId);
        if (job == null)
        {
            _logger.LogWarning("Job {JobId} not found for status update", jobId);
            return;
        }

        job.Status = status;
        if (progressPercentage.HasValue)
            job.ProgressPercentage = progressPercentage.Value;
        if (!string.IsNullOrEmpty(currentStep))
            job.CurrentStep = currentStep;
        if (!string.IsNullOrEmpty(errorMessage))
            job.ErrorMessage = errorMessage;

        await _dbContext.SaveChangesAsync();

        _logger.LogDebug("Updated job {JobId} status to {Status}, progress: {Progress}%", 
            jobId, status, progressPercentage);
    }

    public async Task CompleteJobAsync(Guid jobId, string results)
    {
        var job = await _dbContext.LocalizationWorkflows.FindAsync(jobId);
        if (job == null)
        {
            _logger.LogWarning("Job {JobId} not found for completion", jobId);
            return;
        }

        job.Status = "completed";
        job.ProgressPercentage = 100;
        job.CompletedAt = DateTime.UtcNow;
        job.Results = results;
        job.CurrentStep = "Completed";

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Completed job {JobId} ({JobName})", jobId, job.JobName);
    }

    public async Task FailJobAsync(Guid jobId, string errorMessage)
    {
        var job = await _dbContext.LocalizationWorkflows.FindAsync(jobId);
        if (job == null)
        {
            _logger.LogWarning("Job {JobId} not found for failure", jobId);
            return;
        }

        job.Status = "failed";
        job.CompletedAt = DateTime.UtcNow;
        job.ErrorMessage = errorMessage;
        job.CurrentStep = "Failed";

        await _dbContext.SaveChangesAsync();

        _logger.LogError("Failed job {JobId} ({JobName}): {ErrorMessage}", jobId, job.JobName, errorMessage);
    }
}