using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Commerce.Services.SystemApi.Api.Models;

/// <summary>
/// Message entity for centralized message logging in the averis_system schema
/// Updated to match existing database schema
/// </summary>
[Table("messages", Schema = "averis_system")]
public class Message
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("message_type")]
    [MaxLength(100)]
    public string MessageType { get; set; } = string.Empty;

    [Required]
    [Column("source_system")]
    [MaxLength(100)]
    public string SourceSystem { get; set; } = string.Empty;

    [Column("target_system")]
    [MaxLength(100)]
    public string? TargetSystem { get; set; }

    [Required]
    [Column("payload", TypeName = "jsonb")]
    public string PayloadJson { get; set; } = string.Empty;

    [Column("status")]
    [MaxLength(50)]
    public string? Status { get; set; } = "pending";

    [Column("retry_count")]
    public int RetryCount { get; set; } = 0;

    [Column("error_message")]
    public string? ErrorMessage { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("processed_at")]
    public DateTime? ProcessedAt { get; set; }

    // Legacy properties for backward compatibility with existing controller logic
    [NotMapped]
    public string EventType => GetEventTypeFromPayload();

    [NotMapped] 
    public string? CorrelationId => GetCorrelationIdFromPayload();

    [NotMapped]
    public Guid? ProductId => GetProductIdFromPayload();

    [NotMapped]
    public string? ProductSku => GetProductSkuFromPayload();

    [NotMapped]
    public string? ProductName => GetProductNameFromPayload();

    [NotMapped]
    public string? MessagePayloadJson => PayloadJson;

    [NotMapped]
    public int? ProcessingTimeMs => CalculateProcessingTime();

    [NotMapped]
    public DateTime UpdatedAt => ProcessedAt ?? CreatedAt;

    /// <summary>
    /// Gets or sets the message payload as a strongly-typed object
    /// </summary>
    [NotMapped]
    public object? MessagePayload
    {
        get => string.IsNullOrEmpty(PayloadJson) ? null : JsonSerializer.Deserialize<object>(PayloadJson);
        set => PayloadJson = value == null ? "{}" : JsonSerializer.Serialize(value);
    }

    // Helper methods to extract data from JSON payload for backward compatibility
    private string GetEventTypeFromPayload()
    {
        try
        {
            if (string.IsNullOrEmpty(PayloadJson)) return MessageType;
            
            using var document = JsonDocument.Parse(PayloadJson);
            if (document.RootElement.TryGetProperty("eventType", out var eventType))
                return eventType.GetString() ?? MessageType;
            if (document.RootElement.TryGetProperty("event_type", out var eventType2))
                return eventType2.GetString() ?? MessageType;
            
            return MessageType;
        }
        catch
        {
            return MessageType;
        }
    }

    private string? GetCorrelationIdFromPayload()
    {
        try
        {
            if (string.IsNullOrEmpty(PayloadJson)) return null;
            
            using var document = JsonDocument.Parse(PayloadJson);
            if (document.RootElement.TryGetProperty("correlationId", out var correlationId))
                return correlationId.GetString();
            if (document.RootElement.TryGetProperty("correlation_id", out var correlationId2))
                return correlationId2.GetString();
            
            return null;
        }
        catch
        {
            return null;
        }
    }

    private Guid? GetProductIdFromPayload()
    {
        try
        {
            if (string.IsNullOrEmpty(PayloadJson)) return null;
            
            using var document = JsonDocument.Parse(PayloadJson);
            if (document.RootElement.TryGetProperty("productId", out var productId))
            {
                var productIdStr = productId.GetString();
                return Guid.TryParse(productIdStr, out var guid) ? guid : null;
            }
            if (document.RootElement.TryGetProperty("product_id", out var productId2))
            {
                var productIdStr = productId2.GetString();
                return Guid.TryParse(productIdStr, out var guid) ? guid : null;
            }
            
            return null;
        }
        catch
        {
            return null;
        }
    }

    private string? GetProductSkuFromPayload()
    {
        try
        {
            if (string.IsNullOrEmpty(PayloadJson)) return null;
            
            using var document = JsonDocument.Parse(PayloadJson);
            if (document.RootElement.TryGetProperty("productSku", out var sku))
                return sku.GetString();
            if (document.RootElement.TryGetProperty("product_sku", out var sku2))
                return sku2.GetString();
            if (document.RootElement.TryGetProperty("sku", out var sku3))
                return sku3.GetString();
            
            return null;
        }
        catch
        {
            return null;
        }
    }

    private string? GetProductNameFromPayload()
    {
        try
        {
            if (string.IsNullOrEmpty(PayloadJson)) return null;
            
            using var document = JsonDocument.Parse(PayloadJson);
            if (document.RootElement.TryGetProperty("productName", out var name))
                return name.GetString();
            if (document.RootElement.TryGetProperty("product_name", out var name2))
                return name2.GetString();
            if (document.RootElement.TryGetProperty("name", out var name3))
                return name3.GetString();
            
            return null;
        }
        catch
        {
            return null;
        }
    }

    private int? CalculateProcessingTime()
    {
        if (ProcessedAt.HasValue)
        {
            return (int)(ProcessedAt.Value - CreatedAt).TotalMilliseconds;
        }
        return null;
    }
}

/// <summary>
/// Message types for the message_type column
/// </summary>
public static class MessageTypes
{
    public const string Published = "published";
    public const string Consumed = "consumed";
}

/// <summary>
/// Source systems for the source_system column  
/// </summary>
public static class SourceSystems
{
    public const string ProductMdm = "product-mdm";
    public const string ProductStaging = "product-staging";
    public const string PricingMdm = "pricing-mdm";
    public const string Ecommerce = "ecommerce";
    public const string Erp = "erp";
    public const string InventoryMdm = "inventory-mdm";
}

/// <summary>
/// Common event types
/// </summary>
public static class EventTypes
{
    public const string ProductCreated = "product.created";
    public const string ProductUpdated = "product.updated";
    public const string ProductLaunched = "product.launched";
    public const string ProductDeactivated = "product.deactivated";
    public const string ProductDeleted = "product.deleted";
}