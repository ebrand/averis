using System.Text;
using System.Text.Json;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Service for streaming real-time log entries to the System API for dashboard display
/// </summary>
public class RealTimeLogService : IRealTimeLogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RealTimeLogService> _logger;
    private readonly string _systemApiUrl;
    private readonly string _serviceName;

    public RealTimeLogService(
        HttpClient httpClient,
        ILogger<RealTimeLogService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _systemApiUrl = configuration.GetValue<string>("SystemApi:BaseUrl") ?? "http://localhost:6012";
        _serviceName = configuration.GetValue<string>("SystemApi:ServiceName") ?? "Product MDM API";
        
        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_systemApiUrl);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "ProductMdm-Api/1.0");
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
                Console.WriteLine($"Failed to stream log to dashboard: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            // Don't log this failure to avoid recursion, just use console
            Console.WriteLine($"Error streaming log to dashboard: {ex.Message}");
        }
    }

    public async Task StreamBusinessEventAsync(string eventType, string details, string level = "INFO")
    {
        var message = $"Business Event: {eventType} - {details}";
        await StreamLogAsync(level, "ProductMdm.BusinessEvents", message);
    }

    public async Task StreamProductWorkflowTransitionAsync(string productSku, string fromStatus, string toStatus, string userId)
    {
        var message = $"Product workflow transition: {productSku} moved from {fromStatus} to {toStatus} by user {userId}";
        await StreamLogAsync("WARNING", "ProductMdm.Workflow", message);
    }

    public async Task StreamProductLaunchAsync(string productSku)
    {
        var message = $"Product launched: {productSku} published to staging environment";
        await StreamLogAsync("WARNING", "ProductMdm.Launch", message);
    }

    public async Task StreamPerformanceWarningAsync(string operation, long elapsedMs, long thresholdMs)
    {
        var message = $"Slow operation detected: {operation} took {elapsedMs}ms (threshold: {thresholdMs}ms)";
        await StreamLogAsync("WARNING", "ProductMdm.Performance", message);
    }

    public async Task StreamErrorAsync(string operation, string error, Exception? exception = null)
    {
        var message = $"Operation failed: {operation} - {error}";
        await StreamLogAsync("ERROR", "ProductMdm.Error", message, exception);
    }

    public async Task StreamMemoryPressureAsync(long memoryUsageMB, long thresholdMB)
    {
        var message = $"High memory usage detected: {memoryUsageMB}MB (threshold: {thresholdMB}MB)";
        await StreamLogAsync("ERROR", "ProductMdm.Memory", message);
    }

    public async Task StreamTimeoutAsync(string operation, int timeoutMs)
    {
        var message = $"Operation timeout: {operation} exceeded {timeoutMs}ms timeout";
        await StreamLogAsync("ERROR", "ProductMdm.Timeout", message);
    }

    public async Task StreamResourceWarningAsync(string resourceType, string details)
    {
        var message = $"Resource warning: {resourceType} - {details}";
        await StreamLogAsync("WARNING", "ProductMdm.Resources", message);
    }
}