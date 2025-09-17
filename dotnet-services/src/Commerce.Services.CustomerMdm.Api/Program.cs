using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Data.Repositories;
using Commerce.Services.Shared.Data.Services;
using Commerce.Services.Shared.Infrastructure.Middleware;
using Commerce.Services.CustomerMdm.Api.Services;
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
        Title = "Customer MDM API", 
        Version = "v1",
        Description = "Customer Master Data Management API - Customer Relationship Management for all Commerce Applications"
    });
});

// Add database context for averis_customer schema
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=commerce_db;Username=postgres;Password=postgres;";

// Configure Npgsql data source with dynamic JSON serialization for JSONB support
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson(); // Required for JSONB serialization
var dataSource = dataSourceBuilder.Build();

// Add CustomerDbContext for customer management
builder.Services.AddDbContext<CustomerDbContext>(options =>
{
    options.UseNpgsql(dataSource, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "averis_customer");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Keep CustomerMdmDbContext for backwards compatibility with users table
builder.Services.AddDbContext<CustomerMdmDbContext>(options =>
{
    options.UseNpgsql(dataSource, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "averis_system");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// Register repositories and services
builder.Services.AddScoped<ICustomerUserRepository, CustomerUserRepository>();
builder.Services.AddScoped<ICustomerUserService, CustomerUserService>();

// Register customer messaging services
builder.Services.AddSingleton<ICustomerMessageService, CustomerMessageService>();

// Register customer real-time log streaming service
builder.Services.AddHttpClient<ICustomerRealTimeLogService, CustomerRealTimeLogService>();

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Customer MDM API v1");
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

// Ensure database is created (for development)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        // Initialize CustomerDbContext for customer management
        var customerContext = scope.ServiceProvider.GetRequiredService<CustomerDbContext>();
        try
        {
            customerContext.Database.EnsureCreated();
            app.Logger.LogInformation("Customer database (averis_customer schema) ensured created successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Error ensuring Customer database creation");
        }

        // Also initialize CustomerMdmDbContext for user management
        var userContext = scope.ServiceProvider.GetRequiredService<CustomerMdmDbContext>();
        try
        {
            userContext.Database.EnsureCreated();
            app.Logger.LogInformation("Customer MDM database (averis_system schema) ensured created successfully");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Error ensuring Customer MDM database creation");
        }
    }
}

app.Logger.LogInformation("Customer MDM API starting on port 6007...");
app.Logger.LogInformation("Swagger UI available at: {BaseUrl}", app.Environment.IsDevelopment() ? "http://localhost:6007" : "");

app.Run();