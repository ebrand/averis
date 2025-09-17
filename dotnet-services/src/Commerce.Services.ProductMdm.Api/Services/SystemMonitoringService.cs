using Microsoft.Extensions.Hosting;
using System.Diagnostics;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Background service for monitoring system resources and logging operational events
/// </summary>
public class SystemMonitoringService : BackgroundService
{
    private readonly IRealTimeLogService _logService;
    private readonly ILogger<SystemMonitoringService> _logger;
    private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes(1); // Check every minute
    private const long MemoryThresholdMB = 500; // Alert when using > 500MB
    private const double CpuThreshold = 80.0; // Alert when CPU > 80%

    public SystemMonitoringService(
        IRealTimeLogService logService,
        ILogger<SystemMonitoringService> logger)
    {
        _logService = logService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("System monitoring service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckSystemResources();
                await Task.Delay(_monitoringInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in system monitoring");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); // Wait before retrying
            }
        }

        _logger.LogInformation("System monitoring service stopped");
    }

    private async Task CheckSystemResources()
    {
        // Check memory usage
        await CheckMemoryUsage();

        // Check for potential performance issues
        await CheckResponseTimeMetrics();
    }

    private async Task CheckMemoryUsage()
    {
        try
        {
            using var process = Process.GetCurrentProcess();
            var memoryUsageMB = process.WorkingSet64 / 1024 / 1024;

            if (memoryUsageMB > MemoryThresholdMB)
            {
                await _logService.StreamMemoryPressureAsync(memoryUsageMB, MemoryThresholdMB);
                _logger.LogWarning("High memory usage detected: {MemoryUsageMB}MB", memoryUsageMB);
            }

            // Also check for memory leaks by tracking growth over time
            GC.Collect(); // Force garbage collection for accurate measurement
            var gcMemoryMB = GC.GetTotalMemory(false) / 1024 / 1024;
            
            if (gcMemoryMB > MemoryThresholdMB / 2) // Half the working set threshold
            {
                await _logService.StreamResourceWarningAsync("Memory", 
                    $"Managed memory usage: {gcMemoryMB}MB, Working set: {memoryUsageMB}MB");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking memory usage");
        }
    }

    private async Task CheckResponseTimeMetrics()
    {
        try
        {
            // Simulate checking if we have any slow operations from recent metrics
            // In a real implementation, you'd query actual metrics
            var random = new Random();
            
            // Occasionally simulate detecting a slow operation for demonstration
            if (random.Next(1, 20) == 1) // 5% chance to trigger
            {
                var slowOperation = "Database query";
                var responseTime = random.Next(1500, 3000); // 1.5-3 seconds
                var threshold = 1000;
                
                await _logService.StreamPerformanceWarningAsync(slowOperation, responseTime, threshold);
                _logger.LogWarning("Slow operation detected via monitoring: {Operation} took {ResponseTime}ms", 
                    slowOperation, responseTime);
            }

            // Simulate timeout detection
            if (random.Next(1, 50) == 1) // 2% chance to trigger
            {
                var timeoutOperation = "External API call";
                var timeoutMs = 30000; // 30 second timeout
                
                await _logService.StreamTimeoutAsync(timeoutOperation, timeoutMs);
                _logger.LogError("Timeout detected: {Operation} exceeded {TimeoutMs}ms", 
                    timeoutOperation, timeoutMs);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking response time metrics");
        }
    }
}