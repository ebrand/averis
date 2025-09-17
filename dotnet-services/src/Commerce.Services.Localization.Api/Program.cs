using Microsoft.EntityFrameworkCore;
using Commerce.Services.Localization.Api.Data;
using Commerce.Services.Localization.Api.Hubs;
using Commerce.Services.Localization.Api.Services;
using Commerce.Services.Localization.Api.Workers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                       $"Host={Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost"};" +
                       $"Port={Environment.GetEnvironmentVariable("DB_PORT") ?? "5432"};" +
                       $"Database={Environment.GetEnvironmentVariable("DB_NAME") ?? "commerce_db"};" +
                       $"Username={Environment.GetEnvironmentVariable("DB_USER") ?? "postgres"};" +
                       $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres"};" +
                       "Include Error Detail=true";

builder.Services.AddDbContext<LocalizationDbContext>(options =>
    options.UseNpgsql(connectionString));

// SignalR
builder.Services.AddSignalR();

// HTTP Client
builder.Services.AddHttpClient();

// Register services
builder.Services.AddScoped<IProgressBroadcastService, ProgressBroadcastService>();
builder.Services.AddScoped<IJobManagementService, JobManagementService>();
builder.Services.AddSingleton<IWorkerPoolService, WorkerPoolService>();
builder.Services.AddScoped<ILocalizationProcessor, LocalizationProcessor>();

// Background services
builder.Services.AddHostedService<JobPollingService>();

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Localization API v1");
        c.RoutePrefix = "swagger"; // Serve Swagger UI at /swagger
    });
    app.UseDeveloperExceptionPage();
}

app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();
app.MapHub<LocalizationProgressHub>("/progressHub");

// Ensure database is created (in production, use proper migrations)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<LocalizationDbContext>();
    try
    {
        context.Database.EnsureCreated();
        app.Logger.LogInformation("Database connection verified successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to connect to database");
    }
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "6010";
app.Urls.Add($"http://+:{port}");

app.Logger.LogInformation("Starting Localization API on port {Port}", port);
Console.WriteLine("🟢 STARTUP DEBUG: Localization API starting with debugging enabled - 2025-09-16 22:30");
app.Logger.LogCritical("🟢 STARTUP CRITICAL: Localization API starting with debugging enabled - 2025-09-16 22:30");

app.Run();
