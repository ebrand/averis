namespace Commerce.Services.CustomerMdm.Api.Services;

/// <summary>
/// Interface for real-time customer log streaming to the System API dashboard
/// </summary>
public interface ICustomerRealTimeLogService
{
    /// <summary>
    /// Stream a log entry to the real-time dashboard
    /// </summary>
    Task StreamLogAsync(string level, string source, string message, Exception? exception = null);

    /// <summary>
    /// Stream a customer workflow event
    /// </summary>
    Task StreamCustomerWorkflowEventAsync(string eventType, string customerId, string customerEmail, string details);

    /// <summary>
    /// Stream a customer created event
    /// </summary>
    Task StreamCustomerCreatedAsync(string customerId, string customerEmail);

    /// <summary>
    /// Stream a customer updated event
    /// </summary>
    Task StreamCustomerUpdatedAsync(string customerId, string customerEmail);

    /// <summary>
    /// Stream a customer deleted event
    /// </summary>
    Task StreamCustomerDeletedAsync(string customerId, string customerEmail);

    /// <summary>
    /// Stream an error event
    /// </summary>
    Task StreamErrorAsync(string operation, string error, Exception? exception = null);
}