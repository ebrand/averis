using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.Localization.Api.Hubs;

/// <summary>
/// SignalR Hub for broadcasting real-time localization progress updates
/// Each worker broadcasts its progress on a channel named after its worker GUID
/// </summary>
public class LocalizationProgressHub : Hub
{
    private readonly ILogger<LocalizationProgressHub> _logger;

    public LocalizationProgressHub(ILogger<LocalizationProgressHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Allows clients to join a specific worker's progress channel
    /// </summary>
    /// <param name="workerId">The GUID of the worker to monitor</param>
    public async Task JoinWorkerChannel(string workerId)
    {
        if (Guid.TryParse(workerId, out _))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"worker_{workerId}");
            _logger.LogInformation("Client {ConnectionId} joined worker channel {WorkerId}", 
                Context.ConnectionId, workerId);
        }
        else
        {
            _logger.LogWarning("Invalid worker ID format: {WorkerId}", workerId);
        }
    }

    /// <summary>
    /// Allows clients to leave a specific worker's progress channel
    /// </summary>
    /// <param name="workerId">The GUID of the worker to stop monitoring</param>
    public async Task LeaveWorkerChannel(string workerId)
    {
        if (Guid.TryParse(workerId, out _))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"worker_{workerId}");
            _logger.LogInformation("Client {ConnectionId} left worker channel {WorkerId}", 
                Context.ConnectionId, workerId);
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}. Exception: {Exception}", 
            Context.ConnectionId, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// Service for broadcasting progress updates to SignalR clients
/// </summary>
public interface IProgressBroadcastService
{
    Task BroadcastProgressAsync(Guid workerId, LocalizationProgressUpdate update);
    Task BroadcastJobCompleteAsync(Guid workerId, LocalizationJobResult result);
    Task BroadcastJobErrorAsync(Guid workerId, string errorMessage);
    Task BroadcastJobCreatedAsync(Guid jobId, string jobName);
}

public class ProgressBroadcastService : IProgressBroadcastService
{
    private readonly IHubContext<LocalizationProgressHub> _hubContext;
    private readonly ILogger<ProgressBroadcastService> _logger;

    public ProgressBroadcastService(
        IHubContext<LocalizationProgressHub> hubContext,
        ILogger<ProgressBroadcastService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task BroadcastProgressAsync(Guid workerId, LocalizationProgressUpdate update)
    {
        try
        {
            await _hubContext.Clients.Group($"worker_{workerId}")
                .SendAsync("ProgressUpdate", update);
            
            _logger.LogInformation("Broadcasted progress update for worker {WorkerId}: {Progress}% - {Step}", 
                workerId, update.ProgressPercentage, update.CurrentStep);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting progress for worker {WorkerId}", workerId);
        }
    }

    public async Task BroadcastJobCompleteAsync(Guid workerId, LocalizationJobResult result)
    {
        try
        {
            // Send to worker-specific group
            await _hubContext.Clients.Group($"worker_{workerId}")
                .SendAsync("JobComplete", result);
            
            // Also send to all connected clients for immediate UI updates
            await _hubContext.Clients.All
                .SendAsync("JobComplete", result);
            
            _logger.LogInformation("Broadcasted job completion for worker {WorkerId} to worker group and all clients", workerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting job completion for worker {WorkerId}", workerId);
        }
    }

    public async Task BroadcastJobErrorAsync(Guid workerId, string errorMessage)
    {
        try
        {
            await _hubContext.Clients.Group($"worker_{workerId}")
                .SendAsync("JobError", new { workerId, errorMessage, timestamp = DateTime.UtcNow });
            
            _logger.LogWarning("Broadcasted job error for worker {WorkerId}: {Error}", workerId, errorMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting job error for worker {WorkerId}", workerId);
        }
    }

    public async Task BroadcastJobCreatedAsync(Guid jobId, string jobName)
    {
        try
        {
            // Send to all connected clients for immediate UI updates
            await _hubContext.Clients.All
                .SendAsync("JobCreated", new { jobId, jobName, timestamp = DateTime.UtcNow });
            
            _logger.LogInformation("Broadcasted job creation for job {JobId}: {JobName}", jobId, jobName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting job creation for job {JobId}", jobId);
        }
    }
}

/// <summary>
/// Progress update data structure for SignalR communication
/// </summary>
public class LocalizationProgressUpdate
{
    public Guid JobId { get; set; }
    public Guid WorkerId { get; set; }
    public string JobName { get; set; } = string.Empty;
    public int ProgressPercentage { get; set; }
    public string CurrentStep { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> AdditionalData { get; set; } = new();
}

/// <summary>
/// Job completion result data structure
/// </summary>
public class LocalizationJobResult
{
    public Guid JobId { get; set; }
    public Guid WorkerId { get; set; }
    public string Status { get; set; } = string.Empty; // completed, failed
    public string? ErrorMessage { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public TimeSpan Duration { get; set; }
    public Dictionary<string, object> Results { get; set; } = new();
}