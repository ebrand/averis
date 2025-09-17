using Commerce.Services.Shared.Models.DTOs;
using System.Text;
using System.Text.Json;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Service for logging messages to the central averis_system.messages table via System API
/// </summary>
public class CentralMessageLogService : ICentralMessageLogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CentralMessageLogService> _logger;
    private readonly string _systemApiUrl;
    private readonly string _sourceSystem;

    public CentralMessageLogService(
        HttpClient httpClient, 
        ILogger<CentralMessageLogService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _systemApiUrl = configuration.GetValue<string>("SystemApi:BaseUrl") ?? "http://localhost:6012";
        _sourceSystem = configuration.GetValue<string>("SystemApi:SourceSystem") ?? "product-mdm";
        
        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_systemApiUrl);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "ProductMdm-Api/1.0");
    }

    public async Task LogPublishedMessageAsync(
        string eventType, 
        ProductDto product, 
        string? correlationId = null, 
        int? processingTimeMs = null, 
        string? errorMessage = null)
    {
        await LogMessageAsync(
            messageType: "published",
            eventType: eventType,
            product: product,
            correlationId: correlationId,
            processingTimeMs: processingTimeMs,
            retryCount: 0,
            errorMessage: errorMessage);
    }

    public async Task LogConsumedMessageAsync(
        string eventType, 
        ProductDto product, 
        string? correlationId = null, 
        int? processingTimeMs = null, 
        int retryCount = 0, 
        string? errorMessage = null)
    {
        await LogMessageAsync(
            messageType: "consumed",
            eventType: eventType,
            product: product,
            correlationId: correlationId,
            processingTimeMs: processingTimeMs,
            retryCount: retryCount,
            errorMessage: errorMessage);
    }

    private async Task LogMessageAsync(
        string messageType,
        string eventType,
        ProductDto product,
        string? correlationId = null,
        int? processingTimeMs = null,
        int retryCount = 0,
        string? errorMessage = null)
    {
        _logger.LogInformation("🔄 CENTRAL LOG ATTEMPT: {MessageType} message for {EventType} - Product {ProductId}",
            messageType, eventType, product.Id);
        
        try
        {
            var logEntry = new
            {
                MessageType = messageType,
                SourceSystem = _sourceSystem,
                EventType = eventType,
                CorrelationId = correlationId ?? $"corr-{eventType.Replace(".", "-")}-{product.Id}",
                ProductId = product.Id,
                ProductSku = product.Sku,
                ProductName = product.Name,
                MessagePayload = new
                {
                    ProductId = product.Id,
                    Action = eventType.Replace("product.", ""),
                    Timestamp = DateTime.UtcNow.ToString("O"),
                    ProductData = new
                    {
                        product.Id,
                        product.Sku,
                        product.Name,
                        product.Status,
                        product.Description
                    }
                },
                ProcessingTimeMs = processingTimeMs,
                RetryCount = retryCount,
                ErrorMessage = errorMessage
            };

            var json = JsonSerializer.Serialize(logEntry, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/products/messages", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("✅ CENTRAL LOG SUCCESS: {MessageType} message for {EventType} - Product {ProductId}",
                    messageType, eventType, product.Id);
            }
            else
            {
                _logger.LogWarning("Failed to log {MessageType} message for {EventType} - Product {ProductId}. Status: {StatusCode}",
                    messageType, eventType, product.Id, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging {MessageType} message for {EventType} - Product {ProductId}",
                messageType, eventType, product.Id);
            
            // Don't throw - message logging shouldn't break the main flow
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/health");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Central message log service health check failed");
            return false;
        }
    }
}