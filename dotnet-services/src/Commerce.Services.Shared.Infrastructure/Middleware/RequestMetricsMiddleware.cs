using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Commerce.Services.Shared.Infrastructure.Logging;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Commerce.Services.Shared.Infrastructure.Middleware;

/// <summary>
/// Middleware to track API request metrics including count, response times, and error rates
/// </summary>
public class RequestMetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestMetricsMiddleware> _logger;
    private static readonly ConcurrentDictionary<string, RequestMetrics> _metrics = new();
    private static readonly ConcurrentQueue<RequestLogEntry> _requestLog = new();
    private const int MaxLogEntries = 1000; // Keep last 1000 requests for analysis
    private static readonly HttpClient _httpClient = new(); // Static HTTP client for real-time updates
    private const string SystemApiBaseUrl = "http://localhost:6012"; // System API endpoint

    public RequestMetricsMiddleware(RequestDelegate next, ILogger<RequestMetricsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var startTime = DateTime.UtcNow;
        
        // Skip metrics collection for certain endpoints
        if (ShouldSkipMetrics(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var endpoint = GetEndpointKey(context.Request);
        var serviceName = GetServiceName(context.Request);

        try
        {
            await _next(context);
            
            stopwatch.Stop();
            var responseTime = (int)stopwatch.ElapsedMilliseconds;
            var isError = context.Response.StatusCode >= 400;
            
            // Log slow operations (threshold: 1000ms)
            const int slowRequestThreshold = 1000;
            if (responseTime > slowRequestThreshold)
            {
                _logger.LogSlowOperation($"{endpoint} ({context.Request.Method})", responseTime, slowRequestThreshold);
            }

            // Update metrics
            UpdateMetrics(serviceName, endpoint, responseTime, isError);
            
            // Send real-time update
            SendRealTimeMetricsUpdate(serviceName, endpoint, responseTime, isError);
            
            // Log the request
            LogRequest(serviceName, endpoint, startTime, responseTime, context.Response.StatusCode, null);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            var responseTime = (int)stopwatch.ElapsedMilliseconds;
            
            // Update metrics for error
            UpdateMetrics(serviceName, endpoint, responseTime, true);
            
            // Send real-time update for error
            SendRealTimeMetricsUpdate(serviceName, endpoint, responseTime, true);
            
            // Log the request with error
            LogRequest(serviceName, endpoint, startTime, responseTime, 500, ex.Message);
            
            throw; // Re-throw the exception
        }
    }

    private static bool ShouldSkipMetrics(string path)
    {
        return path.StartsWith("/health") || 
               path.StartsWith("/metrics") || 
               path.StartsWith("/swagger") ||
               path.StartsWith("/_vs/") ||
               path.StartsWith("/api/metrics/push") ||
               path.Contains("favicon.ico");
    }

    private static string GetEndpointKey(HttpRequest request)
    {
        var path = request.Path.Value?.ToLowerInvariant() ?? "/";
        var method = request.Method;
        
        // Normalize paths to remove specific IDs (e.g., /api/products/123 -> /api/products/{id})
        path = NormalizePath(path);
        
        return $"{method} {path}";
    }

    private static string GetServiceName(HttpRequest request)
    {
        // Try to determine service name from request headers or host
        var host = request.Host.Host;
        var port = request.Host.Port;
        
        return port switch
        {
            6001 => "Product MDM API",
            6002 => "Product Staging API", 
            6003 => "Pricing MDM API",
            6004 => "E-commerce API",
            6005 => "OMS API",
            6006 => "ERP API",
            6007 => "Customer MDM API",
            9002 => "Product Staging Ingest",
            _ => $"API ({host}:{port})"
        };
    }

    private static string NormalizePath(string path)
    {
        // Replace common ID patterns with placeholders
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        for (int i = 0; i < segments.Length; i++)
        {
            // If segment looks like a GUID or number, replace with placeholder
            if (Guid.TryParse(segments[i], out _) || 
                int.TryParse(segments[i], out _) ||
                (segments[i].Length > 10 && segments[i].All(c => char.IsLetterOrDigit(c) || c == '-')))
            {
                segments[i] = "{id}";
            }
        }
        return "/" + string.Join("/", segments);
    }

    private static void UpdateMetrics(string serviceName, string endpoint, int responseTime, bool isError)
    {
        var key = $"{serviceName}|{endpoint}";
        
        _metrics.AddOrUpdate(key, 
            new RequestMetrics
            {
                ServiceName = serviceName,
                Endpoint = endpoint,
                TotalRequests = 1,
                TotalResponseTime = responseTime,
                ErrorCount = isError ? 1 : 0,
                LastRequestTime = DateTime.UtcNow
            },
            (_, existing) =>
            {
                existing.TotalRequests++;
                existing.TotalResponseTime += responseTime;
                if (isError) existing.ErrorCount++;
                existing.LastRequestTime = DateTime.UtcNow;
                return existing;
            });
    }

    private static void SendRealTimeMetricsUpdate(string serviceName, string endpoint, int responseTime, bool isError)
    {
        try
        {
            // Get current metrics for this service
            var serviceMetrics = GetServiceMetrics();
            if (serviceMetrics.ContainsKey(serviceName))
            {
                var service = serviceMetrics[serviceName];
                var metricsUpdate = new
                {
                    serviceName = serviceName,
                    endpoint = endpoint,
                    responseTimeMs = responseTime,
                    isError = isError,
                    timestamp = DateTime.UtcNow.ToString("O"),
                    totalRequests = service.TotalRequests,
                    averageResponseTime = service.AverageResponseTime,
                    errorRate = service.ErrorRate
                };

                var json = JsonSerializer.Serialize(metricsUpdate);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Fire and forget - don't block the request pipeline
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _httpClient.PostAsync($"{SystemApiBaseUrl}/api/metrics/push", content);
                    }
                    catch
                    {
                        // Silently ignore failures - metrics streaming is non-critical
                    }
                });
            }
        }
        catch
        {
            // Silently ignore failures - metrics streaming is non-critical
        }
    }

    private static void LogRequest(string serviceName, string endpoint, DateTime startTime, int responseTime, int statusCode, string? errorMessage)
    {
        var logEntry = new RequestLogEntry
        {
            ServiceName = serviceName,
            Endpoint = endpoint,
            Timestamp = startTime,
            ResponseTime = responseTime,
            StatusCode = statusCode,
            ErrorMessage = errorMessage
        };

        _requestLog.Enqueue(logEntry);
        
        // Keep only the most recent entries
        while (_requestLog.Count > MaxLogEntries)
        {
            _requestLog.TryDequeue(out _);
        }
    }

    /// <summary>
    /// Get current metrics for all services
    /// </summary>
    public static Dictionary<string, ServiceMetrics> GetServiceMetrics()
    {
        var serviceMetrics = new Dictionary<string, ServiceMetrics>();
        
        foreach (var kvp in _metrics)
        {
            var metric = kvp.Value;
            var serviceName = metric.ServiceName;
            
            if (!serviceMetrics.ContainsKey(serviceName))
            {
                serviceMetrics[serviceName] = new ServiceMetrics
                {
                    ServiceName = serviceName,
                    TotalRequests = 0,
                    TotalResponseTime = 0,
                    ErrorCount = 0,
                    Endpoints = new List<EndpointMetrics>()
                };
            }

            var service = serviceMetrics[serviceName];
            service.TotalRequests += metric.TotalRequests;
            service.TotalResponseTime += metric.TotalResponseTime;
            service.ErrorCount += metric.ErrorCount;
            
            if (metric.LastRequestTime > service.LastRequestTime)
                service.LastRequestTime = metric.LastRequestTime;

            service.Endpoints.Add(new EndpointMetrics
            {
                Endpoint = metric.Endpoint,
                TotalRequests = metric.TotalRequests,
                AverageResponseTime = metric.TotalRequests > 0 ? metric.TotalResponseTime / metric.TotalRequests : 0,
                ErrorRate = metric.TotalRequests > 0 ? (double)metric.ErrorCount / metric.TotalRequests * 100 : 0,
                LastRequestTime = metric.LastRequestTime
            });
        }

        return serviceMetrics;
    }

    /// <summary>
    /// Get recent request logs for analysis
    /// </summary>
    public static List<RequestLogEntry> GetRecentRequests(int count = 100)
    {
        return _requestLog.TakeLast(count).ToList();
    }

    /// <summary>
    /// Get hourly request data for the last 24 hours
    /// </summary>
    public static List<HourlyMetrics> GetHourlyMetrics()
    {
        var requests = _requestLog.ToList();
        var cutoff = DateTime.UtcNow.AddHours(-24);
        
        return requests
            .Where(r => r.Timestamp >= cutoff)
            .GroupBy(r => new { r.Timestamp.Year, r.Timestamp.Month, r.Timestamp.Day, r.Timestamp.Hour })
            .Select(g => new HourlyMetrics
            {
                Hour = g.Key.Hour,
                Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, 0, 0),
                RequestCount = g.Count(),
                AverageResponseTime = g.Average(r => r.ResponseTime),
                ErrorCount = g.Count(r => r.StatusCode >= 400)
            })
            .OrderBy(h => h.Date)
            .ToList();
    }

    /// <summary>
    /// Reset all metrics counters (for development/testing)
    /// </summary>
    public static void ResetMetrics()
    {
        _metrics.Clear();
        while (_requestLog.TryDequeue(out _)) { }
    }

    /// <summary>
    /// Update metrics for external services (called when receiving metrics push from other APIs)
    /// </summary>
    public static void UpdateExternalServiceMetrics(string serviceName, int totalRequests, double averageResponseTime, double errorRate, DateTime timestamp)
    {
        // Use a special key format for external service aggregates
        var key = $"{serviceName}|EXTERNAL_AGGREGATE";
        
        var errorCount = (int)(totalRequests * errorRate / 100);
        var totalResponseTime = (long)(totalRequests * averageResponseTime);
        
        _metrics.AddOrUpdate(key, 
            new RequestMetrics
            {
                ServiceName = serviceName,
                Endpoint = "EXTERNAL_AGGREGATE",
                TotalRequests = totalRequests,
                TotalResponseTime = totalResponseTime,
                ErrorCount = errorCount,
                LastRequestTime = timestamp
            },
            (_, existing) =>
            {
                // For external aggregates, replace rather than accumulate to avoid double-counting
                existing.TotalRequests = totalRequests;
                existing.TotalResponseTime = totalResponseTime;
                existing.ErrorCount = errorCount;
                existing.LastRequestTime = timestamp;
                return existing;
            });
    }
}

public class RequestMetrics
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public long TotalResponseTime { get; set; }
    public int ErrorCount { get; set; }
    public DateTime LastRequestTime { get; set; }
}

public class ServiceMetrics
{
    public string ServiceName { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public long TotalResponseTime { get; set; }
    public int ErrorCount { get; set; }
    public DateTime LastRequestTime { get; set; }
    public List<EndpointMetrics> Endpoints { get; set; } = new();
    
    public double AverageResponseTime => TotalRequests > 0 ? (double)TotalResponseTime / TotalRequests : 0;
    public double ErrorRate => TotalRequests > 0 ? (double)ErrorCount / TotalRequests * 100 : 0;
}

public class EndpointMetrics
{
    public string Endpoint { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public double AverageResponseTime { get; set; }
    public double ErrorRate { get; set; }
    public DateTime LastRequestTime { get; set; }
}

public class RequestLogEntry
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public int ResponseTime { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public class HourlyMetrics
{
    public int Hour { get; set; }
    public DateTime Date { get; set; }
    public int RequestCount { get; set; }
    public double AverageResponseTime { get; set; }
    public int ErrorCount { get; set; }
}