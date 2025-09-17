using Commerce.Services.SystemApi.Api.Models;

namespace Commerce.Services.SystemApi.Api.Services;

public interface IMessageNotificationService
{
    Task NotifyMessageCreatedAsync(Message message);
}