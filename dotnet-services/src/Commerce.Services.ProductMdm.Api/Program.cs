using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Data.Repositories;
using Commerce.Services.Shared.Data.Services;
using Commerce.Services.ProductMdm.Api.HealthChecks;
using Commerce.Services.ProductMdm.Api.Services;
using Commerce.Services.Shared.Infrastructure.Middleware;
using Serilog;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog logging
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "Product API", 
        Version = "v1",
        Description = "Product API - System of Record for Product Data"
    });
});

// Add database context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ProductMdmDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "product_mdm");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Register repositories and services
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService>((serviceProvider) =>
{
    var repository = serviceProvider.GetRequiredService<IProductRepository>();
    var logger = serviceProvider.GetRequiredService<ILogger<ProductService>>();
    var messageService = serviceProvider.GetRequiredService<IProductMessageService>();
    return new ProductService(repository, logger, messageService);
});
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Register Product Cache sync service
builder.Services.AddHttpClient<IProductCacheService, ProductCacheService>();

// Register NATS messaging service
builder.Services.AddSingleton<IProductMessageService, ProductMessageService>();

// Register Central Message Log service
builder.Services.AddHttpClient<ICentralMessageLogService, CentralMessageLogService>();

// Register Real-time Log Streaming service
builder.Services.AddHttpClient<IRealTimeLogService, RealTimeLogService>();

// Register System Monitoring background service
builder.Services.AddHostedService<SystemMonitoringService>();

// Register health check services
builder.Services.AddScoped<DatabaseHealthCheck>();

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// Add CORS for development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
}

// Build the application
var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Product API v1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
    });
    app.UseCors("AllowAll");
}

// Add request logging
app.UseSerilogRequestLogging();

// Add request metrics middleware
app.UseMiddleware<RequestMetricsMiddleware>();

app.UseHttpsRedirection();

// Map controllers
app.MapControllers();

// Map health checks
app.MapHealthChecks("/health/basic");

// Enhanced health endpoint with detailed information
app.MapGet("/health", async (IProductService productService) =>
{
    try
    {
        var health = await productService.HealthCheckAsync();
        var statusCode = health.Status == "healthy" ? 200 : 503;

        var response = new
        {
            status = health.Status,
            service = "ProductMdmAPI",
            timestamp = DateTime.UtcNow.ToString("O"),
            uptime = Environment.TickCount64 / 1000,
            memory = GC.GetTotalMemory(false),
            version = "1.0.0",
            database = health.Database,
            nats = health.Nats,
            stats = health.Stats,
            error = health.Error
        };

        return Results.Json(response, statusCode: statusCode);
    }
    catch (Exception ex)
    {
        var errorResponse = new
        {
            status = "error",
            service = "ProductMdmAPI", 
            timestamp = DateTime.UtcNow.ToString("O"),
            uptime = Environment.TickCount64 / 1000,
            memory = GC.GetTotalMemory(false),
            version = "1.0.0",
            error = ex.Message
        };

        return Results.Json(errorResponse, statusCode: 503);
    }
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

// Ensure database is created (for development)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ProductMdmDbContext>();
        try
        {
            context.Database.EnsureCreated();
            app.Logger.LogInformation("Database ensured created successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Error ensuring database creation");
        }
    }
}

app.Logger.LogInformation("Product API starting on port 6001...");
app.Logger.LogInformation("Swagger UI available at: {BaseUrl}", app.Environment.IsDevelopment() ? "http://localhost:6001" : "");

app.Run();