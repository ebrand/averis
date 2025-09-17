using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time application log streaming to connected clients
/// </summary>
public class LogsHub : Hub
{
    private readonly ILogger<LogsHub> _logger;

    public LogsHub(ILogger<LogsHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinLogsGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "LogsGroup");
    }

    public async Task LeaveLogsGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "LogsGroup");
    }

    public override async Task OnConnectedAsync()
    {
        // Automatically join the logs group when connected
        await Groups.AddToGroupAsync(Context.ConnectionId, "LogsGroup");
        _logger.LogInformation("SignalR client connected to LogsHub: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "LogsGroup");
        _logger.LogInformation("SignalR client disconnected from LogsHub: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}