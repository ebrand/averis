using Commerce.Services.SystemApi.Api.Data;
using Commerce.Services.SystemApi.Api.Models;
using Commerce.Services.SystemApi.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.SystemApi.Api.Controllers;

/// <summary>
/// Controller for managing centralized message logs
/// </summary>
[ApiController]
[Route("products/messages")]
public class MessagesController : ControllerBase
{
    private readonly SystemDbContext _context;
    private readonly ILogger<MessagesController> _logger;
    private readonly IMessageNotificationService _notificationService;

    public MessagesController(
        SystemDbContext context, 
        ILogger<MessagesController> logger,
        IMessageNotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Get messages with filtering and pagination
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="limit">Items per page (max 100)</param>
    /// <param name="messageType">Filter by message type (published/consumed)</param>
    /// <param name="sourceSystem">Filter by source system</param>
    /// <param name="eventType">Filter by event type</param>
    /// <param name="productId">Filter by product ID</param>
    /// <param name="search">Search in product name or SKU</param>
    /// <param name="hoursBack">Show messages from the last N hours (default: 24)</param>
    /// <returns>Paginated list of messages</returns>
    [HttpGet]
    public async Task<ActionResult<MessageLogResponse>> GetMessages(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 25,
        [FromQuery] string? messageType = null,
        [FromQuery] string? sourceSystem = null,
        [FromQuery] string? eventType = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? search = null,
        [FromQuery] int hoursBack = 24)
    {
        try
        {
            // Validate parameters
            if (page < 1) page = 1;
            if (limit < 1) limit = 25;
            if (limit > 100) limit = 100;

            var query = _context.Messages.AsQueryable();

            // Filter by time window
            var cutoffTime = DateTime.UtcNow.AddHours(-hoursBack);
            query = query.Where(m => m.CreatedAt >= cutoffTime);

            // Apply filters
            if (!string.IsNullOrWhiteSpace(messageType))
            {
                query = query.Where(m => m.MessageType == messageType);
            }

            if (!string.IsNullOrWhiteSpace(sourceSystem))
            {
                query = query.Where(m => m.SourceSystem == sourceSystem);
            }

            if (!string.IsNullOrWhiteSpace(eventType))
            {
                query = query.Where(m => m.EventType == eventType);
            }

            if (productId.HasValue)
            {
                query = query.Where(m => m.ProductId == productId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower();
                query = query.Where(m => 
                    (m.ProductName != null && EF.Functions.ILike(m.ProductName, $"%{searchTerm}%")) ||
                    (m.ProductSku != null && EF.Functions.ILike(m.ProductSku, $"%{searchTerm}%")) ||
                    EF.Functions.ILike(m.EventType, $"%{searchTerm}%") ||
                    EF.Functions.ILike(m.SourceSystem, $"%{searchTerm}%"));
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination and ordering
            var messages = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(m => new MessageDto
                {
                    Id = m.Id.ToString(),
                    Timestamp = m.CreatedAt,
                    Type = m.EventType,
                    Status = m.MessageType, // published/consumed maps to status
                    Source = m.SourceSystem == "product-mdm" ? "Product MDM" : 
                            m.SourceSystem == "product-staging" ? "Product Staging Ingest" : 
                            m.SourceSystem,
                    ProductId = m.ProductId.HasValue ? m.ProductId.Value.ToString() : null,
                    ProductName = m.ProductName ?? $"Product {m.ProductId}",
                    Sku = m.ProductSku ?? $"SKU-{m.ProductId}",
                    Message = new MessagePayloadDto
                    {
                        CorrelationId = m.CorrelationId ?? $"corr-{m.EventType}-{m.ProductId}",
                        EventType = m.EventType.Replace("product.", ""),
                        Payload = new MessagePayloadDataDto
                        {
                            ProductId = m.ProductId.HasValue ? m.ProductId.Value.ToString() : "",
                            Action = m.EventType.Replace("product.", ""),
                            Timestamp = m.CreatedAt.ToString("O")
                        }
                    },
                    ProcessingTime = m.ProcessingTimeMs ?? 100,
                    RetryCount = m.RetryCount,
                    ErrorMessage = m.ErrorMessage
                })
                .ToListAsync();

            var response = new MessageLogResponse
            {
                Messages = messages,
                Pagination = new PaginationDto
                {
                    Page = page,
                    Limit = limit,
                    Total = totalCount,
                    Pages = (int)Math.Ceiling(totalCount / (double)limit),
                    HasNext = (page * limit) < totalCount,
                    HasPrev = page > 1
                },
                Metadata = new MessageMetadataDto
                {
                    Sources = await GetSourcesSummary(messageType, sourceSystem, eventType, productId, search, hoursBack),
                    LastUpdated = DateTime.UtcNow.ToString("O")
                }
            };

            _logger.LogInformation("Retrieved {Count} messages (page {Page}, limit {Limit})", 
                messages.Count, page, limit);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving messages");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new message log entry
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MessageDto>> CreateMessage([FromBody] CreateMessageRequest request)
    {
        try
        {
            // Build the payload JSON with all the legacy fields for backward compatibility
            var payload = new Dictionary<string, object?>
            {
                ["eventType"] = request.EventType,
                ["correlationId"] = request.CorrelationId,
                ["productId"] = request.ProductId?.ToString(),
                ["productSku"] = request.ProductSku,
                ["productName"] = request.ProductName
            };

            // Add any additional payload data
            if (request.MessagePayload != null)
            {
                payload["payload"] = request.MessagePayload;
            }

            var message = new Message
            {
                MessageType = request.MessageType,
                SourceSystem = request.SourceSystem,
                PayloadJson = System.Text.Json.JsonSerializer.Serialize(payload),
                RetryCount = request.RetryCount ?? 0,
                ErrorMessage = request.ErrorMessage,
                CreatedAt = DateTime.UtcNow
            };

            // Set ProcessedAt if this is a consumed message and processing time is provided
            if (request.MessageType == "consumed" && request.ProcessingTimeMs.HasValue)
            {
                message.ProcessedAt = DateTime.UtcNow;
            }

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created message log entry: {MessageType} {EventType} for product {ProductId}", 
                message.MessageType, message.EventType, message.ProductId);

            // Send real-time notification to connected clients
            try
            {
                await _notificationService.NotifyMessageCreatedAsync(message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send real-time notification for message {MessageId}", message.Id);
            }

            return Ok(new { success = true, messageId = message.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating message log entry");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get message statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetMessageStats([FromQuery] int hoursBack = 24)
    {
        try
        {
            var cutoffTime = DateTime.UtcNow.AddHours(-hoursBack);

            var stats = await _context.Messages
                .Where(m => m.CreatedAt >= cutoffTime)
                .GroupBy(m => new { m.MessageType, m.SourceSystem })
                .Select(g => new
                {
                    MessageType = g.Key.MessageType,
                    SourceSystem = g.Key.SourceSystem,
                    Count = g.Count(),
                    LastMessage = g.Max(m => m.CreatedAt)
                })
                .ToListAsync();

            return Ok(new
            {
                timeWindow = $"Last {hoursBack} hours",
                stats = stats,
                generatedAt = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving message statistics");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private async Task<Dictionary<string, int>> GetSourcesSummary(
        string? messageType = null, 
        string? sourceSystem = null, 
        string? eventType = null, 
        Guid? productId = null, 
        string? search = null, 
        int hoursBack = 24)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hoursBack);
        var query = _context.Messages.Where(m => m.CreatedAt >= cutoffTime);

        // Apply same filters as main query
        if (!string.IsNullOrWhiteSpace(messageType))
            query = query.Where(m => m.MessageType == messageType);
        if (!string.IsNullOrWhiteSpace(sourceSystem))
            query = query.Where(m => m.SourceSystem == sourceSystem);
        if (!string.IsNullOrWhiteSpace(eventType))
            query = query.Where(m => m.EventType == eventType);
        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLower();
            query = query.Where(m => 
                (m.ProductName != null && EF.Functions.ILike(m.ProductName, $"%{searchTerm}%")) ||
                (m.ProductSku != null && EF.Functions.ILike(m.ProductSku, $"%{searchTerm}%")) ||
                EF.Functions.ILike(m.EventType, $"%{searchTerm}%") ||
                EF.Functions.ILike(m.SourceSystem, $"%{searchTerm}%"));
        }

        var summary = await query
            .GroupBy(m => m.SourceSystem == "product-mdm" ? "Product MDM" : 
                         m.SourceSystem == "product-staging" ? "Product Staging Ingest" : 
                         m.SourceSystem)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        // Ensure default entries
        if (!summary.ContainsKey("Product MDM"))
            summary["Product MDM"] = 0;
        if (!summary.ContainsKey("Product Staging Ingest"))
            summary["Product Staging Ingest"] = 0;

        return summary;
    }
}

#region DTOs

public class MessageLogResponse
{
    public List<MessageDto> Messages { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
    public MessageMetadataDto Metadata { get; set; } = new();
}

public class MessageDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public MessagePayloadDto Message { get; set; } = new();
    public int ProcessingTime { get; set; }
    public int RetryCount { get; set; }
    public string? ErrorMessage { get; set; }
}

public class MessagePayloadDto
{
    public string CorrelationId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public MessagePayloadDataDto Payload { get; set; } = new();
}

public class MessagePayloadDataDto
{
    public string ProductId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

public class PaginationDto
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int Pages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrev { get; set; }
}

public class MessageMetadataDto
{
    public Dictionary<string, int> Sources { get; set; } = new();
    public string LastUpdated { get; set; } = string.Empty;
}

public class CreateMessageRequest
{
    [Required]
    public string MessageType { get; set; } = string.Empty;
    
    [Required]
    public string SourceSystem { get; set; } = string.Empty;
    
    [Required]
    public string EventType { get; set; } = string.Empty;
    
    public string? CorrelationId { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductSku { get; set; }
    public string? ProductName { get; set; }
    public object? MessagePayload { get; set; }
    public int? ProcessingTimeMs { get; set; }
    public int? RetryCount { get; set; }
    public string? ErrorMessage { get; set; }
}

#endregion