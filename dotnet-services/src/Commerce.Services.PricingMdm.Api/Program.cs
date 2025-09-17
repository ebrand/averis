using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Services;
using Commerce.Services.Shared.Infrastructure.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Pricing API", Version = "v1" });
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "Commerce.Services.PricingMdm.Api.xml"), true);
});

// Add CORS support
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? 
    "Host=localhost;Port=5432;Database=commerce_db;Username=postgres;Password=postgres;Search Path=averis_pricing;";

builder.Services.AddDbContext<PricingDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "averis_pricing");
    }));

// Register services
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<ICatalogProductService, CatalogProductService>();
builder.Services.AddScoped<RegionLocaleTreeService>();

// Register Product Staging API service
builder.Services.AddHttpClient<IProductStagingApiService, ProductStagingApiService>();
builder.Services.AddScoped<IProductStagingApiService, ProductStagingApiService>();

// Register compliance screening service
builder.Services.AddHttpClient<IComplianceScreeningService, ComplianceScreeningService>();
builder.Services.AddScoped<IComplianceScreeningService, ComplianceScreeningService>();

// Register background job services
// Note: IBackgroundJobQueue is needed for locale financial jobs, but BackgroundJobProcessor is disabled 
// because localization processing moved to dedicated Localization API
builder.Services.AddSingleton<IBackgroundJobQueue, InMemoryBackgroundJobQueue>();
// builder.Services.AddHostedService<BackgroundJobProcessor>(); // DISABLED: Localization moved to Localization API

// Register locale financial services
builder.Services.AddScoped<ILocaleFinancialService, LocaleFinancialService>();
builder.Services.AddScoped<ICurrencyConversionService, CurrencyConversionService>();

// Register multi-language content services
builder.Services.AddScoped<IMultiLanguageContentService, MultiLanguageContentService>();
builder.Services.AddScoped<ITranslationService, GoogleTranslationService>();

// Register localization API client service
builder.Services.AddHttpClient<ILocalizationApiService, LocalizationApiService>();
builder.Services.AddScoped<ILocalizationApiService, LocalizationApiService>();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pricing API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
    app.UseDeveloperExceptionPage();
}

app.UseCors();

// Enable static file serving for test pages
app.UseStaticFiles();

// Add request metrics middleware
app.UseMiddleware<RequestMetricsMiddleware>();

app.UseRouting();
app.MapControllers();

// Enhanced health check endpoint
app.MapGet("/health", async (ICatalogService catalogService) =>
{
    try
    {
        var health = await catalogService.HealthCheckAsync();
        var statusCode = health.Status == "healthy" ? 200 : 503;

        var response = new
        {
            status = health.Status,
            service = "PricingMdmAPI",
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
            service = "PricingMdmAPI",
            timestamp = DateTime.UtcNow.ToString("O"),
            uptime = Environment.TickCount64 / 1000,
            memory = GC.GetTotalMemory(false),
            version = "1.0.0",
            error = ex.Message
        };

        return Results.Json(errorResponse, statusCode: 503);
    }
}).WithName("HealthCheck");

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
}).WithName("Metrics");

// API info endpoint
app.MapGet("/api", () => new
{
    service = "Pricing API",
    version = "1.0.0",
    description = "API for managing pricing catalogs, regions, locales and hierarchical region-locale management",
    endpoints = new
    {
        catalogs = "/api/catalog",
        catalogProducts = "/api/catalogproduct",
        catalogManagement = "/api/catalogmanagement",
        backgroundJobs = "/api/catalogmanagement/jobs",
        regions = "/api/regions",
        locales = "/api/locales",
        regionLocaleTree = "/api/regions/tree",
        tree = "/api/tree",
        compliance = "/api/compliance",
        health = "/health",
        swagger = "/swagger"
    }
}).WithName("ApiInfo");

// Initialize database if needed
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<PricingDbContext>();
        context.Database.EnsureCreated();
        Console.WriteLine("✅ Database initialized successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error initializing database: {ex.Message}");
    }
}

Console.WriteLine($"🚀 Pricing MDM API starting...");
Console.WriteLine($"📚 Swagger UI available at: http://localhost:6003/");
Console.WriteLine($"🔍 API endpoints available at: http://localhost:6003/api");
Console.WriteLine($"❤️  Health check available at: http://localhost:6003/health");

app.Run();
