using Microsoft.Extensions.Logging;

namespace Commerce.Services.Shared.Infrastructure.Logging;

/// <summary>
/// Structured logging extensions for commerce platform events
/// </summary>
public static class LoggingExtensions
{
    // Product MDM Events
    public static void LogProductWorkflowTransition(this ILogger logger, string productSku, string fromStage, string toStage, string userId)
    {
        logger.LogInformation("Product workflow transition: {ProductSku} moved from {FromStage} to {ToStage} by user {UserId}",
            productSku, fromStage, toStage, userId);
    }
    
    public static void LogProductApproval(this ILogger logger, string productId, string approverRole, string userId)
    {
        logger.LogInformation("Product approved: {ProductId} approved by {ApproverRole} user {UserId}",
            productId, approverRole, userId);
    }
    
    public static void LogProductLaunch(this ILogger logger, string productSku)
    {
        logger.LogInformation("Product launched: {ProductSku} published to staging environment", productSku);
    }
    
    // Customer Events
    public static void LogCustomerRegistration(this ILogger logger, string customerId, string customerEmail)
    {
        logger.LogInformation("Customer registered: {CustomerId} with email {CustomerEmail}", customerId, customerEmail);
    }
    
    public static void LogSecurityEvent(this ILogger logger, string eventType, string customerId, string details)
    {
        logger.LogWarning("Security event: {EventType} for customer {CustomerId} - {Details}", eventType, customerId, details);
    }
    
    // Performance Events
    public static void LogSlowOperation(this ILogger logger, string operationName, long elapsedMs, long thresholdMs)
    {
        logger.LogWarning("Slow operation detected: {OperationName} took {ElapsedMs}ms (threshold: {ThresholdMs}ms)",
            operationName, elapsedMs, thresholdMs);
    }
    
    // Business Logic Errors
    public static void LogBusinessRuleViolation(this ILogger logger, string entity, string entityId, string rule, string details)
    {
        logger.LogError("Business rule violation: {Entity} {EntityId} violated rule {Rule} - {Details}",
            entity, entityId, rule, details);
    }
    
    // Integration Events
    public static void LogExternalServiceCall(this ILogger logger, string serviceName, string endpoint, long responseTimeMs, bool success)
    {
        if (success)
        {
            logger.LogInformation("External service call: {ServiceName} {Endpoint} completed in {ResponseTimeMs}ms",
                serviceName, endpoint, responseTimeMs);
        }
        else
        {
            logger.LogError("External service call failed: {ServiceName} {Endpoint} after {ResponseTimeMs}ms",
                serviceName, endpoint, responseTimeMs);
        }
    }
    
    // Inventory Events
    public static void LogInventoryLow(this ILogger logger, string productSku, int currentQuantity, int threshold)
    {
        logger.LogWarning("Low inventory: Product {ProductSku} has {CurrentQuantity} units (threshold: {Threshold})",
            productSku, currentQuantity, threshold);
    }
    
    // Order Events
    public static void LogOrderCreated(this ILogger logger, string orderId, string customerId, decimal orderTotal)
    {
        logger.LogInformation("Order created: {OrderId} for customer {CustomerId} with total {OrderTotal:C}",
            orderId, customerId, orderTotal);
    }
    
    public static void LogOrderStatusChanged(this ILogger logger, string orderId, string fromStatus, string toStatus)
    {
        logger.LogInformation("Order status changed: {OrderId} from {FromStatus} to {ToStatus}",
            orderId, fromStatus, toStatus);
    }
}