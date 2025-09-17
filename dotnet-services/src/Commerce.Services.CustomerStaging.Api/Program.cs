using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Infrastructure.Middleware;
using Commerce.Services.CustomerStaging.Api.Data;
using Serilog;
using System.Text.Json.Serialization;
using Npgsql;

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
        Title = "Customer Staging API", 
        Version = "v1",
        Description = "Customer Staging API - Read-optimized access to customer staging data for analytics and comparison"
    });
});

// Add database context for averis_customer_staging schema
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=commerce_db;Username=postgres;Password=postgres;";

// Configure Npgsql data source with dynamic JSON serialization for JSONB support
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson(); // Required for JSONB serialization
var dataSource = dataSourceBuilder.Build();

// Add CustomerStagingDbContext targeting the staging schema
builder.Services.AddDbContext<CustomerStagingDbContext>(options =>
{
    options.UseNpgsql(dataSource, npgsqlOptions =>
    {
        // Use staging schema for this API
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "averis_customer_staging");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy())
    .AddDbContextCheck<CustomerStagingDbContext>();

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Customer Staging API v1");
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
app.MapHealthChecks("/health");

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

// Ensure database connectivity (for development)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<CustomerStagingDbContext>();
        try
        {
            // Test database connectivity to staging schema
            await context.Database.CanConnectAsync();
            app.Logger.LogInformation("Customer Staging database (averis_customer_staging schema) connection verified successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Error connecting to Customer Staging database");
        }
    }
}

app.Logger.LogInformation("Customer Staging API starting on port 6008...");
app.Logger.LogInformation("Swagger UI available at: {BaseUrl}", app.Environment.IsDevelopment() ? "http://localhost:6008" : "");

app.Run();