namespace Commerce.Services.SystemApi.Api.Services;

/// <summary>
/// Interface for sending real-time metrics notifications via SignalR
/// </summary>
public interface IMetricsNotificationService
{
    /// <summary>
    /// Send real-time metrics update to all connected clients
    /// </summary>
    /// <param name="metricsUpdate">The metrics update data</param>
    Task NotifyMetricsUpdateAsync(MetricsUpdate metricsUpdate);
}

/// <summary>
/// Represents a real-time metrics update
/// </summary>
public class MetricsUpdate
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int ResponseTimeMs { get; set; }
    public bool IsError { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int TotalRequests { get; set; }
    public double AverageResponseTime { get; set; }
    public double ErrorRate { get; set; }
}