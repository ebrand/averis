using Commerce.Services.SystemApi.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Services;

/// <summary>
/// Service for sending real-time log notifications via SignalR
/// </summary>
public class LogNotificationService : ILogNotificationService
{
    private readonly IHubContext<LogsHub> _hubContext;
    private readonly ILogger<LogNotificationService> _logger;

    public LogNotificationService(IHubContext<LogsHub> hubContext, ILogger<LogNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyLogEntryAsync(LogEntry logEntry)
    {
        try
        {
            var notificationData = new
            {
                id = logEntry.Id,
                timestamp = logEntry.Timestamp.ToString("O"),
                level = logEntry.Level,
                source = logEntry.Source,
                message = logEntry.Message,
                exception = logEntry.Exception,
                properties = logEntry.Properties
            };

            await _hubContext.Clients.Group("LogsGroup")
                .SendAsync("LogEntryReceived", notificationData);

            // Don't log this operation to avoid recursion
        }
        catch (Exception ex)
        {
            // Use console output to avoid recursion in logging
            Console.WriteLine($"Failed to send real-time log notification: {ex.Message}");
        }
    }
}