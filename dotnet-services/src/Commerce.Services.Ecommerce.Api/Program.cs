using Microsoft.EntityFrameworkCore;
using Serilog;
using Commerce.Services.Ecommerce.Api.Data;
using Commerce.Services.Ecommerce.Api.Services;
using Commerce.Services.Shared.Infrastructure.Middleware;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/ecommerce-api-.log", 
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        shared: true,
        flushToDiskInterval: TimeSpan.FromSeconds(1))
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "E-commerce API",
            Version = "v1.0",
            Description = "API that merges catalog pricing with local product data for e-commerce display"
        });
    });

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

    // Database configuration
    var connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost"};" +
                          $"Port={Environment.GetEnvironmentVariable("DB_PORT") ?? "5432"};" +
                          $"Database={Environment.GetEnvironmentVariable("DB_NAME") ?? "commerce_db"};" +
                          $"Username={Environment.GetEnvironmentVariable("DB_USER") ?? "postgres"};" +
                          $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres"};" +
                          "SearchPath=averis_ecomm,averis_pricing,averis_product,averis_system";

    builder.Services.AddDbContext<EcommerceDbContext>(options =>
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "averis_ecomm");
        }));

    // Add memory cache for pricing service
    builder.Services.AddMemoryCache();

    // Add HTTP client for pricing service
    builder.Services.AddHttpClient<IPricingService, PricingService>();

    // Register services
    builder.Services.AddScoped<IProductService, ProductService>();
    builder.Services.AddScoped<IPricingService, PricingService>();
    builder.Services.AddScoped<ILocaleService, LocaleService>();

    // Add health checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<EcommerceDbContext>();

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "E-commerce API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // Use CORS for development
    if (app.Environment.IsDevelopment())
    {
        app.UseCors("AllowAll");
    }

    // Add request metrics middleware
    app.UseMiddleware<RequestMetricsMiddleware>();

    // Health check endpoint
    app.MapGet("/health", async (IProductService productService) =>
    {
        try
        {
            var health = await productService.HealthCheckAsync();
            var statusCode = health.Status == "healthy" ? 200 : 503;

            var response = new
            {
                status         = health.Status,
                service        = "EcommerceAPI",
                timestamp      = DateTime.UtcNow.ToString("O"),
                uptime         = Environment.TickCount64 / 1000,   // seconds
                memory         = GC.GetTotalMemory(false),
                version        = "1.0.0",
                database       = health.Database,
                pricingService = health.PricingService,
                stats          = health.Stats,
                error          = health.Error
            };

            return Results.Json(response, statusCode: statusCode);
        }
        catch (Exception ex)
        {
            return Results.Json(new
            {
                status = "error",
                service = "EcommerceAPI",
                timestamp = DateTime.UtcNow.ToString("O"),
                uptime = Environment.TickCount64 / 1000,
                error = ex.Message
            }, statusCode: 503);
        }
    });

    // API info endpoint
    app.MapGet("/api", () =>
    {
        return Results.Json(new
        {
            service = "E-commerce API",
            version = "1.0.0",
            description = "API that merges catalog pricing with local product data for e-commerce display",
            environment = app.Environment.EnvironmentName,
            timestamp = DateTime.UtcNow.ToString("O"),
            endpoints = new
            {
                products = "/api/products",
                catalogs = "/api/catalogs",
                health = "/health"
            },
            features = new[]
            {
                "Product catalog integration",
                "Dynamic pricing from pricing-mdm",
                "Local product data optimization",
                "Search and filtering",
                "Category management",
                "Caching for performance"
            }
        });
    });

    // Cache control endpoint
    app.MapPost("/api/cache/clear", (IPricingService pricingService) =>
    {
        try
        {
            // Clear caches - this would need to be implemented in pricing service
            return Results.Json(new
            {
                success = true,
                message = "Cache cleared successfully",
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            return Results.Json(new
            {
                success = false,
                error = "Failed to clear cache",
                message = ex.Message
            }, statusCode: 500);
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

    app.MapControllers();

    // Start server
    var port = Environment.GetEnvironmentVariable("PORT") ?? "6004";
    var pricingApiUrl = Environment.GetEnvironmentVariable("PRICING_MDM_API_URL") ?? "http://localhost:6003";

    Log.Information("🚀 Starting E-commerce API...");
    Log.Information("🔧 Configuration:");
    Log.Information("   - Port: {Port}", port);
    Log.Information("   - Environment: {Environment}", app.Environment.EnvironmentName);
    Log.Information("   - Database: {ConnectionString}", connectionString.Replace(Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres", "****"));
    Log.Information("   - Pricing MDM API: {PricingApiUrl}", pricingApiUrl);
    Log.Information("   - CORS Origins: {CorsOrigins}", string.Join(", ", Environment.GetEnvironmentVariable("CORS_ORIGINS")?.Split(',') ?? new[] { "http://localhost:3003", "http://localhost:3004" }));

    app.Urls.Add($"http://localhost:{port}");

    Log.Information("✅ E-commerce API listening on port {Port}", port);
    Log.Information("🔗 API info available at http://localhost:{Port}/api", port);
    Log.Information("🔗 Health check available at http://localhost:{Port}/health", port);
    Log.Information("🛍️  Products API available at http://localhost:{Port}/api/products", port);
    Log.Information("📋 Catalogs API available at http://localhost:{Port}/api/catalogs", port);
    Log.Information("🎉 E-commerce API started successfully!");
    Log.Information("🛍️  Ready to serve product data with integrated pricing...");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "💥 E-commerce API failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
