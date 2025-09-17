using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Interface for logging messages to the central averis_system.messages table
/// </summary>
public interface ICentralMessageLogService
{
    /// <summary>
    /// Log a published message to the central message table
    /// </summary>
    /// <param name="eventType">Type of event (e.g., product.launched)</param>
    /// <param name="product">Product involved in the event</param>
    /// <param name="correlationId">Correlation ID for tracking</param>
    /// <param name="processingTimeMs">Processing time in milliseconds</param>
    /// <param name="errorMessage">Error message if any</param>
    /// <returns>Task representing the async operation</returns>
    Task LogPublishedMessageAsync(
        string eventType, 
        ProductDto product, 
        string? correlationId = null,
        int? processingTimeMs = null, 
        string? errorMessage = null);

    /// <summary>
    /// Log a consumed message to the central message table
    /// </summary>
    /// <param name="eventType">Type of event (e.g., product.launched)</param>
    /// <param name="product">Product involved in the event</param>
    /// <param name="correlationId">Correlation ID for tracking</param>
    /// <param name="processingTimeMs">Processing time in milliseconds</param>
    /// <param name="retryCount">Number of retry attempts</param>
    /// <param name="errorMessage">Error message if any</param>
    /// <returns>Task representing the async operation</returns>
    Task LogConsumedMessageAsync(
        string eventType, 
        ProductDto product, 
        string? correlationId = null,
        int? processingTimeMs = null, 
        int retryCount = 0,
        string? errorMessage = null);

    /// <summary>
    /// Check if the central message log service is available
    /// </summary>
    /// <returns>True if available, false otherwise</returns>
    Task<bool> IsHealthyAsync();
}