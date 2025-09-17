using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Data.Repositories;
using Commerce.Services.Shared.Data.Services;
using Commerce.Services.ProductStaging.Api.Data;
using Commerce.Services.ProductStaging.Api.Repositories;
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
        Title = "Product Staging API", 
        Version = "v1",
        Description = "Product Staging API - Staged Product Data for Consumer Systems"
    });
});

// Add database context - using same database but different schema
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' not found.");

// Database context for Product Staging - use ProductStagingDbContext
builder.Services.AddDbContext<ProductStagingDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "staging");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Register repositories and services for staging schema
builder.Services.AddScoped<IProductRepository, ProductStagingRepository>();
builder.Services.AddScoped<IProductService>((serviceProvider) =>
{
    var repository = serviceProvider.GetRequiredService<IProductRepository>();
    var logger = serviceProvider.GetRequiredService<ILogger<ProductService>>();
    return new ProductService(repository, logger);
});

// Add health checks
builder.Services.AddHealthChecks()
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Product Staging API v1");
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
            service = "ProductStagingAPI",
            timestamp = DateTime.UtcNow.ToString("O"),
            uptime = Environment.TickCount64 / 1000,
            memory = GC.GetTotalMemory(false),
            version = "1.0.0",
            database = health.Database,
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
            service = "ProductStagingAPI", 
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
        var context = scope.ServiceProvider.GetRequiredService<ProductStagingDbContext>();
        try
        {
            context.Database.EnsureCreated();
            app.Logger.LogInformation("Product Staging database ensured created successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Error ensuring Product Staging database creation");
        }
    }
}

app.Logger.LogInformation("Product Staging API starting on port 6002...");
app.Logger.LogInformation("Swagger UI available at: {BaseUrl}", app.Environment.IsDevelopment() ? "http://localhost:6002" : "");

app.Run();