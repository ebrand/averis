using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Hubs;

public class MessageLogHub : Hub
{
    public async Task JoinMessageLogGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "MessageLogGroup");
    }

    public async Task LeaveMessageLogGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "MessageLogGroup");
    }

    public override async Task OnConnectedAsync()
    {
        // Automatically join the message log group when connected
        await Groups.AddToGroupAsync(Context.ConnectionId, "MessageLogGroup");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "MessageLogGroup");
        await base.OnDisconnectedAsync(exception);
    }
}