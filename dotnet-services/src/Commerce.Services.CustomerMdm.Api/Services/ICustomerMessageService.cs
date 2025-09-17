using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.CustomerMdm.Api.Services;

/// <summary>
/// Interface for customer messaging service that publishes customer events to NATS
/// </summary>
public interface ICustomerMessageService : IAsyncDisposable
{
    /// <summary>
    /// Publish a customer created event
    /// </summary>
    Task PublishCustomerCreatedAsync(Customer customer);

    /// <summary>
    /// Publish a customer updated event
    /// </summary>
    Task PublishCustomerUpdatedAsync(Customer customer);

    /// <summary>
    /// Publish a customer deleted event
    /// </summary>
    Task PublishCustomerDeletedAsync(Guid customerId, string customerEmail);

    /// <summary>
    /// Check health of the messaging system
    /// </summary>
    Task<bool> HealthCheckAsync();
}