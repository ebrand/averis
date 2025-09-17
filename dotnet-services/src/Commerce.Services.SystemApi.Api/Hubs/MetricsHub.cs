using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time metrics streaming to connected clients
/// </summary>
public class MetricsHub : Hub
{
    private readonly ILogger<MetricsHub> _logger;

    public MetricsHub(ILogger<MetricsHub> logger)
    {
        _logger = logger;
    }
    public async Task JoinMetricsGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "MetricsGroup");
    }

    public async Task LeaveMetricsGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "MetricsGroup");
    }

    public override async Task OnConnectedAsync()
    {
        // Automatically join the metrics group when connected
        await Groups.AddToGroupAsync(Context.ConnectionId, "MetricsGroup");
        _logger.LogInformation("SignalR client connected to MetricsHub: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "MetricsGroup");
        _logger.LogInformation("SignalR client disconnected from MetricsHub: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}