using Commerce.Services.SystemApi.Api.Hubs;
using Commerce.Services.SystemApi.Api.Models;
using Microsoft.AspNetCore.SignalR;

namespace Commerce.Services.SystemApi.Api.Services;

public class MessageNotificationService : IMessageNotificationService
{
    private readonly IHubContext<MessageLogHub> _hubContext;
    private readonly ILogger<MessageNotificationService> _logger;

    public MessageNotificationService(IHubContext<MessageLogHub> hubContext, ILogger<MessageNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyMessageCreatedAsync(Message message)
    {
        try
        {
            var notificationData = new
            {
                id = message.Id,
                messageType = message.MessageType,
                sourceSystem = message.SourceSystem,
                eventType = message.EventType,
                correlationId = message.CorrelationId,
                productId = message.ProductId,
                productSku = message.ProductSku,
                productName = message.ProductName,
                messagePayload = message.MessagePayload,
                processingTimeMs = message.ProcessingTimeMs,
                retryCount = message.RetryCount,
                errorMessage = message.ErrorMessage,
                createdAt = message.CreatedAt,
                updatedAt = message.UpdatedAt
            };

            await _hubContext.Clients.Group("MessageLogGroup")
                .SendAsync("MessageCreated", notificationData);

            _logger.LogInformation("Sent real-time notification for message {MessageId} to MessageLogGroup", message.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send real-time notification for message {MessageId}", message.Id);
        }
    }
}