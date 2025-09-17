using System.Text;
using System.Text.Json;

namespace Commerce.Services.CustomerMdm.Api.Services;

/// <summary>
/// Service for streaming real-time customer log entries to the System API for dashboard display
/// </summary>
public class CustomerRealTimeLogService : ICustomerRealTimeLogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CustomerRealTimeLogService> _logger;
    private readonly string _systemApiUrl;
    private readonly string _serviceName;

    public CustomerRealTimeLogService(
        HttpClient httpClient,
        ILogger<CustomerRealTimeLogService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _systemApiUrl = configuration.GetValue<string>("SystemApi:BaseUrl") ?? "http://localhost:6012";
        _serviceName = configuration.GetValue<string>("SystemApi:ServiceName") ?? "Customer MDM API";
        
        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_systemApiUrl);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "CustomerMdm-Api/1.0");
    }

    public async Task StreamLogAsync(string level, string source, string message, Exception? exception = null)
    {
        try
        {
            var logEntry = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                level = level,
                source = source,
                message = message,
                service = _serviceName,
                exception = exception?.ToString()
            };

            var json = JsonSerializer.Serialize(logEntry, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Send to System API log streaming endpoint
            var response = await _httpClient.PostAsync("/api/logs/push", content);

            if (!response.IsSuccessStatusCode)
            {
                // Don't log this failure to avoid recursion, just use console
                Console.WriteLine($"Failed to stream customer log to dashboard: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            // Don't log this failure to avoid recursion, just use console
            Console.WriteLine($"Error streaming customer log to dashboard: {ex.Message}");
        }
    }

    public async Task StreamCustomerWorkflowEventAsync(string eventType, string customerId, string customerEmail, string details)
    {
        var message = $"Customer {eventType}: {customerEmail} ({customerId}) - {details}";
        await StreamLogAsync("WARNING", "CustomerMdm.Workflow", message);
    }

    public async Task StreamCustomerCreatedAsync(string customerId, string customerEmail)
    {
        var message = $"Customer created: {customerEmail} ({customerId})";
        await StreamLogAsync("WARNING", "CustomerMdm.Lifecycle", message);
    }

    public async Task StreamCustomerUpdatedAsync(string customerId, string customerEmail)
    {
        var message = $"Customer updated: {customerEmail} ({customerId})";
        await StreamLogAsync("WARNING", "CustomerMdm.Lifecycle", message);
    }

    public async Task StreamCustomerDeletedAsync(string customerId, string customerEmail)
    {
        var message = $"Customer deleted: {customerEmail} ({customerId})";
        await StreamLogAsync("ERROR", "CustomerMdm.Lifecycle", message);
    }

    public async Task StreamErrorAsync(string operation, string error, Exception? exception = null)
    {
        var message = $"Customer operation failed: {operation} - {error}";
        await StreamLogAsync("ERROR", "CustomerMdm.Error", message, exception);
    }
}