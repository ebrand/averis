namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Interface for real-time log streaming to the System API dashboard
/// </summary>
public interface IRealTimeLogService
{
    /// <summary>
    /// Stream a log entry to the real-time dashboard
    /// </summary>
    Task StreamLogAsync(string level, string source, string message, Exception? exception = null);

    /// <summary>
    /// Stream a business event to the dashboard
    /// </summary>
    Task StreamBusinessEventAsync(string eventType, string details, string level = "INFO");

    /// <summary>
    /// Stream a product workflow transition event
    /// </summary>
    Task StreamProductWorkflowTransitionAsync(string productSku, string fromStatus, string toStatus, string userId);

    /// <summary>
    /// Stream a product launch event
    /// </summary>
    Task StreamProductLaunchAsync(string productSku);

    /// <summary>
    /// Stream a performance warning
    /// </summary>
    Task StreamPerformanceWarningAsync(string operation, long elapsedMs, long thresholdMs);

    /// <summary>
    /// Stream an error event
    /// </summary>
    Task StreamErrorAsync(string operation, string error, Exception? exception = null);

    /// <summary>
    /// Stream a memory pressure warning
    /// </summary>
    Task StreamMemoryPressureAsync(long memoryUsageMB, long thresholdMB);

    /// <summary>
    /// Stream a timeout error
    /// </summary>
    Task StreamTimeoutAsync(string operation, int timeoutMs);

    /// <summary>
    /// Stream a resource warning
    /// </summary>
    Task StreamResourceWarningAsync(string resourceType, string details);
}