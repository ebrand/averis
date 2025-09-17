using System.Collections.Concurrent;
using Commerce.Services.Localization.Api.Models;
using Commerce.Services.Localization.Api.Hubs;

namespace Commerce.Services.Localization.Api.Services;

/// <summary>
/// Manages a pool of localization workers with GUID-based identification
/// </summary>
public interface IWorkerPoolService
{
    Task<Guid?> AssignJobToWorkerAsync(LocalizationWorkflow job);
    Task ReleaseWorkerAsync(Guid workerId);
    Task<List<Guid>> GetAvailableWorkersAsync();
    Task<int> GetActiveJobCountAsync();
    bool IsWorkerAvailable(Guid workerId);
}

/// <summary>
/// Represents a localization worker in the pool
/// </summary>
public class LocalizationWorker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public bool IsAvailable { get; set; } = true;
    public DateTime? LastAssignedAt { get; set; }
    public Guid? CurrentJobId { get; set; }
    public CancellationTokenSource? CancellationTokenSource { get; set; }
}

public class WorkerPoolService : IWorkerPoolService
{
    private readonly ConcurrentDictionary<Guid, LocalizationWorker> _workers;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WorkerPoolService> _logger;
    private readonly int _maxWorkers;

    public WorkerPoolService(IServiceProvider serviceProvider, ILogger<WorkerPoolService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _maxWorkers = 5; // Configuration could be injected here
        _workers = new ConcurrentDictionary<Guid, LocalizationWorker>();

        // Initialize worker pool
        InitializeWorkerPool();
    }

    private void InitializeWorkerPool()
    {
        for (int i = 0; i < _maxWorkers; i++)
        {
            var worker = new LocalizationWorker();
            _workers.TryAdd(worker.Id, worker);
            _logger.LogInformation("Initialized worker {WorkerId}", worker.Id);
        }

        _logger.LogInformation("Worker pool initialized with {WorkerCount} workers", _maxWorkers);
    }

    public Task<List<Guid>> GetAvailableWorkersAsync()
    {
        var availableWorkers = _workers.Values
            .Where(w => w.IsAvailable)
            .Select(w => w.Id)
            .ToList();

        return Task.FromResult(availableWorkers);
    }

    public Task<int> GetActiveJobCountAsync()
    {
        var activeCount = _workers.Values.Count(w => !w.IsAvailable);
        return Task.FromResult(activeCount);
    }

    public bool IsWorkerAvailable(Guid workerId)
    {
        return _workers.TryGetValue(workerId, out var worker) && worker.IsAvailable;
    }

    public async Task<Guid?> AssignJobToWorkerAsync(LocalizationWorkflow job)
    {
        // Find the first available worker
        var availableWorker = _workers.Values.FirstOrDefault(w => w.IsAvailable);
        
        if (availableWorker == null)
        {
            _logger.LogWarning("No available workers for job {JobId}", job.Id);
            return null;
        }

        // Mark worker as busy
        availableWorker.IsAvailable = false;
        availableWorker.LastAssignedAt = DateTime.UtcNow;
        availableWorker.CurrentJobId = job.Id;
        availableWorker.CancellationTokenSource = new CancellationTokenSource();

        _logger.LogInformation("Assigned job {JobId} to worker {WorkerId}", job.Id, availableWorker.Id);

        Console.WriteLine($"ASSIGN DEBUG: About to start Task.Run for job {job.Id} with worker {availableWorker.Id}");
        _logger.LogCritical("ASSIGN CRITICAL: About to start Task.Run for job {JobId} with worker {WorkerId}", job.Id, availableWorker.Id);

        // Start the job processing in the background
        _ = Task.Run(async () => await ProcessJobAsync(availableWorker, job), 
            availableWorker.CancellationTokenSource.Token);
            
        Console.WriteLine($"ASSIGN DEBUG: Task.Run started for job {job.Id}");
        _logger.LogCritical("ASSIGN CRITICAL: Task.Run started for job {JobId}", job.Id);

        return availableWorker.Id;
    }

    public async Task ReleaseWorkerAsync(Guid workerId)
    {
        if (_workers.TryGetValue(workerId, out var worker))
        {
            worker.IsAvailable = true;
            worker.CurrentJobId = null;
            worker.CancellationTokenSource?.Cancel();
            worker.CancellationTokenSource?.Dispose();
            worker.CancellationTokenSource = null;

            _logger.LogInformation("Released worker {WorkerId}", workerId);
        }

        await Task.CompletedTask;
    }

    private async Task ProcessJobAsync(LocalizationWorker worker, LocalizationWorkflow job)
    {
        using var scope = _serviceProvider.CreateScope();
        var localizationProcessor = scope.ServiceProvider.GetRequiredService<ILocalizationProcessor>();
        
        Console.WriteLine($"WORKER DEBUG: About to call ProcessJobAsync on {localizationProcessor.GetType().FullName} for job {job.Id}");
        _logger.LogCritical("WORKER CRITICAL: About to call ProcessJobAsync on {ProcessorType} for job {JobId}", 
            localizationProcessor.GetType().FullName, job.Id);
        
        try
        {
            _logger.LogInformation("Worker {WorkerId} starting job {JobId}", worker.Id, job.Id);
            
            await localizationProcessor.ProcessJobAsync(worker.Id, job, 
                worker.CancellationTokenSource?.Token ?? CancellationToken.None);
                
            Console.WriteLine($"WORKER DEBUG: ProcessJobAsync completed for job {job.Id}");
            _logger.LogCritical("WORKER CRITICAL: ProcessJobAsync completed for job {JobId}", job.Id);
            
            _logger.LogInformation("Worker {WorkerId} completed job {JobId}", worker.Id, job.Id);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Worker {WorkerId} job {JobId} was cancelled", worker.Id, job.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Worker {WorkerId} failed processing job {JobId}", worker.Id, job.Id);
        }
        finally
        {
            // Release the worker
            await ReleaseWorkerAsync(worker.Id);
        }
    }
}

/// <summary>
/// Interface for processing localization jobs
/// </summary>
public interface ILocalizationProcessor
{
    Task ProcessJobAsync(Guid workerId, LocalizationWorkflow job, CancellationToken cancellationToken);
}