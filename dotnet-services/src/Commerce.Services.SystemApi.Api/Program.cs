using Commerce.Services.SystemApi.Api.Data;
using Commerce.Services.SystemApi.Api.Hubs;
using Commerce.Services.SystemApi.Api.Models;
using Commerce.Services.SystemApi.Api.Services;
using Commerce.Services.Shared.Infrastructure.Middleware;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Text.Json;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/system-api-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting Averis System API");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddSignalR();

    // Register notification services
    builder.Services.AddScoped<IMessageNotificationService, MessageNotificationService>();
    builder.Services.AddScoped<IMetricsNotificationService, MetricsNotificationService>();
    builder.Services.AddScoped<ILogNotificationService, LogNotificationService>();

    // Configure Entity Framework with PostgreSQL
    builder.Services.AddDbContext<SystemDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null);
        });

        if (builder.Environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
        }
    });

    // Add CORS for development (SignalR compatible)
    if (builder.Environment.IsDevelopment())
    {
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.WithOrigins(
                          "http://localhost:3001", // Product MDM UI
                          "http://localhost:3003", // Pricing MDM UI
                          "http://localhost:3004", // E-commerce UI
                          "http://localhost:3005", // OMS UI
                          "http://localhost:3006", // ERP UI
                          "http://localhost:3007", // Customer MDM UI
                          "http://localhost:3012"  // Commerce Dashboard UI
                      )
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials(); // Required for SignalR
            });
        });
    }

    // Add health checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<SystemDbContext>();

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Averis System API v1");
        });
    }

    // Use CORS for development
    if (app.Environment.IsDevelopment())
    {
        app.UseCors("AllowAll");
    }

    // Add request metrics middleware
    app.UseMiddleware<RequestMetricsMiddleware>();

    app.UseRouting();

    app.MapControllers();
    app.MapHealthChecks("/health");
    app.MapHub<MessageLogHub>("/messageLogHub");
    app.MapHub<MetricsHub>("/metricsHub");
    app.MapHub<LogsHub>("/logsHub");

    // Add root endpoint for service identification
    app.MapGet("/", () => new
    {
        service = "Averis System API",
        version = "1.0",
        description = "Centralized system services including message logging",
        timestamp = DateTime.UtcNow.ToString("O")
    });

    // Metrics endpoint for performance tracking
    app.MapGet("/metrics", () =>
    {
        try
        {
            var serviceMetrics = RequestMetricsMiddleware.GetServiceMetrics();
            var hourlyMetrics = RequestMetricsMiddleware.GetHourlyMetrics();
            var recentRequests = RequestMetricsMiddleware.GetRecentRequests(50);

            return Results.Json(new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                services = serviceMetrics,
                hourly = hourlyMetrics,
                recent = recentRequests
            });
        }
        catch (Exception ex)
        {
            return Results.Json(new { error = ex.Message }, statusCode: 500);
        }
    });

    // Reset metrics endpoint (development only)
    app.MapPost("/api/metrics/reset", () =>
    {
        try
        {
            RequestMetricsMiddleware.ResetMetrics();
            Log.Information("Metrics counters have been reset");
            return Results.Ok(new { success = true, message = "Metrics reset successfully", timestamp = DateTime.UtcNow.ToString("O") });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to reset metrics");
            return Results.Json(new { error = ex.Message }, statusCode: 500);
        }
    });

    // Real-time metrics push endpoint for other services
    app.MapPost("/api/metrics/push", async (HttpContext context, IMetricsNotificationService metricsService) =>
    {
        try
        {
            using var reader = new StreamReader(context.Request.Body);
            var json = await reader.ReadToEndAsync();
            
            Log.Information("Received metrics push: {Json}", json);
            
            var jsonDocument = JsonDocument.Parse(json);
            var root = jsonDocument.RootElement;
            
            var metricsUpdate = new MetricsUpdate
            {
                ServiceName = root.GetProperty("serviceName").GetString() ?? "",
                Endpoint = root.GetProperty("endpoint").GetString() ?? "",
                ResponseTimeMs = root.GetProperty("responseTimeMs").GetInt32(),
                IsError = root.GetProperty("isError").GetBoolean(),
                Timestamp = root.TryGetProperty("timestamp", out var timestampProp) 
                    ? (timestampProp.ValueKind == JsonValueKind.String 
                        ? DateTime.Parse(timestampProp.GetString()!) 
                        : timestampProp.GetDateTime())
                    : DateTime.UtcNow,
                TotalRequests = root.GetProperty("totalRequests").GetInt32(),
                AverageResponseTime = root.GetProperty("averageResponseTime").GetDouble(),
                ErrorRate = root.GetProperty("errorRate").GetDouble()
            };
            
            // Store the pushed metrics in the System API's metrics collection
            RequestMetricsMiddleware.UpdateExternalServiceMetrics(
                metricsUpdate.ServiceName,
                metricsUpdate.TotalRequests,
                metricsUpdate.AverageResponseTime,
                metricsUpdate.ErrorRate,
                metricsUpdate.Timestamp
            );
            
            // Send real-time SignalR notification
            await metricsService.NotifyMetricsUpdateAsync(metricsUpdate);
            
            return Results.Ok(new { success = true, timestamp = DateTime.UtcNow.ToString("O") });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to process metrics push");
            return Results.Json(new { error = ex.Message }, statusCode: 500);
        }
    });

    // Logs aggregation endpoint for real-time log viewing - now database-driven
    app.MapGet("/logs", async (SystemDbContext dbContext, int limit = 100) =>
    {
        try
        {
            // Get recent log entries from database, ordered by timestamp descending
            var logEntries = await dbContext.LogEntries
                .OrderByDescending(l => l.Timestamp)
                .Take(limit)
                .Select(l => new
                {
                    id = l.Id.ToString(),
                    timestamp = l.Timestamp.ToString("O"),
                    level = l.Level,
                    source = l.Source,
                    service = l.Service,
                    message = l.Message,
                    exception = l.Exception,
                    productId = l.ProductId,
                    productSku = l.ProductSku,
                    userId = l.UserId,
                    correlationId = l.CorrelationId
                })
                .ToListAsync();

            return Results.Json(new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                logs = logEntries,
                count = logEntries.Count
            });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to retrieve logs from database");
            return Results.Json(new { error = ex.Message }, statusCode: 500);
        }
    });

    // Log push endpoint for real-time log streaming from other services
    app.MapPost("/api/logs/push", async (HttpContext context, ILogNotificationService logService, SystemDbContext dbContext) =>
    {
        try
        {
            using var reader = new StreamReader(context.Request.Body);
            var json = await reader.ReadToEndAsync();
            
            var jsonDocument = System.Text.Json.JsonDocument.Parse(json);
            var root = jsonDocument.RootElement;
            
            var serviceName = root.TryGetProperty("service", out var serviceProp) 
                ? serviceProp.GetString() ?? "External Service"
                : "External Service";
            
            // Create database log entry
            var dbLogEntry = new Commerce.Services.SystemApi.Api.Models.LogEntry
            {
                Timestamp = root.TryGetProperty("timestamp", out var timestampProp) 
                    ? DateTime.Parse(timestampProp.GetString()!).ToUniversalTime() 
                    : DateTime.UtcNow,
                Level = root.GetProperty("level").GetString() ?? "INFO",
                Source = root.GetProperty("source").GetString() ?? "",
                Service = serviceName,
                Message = root.GetProperty("message").GetString() ?? "",
                Exception = root.TryGetProperty("exception", out var exceptionProp) 
                    ? exceptionProp.GetString() 
                    : null,
                ProductId = root.TryGetProperty("productId", out var productIdProp) && Guid.TryParse(productIdProp.GetString(), out var productId)
                    ? productId 
                    : null,
                ProductSku = root.TryGetProperty("productSku", out var skuProp) 
                    ? skuProp.GetString() 
                    : null,
                UserId = root.TryGetProperty("userId", out var userIdProp) 
                    ? userIdProp.GetString() 
                    : null,
                CorrelationId = root.TryGetProperty("correlationId", out var corrIdProp) 
                    ? corrIdProp.GetString() 
                    : null
            };
            
            // Store in database
            dbContext.LogEntries.Add(dbLogEntry);
            await dbContext.SaveChangesAsync();
            
            // Create SignalR log entry for real-time notification
            var signalRLogEntry = new Commerce.Services.SystemApi.Api.Services.LogEntry
            {
                Timestamp = dbLogEntry.Timestamp,
                Level = dbLogEntry.Level,
                Source = dbLogEntry.Source,
                Message = dbLogEntry.Message,
                Exception = dbLogEntry.Exception
            };
            
            // Send real-time SignalR notification
            await logService.NotifyLogEntryAsync(signalRLogEntry);
            
            return Results.Ok(new { success = true, timestamp = DateTime.UtcNow.ToString("O"), id = dbLogEntry.Id });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to process log push");
            return Results.Json(new { error = ex.Message }, statusCode: 500);
        }
    });





    // Ensure database is created (for development)
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<SystemDbContext>();
        if (app.Environment.IsDevelopment())
        {
            try
            {
                // Only ensure created, don't migrate (we're using existing schema)
                await context.Database.EnsureCreatedAsync();
                Log.Information("Database connection verified");
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Database connection check failed, but continuing startup");
            }
        }
    }

    Log.Information("Averis System API started successfully on port 6012");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Averis System API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}