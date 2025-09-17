using Commerce.Services.Shared.Models.DTOs;
using NATS.Net;
using NATS.Client.Core;
using System.Text;
using System.Text.Json;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Service for publishing product-related messages to NATS
/// Publishes to product.* subjects for consumption by downstream services
/// </summary>
public class ProductMessageService : IProductMessageService, IDisposable
{
    private readonly ILogger<ProductMessageService> _logger;
    private readonly ICentralMessageLogService _centralMessageLogService;
    private readonly NatsConnection? _natsConnection;
    private readonly string _subjectPrefix;
    private bool _disposed = false;

    public ProductMessageService(
        ILogger<ProductMessageService> logger, 
        IConfiguration configuration,
        ICentralMessageLogService centralMessageLogService)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _centralMessageLogService = centralMessageLogService ?? throw new ArgumentNullException(nameof(centralMessageLogService));
        
        try
        {
            // Get NATS configuration
            var natsHost = configuration.GetValue<string>("NATS:Host") ?? "localhost";
            var natsPort = configuration.GetValue<int>("NATS:Port", 4222);
            var natsUrl = $"nats://{natsHost}:{natsPort}";
            
            _subjectPrefix = configuration.GetValue<string>("NATS:SubjectPrefix") ?? "product";

            _logger.LogInformation("Initializing ProductMessageService - NATS URL: {NatsUrl}, Subject Prefix: {SubjectPrefix}", 
                natsUrl, _subjectPrefix);

            // Create NATS connection options
            var opts = new NatsOpts
            {
                Url = natsUrl,
                Name = "ProductMdmApi"
            };

            // Create NATS connection
            _natsConnection = new NatsConnection(opts);

            _logger.LogInformation("ProductMessageService initialized successfully with NATS");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize ProductMessageService");
            _natsConnection?.DisposeAsync().AsTask().Wait();
            throw;
        }
    }

    public async Task PublishProductCreatedAsync(ProductDto product)
    {
        await PublishMessageAsync("product.created", product, "created");
    }

    public async Task PublishProductUpdatedAsync(ProductDto product, ProductDto existingProduct)
    {
        // Check if this is a status change to active (launched)
        if (product.Status == "active" && existingProduct.Status != "active")
        {
            await PublishProductLaunchedAsync(product);
        }
        // Check if this is a status change from active (deactivated)
        else if (product.Status != "active" && existingProduct.Status == "active")
        {
            await PublishProductDeactivatedAsync(product);
        }
        else
        {
            await PublishMessageAsync("product.updated", product, "updated");
        }
    }

    public async Task PublishProductDeletedAsync(ProductDto product)
    {
        await PublishMessageAsync("product.deleted", product, "deleted");
    }

    public async Task PublishProductLaunchedAsync(ProductDto product)
    {
        _logger.LogInformation("Publishing product launched message for: {ProductName} ({ProductId})", 
            product.Name, product.Id);
        await PublishMessageAsync("product.launched", product, "launched");
    }

    public async Task PublishProductDeactivatedAsync(ProductDto product)
    {
        await PublishMessageAsync("product.deactivated", product, "deactivated");
    }

    private async Task PublishMessageAsync(string subject, ProductDto product, string eventType)
    {
        if (_natsConnection == null)
        {
            _logger.LogWarning("Cannot publish message - NATS connection not available");
            return;
        }

        try
        {
            var message = new
            {
                eventType,
                timestamp = DateTime.UtcNow,
                source = "product-mdm",
                productId = product.Id,
                sku = product.Sku,
                name = product.Name,
                status = product.Status,
                data = product
            };

            var messageBody = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var messageId = Guid.NewGuid().ToString();
            var headers = new NatsHeaders
            {
                ["eventType"] = eventType,
                ["productId"] = product.Id.ToString(),
                ["sku"] = product.Sku,
                ["source"] = "product-mdm",
                ["version"] = "1.0",
                ["messageId"] = messageId,
                ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()
            };

            // Publish to NATS subject
            await _natsConnection.PublishAsync(subject, messageBody, headers: headers);

            _logger.LogInformation("Published {EventType} message for product {ProductId} ({Sku}) to subject {Subject}", 
                eventType, product.Id, product.Sku, subject);

            // Log to central message table
            _ = Task.Run(async () =>
            {
                try
                {
                    await _centralMessageLogService.LogPublishedMessageAsync(
                        subject, 
                        product, 
                        messageId);
                }
                catch (Exception logEx)
                {
                    _logger.LogWarning(logEx, "Failed to log published message to central log");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish {EventType} message for product {ProductId}", 
                eventType, product.Id);
            throw;
        }
    }

    public Task<bool> IsHealthyAsync()
    {
        try
        {
            return Task.FromResult(_natsConnection != null && _natsConnection.ConnectionState == NatsConnectionState.Open);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for ProductMessageService");
            return Task.FromResult(false);
        }
    }

    public void Dispose()
    {
        if (_disposed) return;

        try
        {
            _logger.LogInformation("Disposing ProductMessageService");
            
            _natsConnection?.DisposeAsync().AsTask().Wait(TimeSpan.FromSeconds(5));
            
            _logger.LogInformation("ProductMessageService disposed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disposing ProductMessageService");
        }
        finally
        {
            _disposed = true;
        }
    }
}