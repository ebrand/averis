using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Interface for Catalog business logic operations
/// </summary>
public interface ICatalogService
{
    /// <summary>
    /// Gets all catalogs with optional filtering and pagination
    /// </summary>
    Task<CatalogPagedResponse> GetCatalogsAsync(
        int page = 1, 
        int pageSize = 20, 
        string? searchTerm = null, 
        string? status = null, 
        bool? isActive = null,
        Guid? regionId = null,
        Guid? marketSegmentId = null);

    /// <summary>
    /// Gets a catalog by ID
    /// </summary>
    Task<CatalogDto?> GetCatalogByIdAsync(Guid id);

    /// <summary>
    /// Gets a catalog by code
    /// </summary>
    Task<CatalogDto?> GetCatalogByCodeAsync(string code);

    /// <summary>
    /// Creates a new catalog
    /// </summary>
    Task<CatalogDto> CreateCatalogAsync(CreateCatalogRequest request);

    /// <summary>
    /// Updates an existing catalog
    /// </summary>
    Task<CatalogDto?> UpdateCatalogAsync(Guid id, UpdateCatalogRequest request);

    /// <summary>
    /// Soft deletes a catalog (sets inactive)
    /// </summary>
    Task<bool> DeleteCatalogAsync(Guid id, string deletedBy);

    /// <summary>
    /// Activates a catalog
    /// </summary>
    Task<bool> ActivateCatalogAsync(Guid id, string activatedBy);

    /// <summary>
    /// Deactivates a catalog
    /// </summary>
    Task<bool> DeactivateCatalogAsync(Guid id, string deactivatedBy);

    /// <summary>
    /// Checks if a catalog code is unique
    /// </summary>
    Task<bool> IsCatalogCodeUniqueAsync(string code, Guid? excludeId = null);

    /// <summary>
    /// Gets catalog statistics
    /// </summary>
    Task<Dictionary<string, object>> GetCatalogStatsAsync();

    /// <summary>
    /// Performs comprehensive health check including database connectivity and statistics
    /// </summary>
    Task<ServiceHealthResult> HealthCheckAsync();
}

/// <summary>
/// Health check result for Pricing MDM API
/// </summary>
public class ServiceHealthResult
{
    public string Status { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public DatabaseHealthInfo? Database { get; set; }
    public StatisticsInfo? Stats { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Database connectivity health information
/// </summary>
public class DatabaseHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public int? RecordCount { get; set; }
    public string? Schema { get; set; }
}

/// <summary>
/// Service-specific statistics information
/// </summary>
public class StatisticsInfo
{
    public int TotalCatalogs { get; set; }
    public int ActiveCatalogs { get; set; }
    public int TotalProducts { get; set; }
    public Dictionary<string, int> CatalogsByRegion { get; set; } = new();
    public Dictionary<string, int> CatalogsBySegment { get; set; } = new();
}