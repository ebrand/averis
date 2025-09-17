using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Localization.Api.Models;
using Commerce.Services.Localization.Api.Services;
using Commerce.Services.Localization.Api.Hubs;

namespace Commerce.Services.Localization.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocalizationController : ControllerBase
{
    private readonly IJobManagementService _jobManagement;
    private readonly IWorkerPoolService _workerPool;
    private readonly IProgressBroadcastService _progressBroadcast;
    private readonly ILogger<LocalizationController> _logger;

    public LocalizationController(
        IJobManagementService jobManagement,
        IWorkerPoolService workerPool,
        IProgressBroadcastService progressBroadcast,
        ILogger<LocalizationController> logger)
    {
        _jobManagement = jobManagement;
        _workerPool = workerPool;
        _progressBroadcast = progressBroadcast;
        _logger = logger;
    }

    /// <summary>
    /// Create a new localization job
    /// </summary>
    [HttpPost("jobs")]
    public async Task<IActionResult> CreateJob([FromBody] CreateLocalizationJobRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var jobId = await _jobManagement.CreateJobAsync(request);

            _logger.LogInformation("Created localization job {JobId} for catalog {CatalogId}", 
                jobId, request.CatalogId);

            // Broadcast job creation event to all connected clients
            await _progressBroadcast.BroadcastJobCreatedAsync(jobId, request.JobName);

            return Ok(new { jobId, message = "Localization job created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating localization job");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific localization job by ID
    /// </summary>
    [HttpGet("jobs/{jobId}")]
    public async Task<IActionResult> GetJob(Guid jobId)
    {
        try
        {
            var job = await _jobManagement.GetJobAsync(jobId);
            if (job == null)
            {
                return NotFound(new { error = "Job not found" });
            }

            return Ok(job);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving job {JobId}", jobId);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all localization jobs with optional filtering
    /// </summary>
    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var jobs = await _jobManagement.GetJobsAsync(status, page, pageSize);

            return Ok(new
            {
                jobs,
                page,
                pageSize,
                count = jobs.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving jobs");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update job status (for manual intervention if needed)
    /// </summary>
    [HttpPatch("jobs/{jobId}/status")]
    public async Task<IActionResult> UpdateJobStatus(Guid jobId, [FromBody] JobStatusUpdate update)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _jobManagement.UpdateJobStatusAsync(
                jobId, 
                update.Status, 
                update.ProgressPercentage, 
                update.CurrentStep, 
                update.ErrorMessage);

            return Ok(new { message = "Job status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating job {JobId} status", jobId);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get worker pool status
    /// </summary>
    [HttpGet("workers/status")]
    public async Task<IActionResult> GetWorkerStatus()
    {
        try
        {
            var availableWorkers = await _workerPool.GetAvailableWorkersAsync();
            var activeJobCount = await _workerPool.GetActiveJobCountAsync();

            return Ok(new
            {
                totalWorkers = 5, // Configuration value
                availableWorkers = availableWorkers.Count,
                activeJobs = activeJobCount,
                workerIds = availableWorkers
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving worker status");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new localization workflow (compatible with Pricing MDM integration)
    /// </summary>
    [HttpPost("workflows")]
    public async Task<IActionResult> CreateWorkflow([FromBody] CreateLocalizationWorkflowRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Generate job name if not provided
            var jobName = string.IsNullOrEmpty(request.JobName) 
                ? $"Localize {request.FromLocale} → {request.ToLocale} ({DateTime.UtcNow:yyyy-MM-dd HH:mm})"
                : request.JobName;

            _logger.LogInformation("Creating localization workflow: {JobName}", jobName);

            // Convert workflow request to job request format
            var jobRequest = new CreateLocalizationJobRequest
            {
                JobName = jobName,
                CatalogId = request.CatalogId,
                FromLocale = request.FromLocale,
                ToLocale = request.ToLocale,
                CreatedBy = request.CreatedBy,
                JobData = new Dictionary<string, object>
                {
                    ["productIds"] = request.ProductIds,
                    ["additionalData"] = request.JobData ?? new object()
                }
            };

            var jobId = await _jobManagement.CreateJobAsync(jobRequest);

            Console.WriteLine($"🚀 CONTROLLER DEBUG: Created job {jobId} - THIS MESSAGE SHOULD ALWAYS APPEAR!");
            _logger.LogCritical("🚀 CONTROLLER CRITICAL: Created job {JobId} - THIS MESSAGE SHOULD ALWAYS APPEAR!", jobId);

            // Return response in workflow format
            var response = new LocalizationWorkflowResponse
            {
                Id = jobId,
                JobName = jobName,
                CatalogId = request.CatalogId,
                FromLocale = request.FromLocale,
                ToLocale = request.ToLocale,
                Status = "pending",
                ProgressPercentage = 0,
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Successfully created localization workflow {WorkflowId}", jobId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating localization workflow");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all localization workflows
    /// </summary>
    [HttpGet("workflows")]
    public async Task<IActionResult> GetWorkflows()
    {
        try
        {
            var jobs = await _jobManagement.GetJobsAsync(null, 1, 100);
            
            var workflows = jobs.Select(job => new LocalizationWorkflowResponse
            {
                Id = job.Id,
                JobName = job.JobName,
                JobType = job.JobType,
                CatalogId = job.CatalogId,
                FromLocale = job.FromLocale,
                ToLocale = job.ToLocale,
                Status = job.Status,
                ProgressPercentage = job.ProgressPercentage,
                CurrentStep = job.CurrentStep,
                CreatedAt = job.CreatedAt,
                StartedAt = job.StartedAt,
                CompletedAt = job.CompletedAt,
                ErrorMessage = job.ErrorMessage,
                WorkerId = job.WorkerId
            }).ToList();

            return Ok(workflows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localization workflows");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get localization workflows for a specific catalog product
    /// </summary>
    [HttpGet("workflows/catalog/{catalogId}/product/{catalogProductId}")]
    public async Task<IActionResult> GetWorkflowsForProduct(Guid catalogId, Guid catalogProductId)
    {
        try
        {
            // Get all jobs for the catalog and filter by catalog product ID in the job data
            var jobs = await _jobManagement.GetJobsAsync(null, 1, 1000);
            
            var filteredJobs = jobs.Where(job => 
                job.CatalogId == catalogId && 
                (job.JobData?.ToString()?.Contains(catalogProductId.ToString()) ?? false)
            ).ToList();

            var workflows = filteredJobs.Select(job => new LocalizationWorkflowResponse
            {
                Id = job.Id,
                JobName = job.JobName,
                JobType = job.JobType,
                CatalogId = job.CatalogId,
                FromLocale = job.FromLocale,
                ToLocale = job.ToLocale,
                Status = job.Status,
                ProgressPercentage = job.ProgressPercentage,
                CurrentStep = job.CurrentStep,
                CreatedAt = job.CreatedAt,
                StartedAt = job.StartedAt,
                CompletedAt = job.CompletedAt,
                ErrorMessage = job.ErrorMessage,
                WorkerId = job.WorkerId
            }).ToList();

            return Ok(workflows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localization workflows for catalog product {CatalogProductId} in catalog {CatalogId}", catalogProductId, catalogId);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific localization workflow by ID
    /// </summary>
    [HttpGet("workflows/{id}")]
    public async Task<IActionResult> GetWorkflow(Guid id)
    {
        try
        {
            var job = await _jobManagement.GetJobAsync(id);
            if (job == null)
            {
                return NotFound(new { error = "Workflow not found" });
            }

            var response = new LocalizationWorkflowStatusResponse
            {
                Id = job.Id,
                Status = job.Status,
                ProgressPercentage = job.ProgressPercentage,
                CurrentStep = job.CurrentStep,
                ErrorMessage = job.ErrorMessage,
                WorkerId = job.WorkerId
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localization workflow {WorkflowId}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            service = "Localization API"
        });
    }
}

/// <summary>
/// Request model for creating localization workflows (Pricing MDM integration)
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
    public string? JobType { get; set; }
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