using NATS.Client.Core;
using System.Text.Json;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.CustomerMdm.Api.Services;

/// <summary>
/// Service for publishing customer events to NATS streaming server for customer staging synchronization
/// </summary>
public class CustomerMessageService : ICustomerMessageService
{
    private readonly NatsConnection _natsConnection;
    private readonly ILogger<CustomerMessageService> _logger;
    private readonly string _subjectPrefix;

    public CustomerMessageService(ILogger<CustomerMessageService> logger, IConfiguration configuration)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        var natsUrl = configuration.GetValue<string>("NATS:Url") ?? "nats://localhost:4222";
        var subjectPrefix = configuration.GetValue<string>("NATS:CustomerSubjectPrefix") ?? "customer";
        
        _subjectPrefix = subjectPrefix;
        
        var options = new NatsOpts
        {
            Url = natsUrl,
            Name = "customer-mdm",
            ConnectTimeout = TimeSpan.FromSeconds(10)
        };
        
        _natsConnection = new NatsConnection(options);
        
        _logger.LogInformation("Customer Message Service: Initializing with NATS URL: {NatsUrl}, Subject Prefix: {SubjectPrefix}", 
            natsUrl, _subjectPrefix);
    }

    public async Task PublishCustomerCreatedAsync(Customer customer)
    {
        try
        {
            var subject = $"{_subjectPrefix}.created";
            var message = new
            {
                customerId = customer.Id,
                action = "created",
                timestamp = DateTime.UtcNow.ToString("O"),
                customerData = customer
            };

            var messageJson = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await _natsConnection.PublishAsync(subject, messageJson);
            
            _logger.LogInformation("Customer Message Service: Published customer.created message for customer {CustomerId} ({CustomerEmail})",
                customer.Id, customer.Email);
                
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Customer Message Service: Failed to publish customer.created message for customer {CustomerId}",
                customer.Id);
            throw;
        }
    }

    public async Task PublishCustomerUpdatedAsync(Customer customer)
    {
        try
        {
            var subject = $"{_subjectPrefix}.updated";
            var message = new
            {
                customerId = customer.Id,
                action = "updated",
                timestamp = DateTime.UtcNow.ToString("O"),
                customerData = customer
            };

            var messageJson = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await _natsConnection.PublishAsync(subject, messageJson);
            
            _logger.LogInformation("Customer Message Service: Published customer.updated message for customer {CustomerId} ({CustomerEmail})",
                customer.Id, customer.Email);
                
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Customer Message Service: Failed to publish customer.updated message for customer {CustomerId}",
                customer.Id);
            throw;
        }
    }

    public async Task PublishCustomerDeletedAsync(Guid customerId, string customerEmail)
    {
        try
        {
            var subject = $"{_subjectPrefix}.deleted";
            var message = new
            {
                customerId = customerId,
                customerEmail = customerEmail,
                action = "deleted",
                timestamp = DateTime.UtcNow.ToString("O")
            };

            var messageJson = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await _natsConnection.PublishAsync(subject, messageJson);
            
            _logger.LogInformation("Customer Message Service: Published customer.deleted message for customer {CustomerId} ({CustomerEmail})",
                customerId, customerEmail);
                
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Customer Message Service: Failed to publish customer.deleted message for customer {CustomerId}",
                customerId);
            throw;
        }
    }

    public async Task<bool> HealthCheckAsync()
    {
        try
        {
            // Simple health check - test connection state
            return _natsConnection.ConnectionState == NatsConnectionState.Open;
        }
        catch
        {
            return false;
        }
    }

    public async ValueTask DisposeAsync()
    {
        try
        {
            if (_natsConnection != null)
            {
                await _natsConnection.DisposeAsync();
                _logger.LogInformation("Customer Message Service: NATS connection disposed");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Customer Message Service: Error disposing NATS connection");
        }
    }
}