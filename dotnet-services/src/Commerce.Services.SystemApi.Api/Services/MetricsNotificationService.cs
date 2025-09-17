using Commerce.Services.SystemApi.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Services;

/// <summary>
/// Service for sending real-time metrics notifications via SignalR
/// </summary>
public class MetricsNotificationService : IMetricsNotificationService
{
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<MetricsNotificationService> _logger;

    public MetricsNotificationService(IHubContext<MetricsHub> hubContext, ILogger<MetricsNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyMetricsUpdateAsync(MetricsUpdate metricsUpdate)
    {
        try
        {
            var notificationData = new
            {
                serviceName = metricsUpdate.ServiceName,
                endpoint = metricsUpdate.Endpoint,
                responseTimeMs = metricsUpdate.ResponseTimeMs,
                isError = metricsUpdate.IsError,
                timestamp = metricsUpdate.Timestamp.ToString("O"),
                totalRequests = metricsUpdate.TotalRequests,
                averageResponseTime = metricsUpdate.AverageResponseTime,
                errorRate = metricsUpdate.ErrorRate
            };

            await _hubContext.Clients.Group("MetricsGroup")
                .SendAsync("MetricsUpdated", notificationData);

            _logger.LogInformation("Sent real-time metrics update for {ServiceName} to MetricsGroup", metricsUpdate.ServiceName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send real-time metrics update for {ServiceName}", metricsUpdate.ServiceName);
        }
    }
}