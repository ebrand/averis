using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service implementation for Catalog business logic operations
/// </summary>
public class CatalogService : ICatalogService
{
    private readonly PricingDbContext _context;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(PricingDbContext context, ILogger<CatalogService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CatalogPagedResponse> GetCatalogsAsync(
        int page = 1, 
        int pageSize = 20, 
        string? searchTerm = null, 
        string? status = null, 
        bool? isActive = null,
        Guid? regionId = null,
        Guid? marketSegmentId = null)
    {
        try
        {
            _logger.LogInformation("Getting catalogs - Page: {Page}, PageSize: {PageSize}", page, pageSize);

            var query = _context.Catalogs.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(c => c.Name.Contains(searchTerm) || c.Code.Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            if (regionId.HasValue)
            {
                query = query.Where(c => c.RegionId == regionId.Value);
            }

            if (marketSegmentId.HasValue)
            {
                query = query.Where(c => c.MarketSegmentId == marketSegmentId.Value);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var catalogs = await query
                .Include(c => c.CatalogProducts)
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var catalogDtos = catalogs.Select(MapToDto).ToList();

            return new CatalogPagedResponse
            {
                Catalogs = catalogDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNext = page < totalPages,
                HasPrevious = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalogs");
            throw;
        }
    }

    public async Task<CatalogDto?> GetCatalogByIdAsync(Guid id)
    {
        try
        {
            var catalog = await _context.Catalogs
                .Include(c => c.CatalogProducts)
                .FirstOrDefaultAsync(c => c.Id == id);

            return catalog != null ? MapToDto(catalog) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog by ID: {Id}", id);
            throw;
        }
    }

    public async Task<CatalogDto?> GetCatalogByCodeAsync(string code)
    {
        try
        {
            var catalog = await _context.Catalogs
                .Include(c => c.CatalogProducts)
                .FirstOrDefaultAsync(c => c.Code == code);

            return catalog != null ? MapToDto(catalog) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog by code: {Code}", code);
            throw;
        }
    }

    public async Task<CatalogDto> CreateCatalogAsync(CreateCatalogRequest request)
    {
        try
        {
            // Check if code is unique
            var existingCatalog = await _context.Catalogs
                .FirstOrDefaultAsync(c => c.Code == request.Code);

            if (existingCatalog != null)
            {
                throw new InvalidOperationException($"Catalog with code '{request.Code}' already exists");
            }

            var catalog = new Catalog
            {
                Id = Guid.NewGuid(),
                Code = request.Code,
                Name = request.Name,
                RegionId = request.RegionId,
                MarketSegmentId = request.MarketSegmentId,
                CurrencyId = request.CurrencyId,
                EffectiveFrom = request.EffectiveFrom,
                EffectiveTo = request.EffectiveTo,
                Priority = request.Priority,
                Status = request.Status,
                IsActive = request.IsActive,
                IsDefault = request.IsDefault,
                CreatedBy = request.CreatedBy,
                UpdatedBy = request.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Catalogs.Add(catalog);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created catalog: {Code} ({Id})", catalog.Code, catalog.Id);

            return MapToDto(catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating catalog: {Code}", request.Code);
            throw;
        }
    }

    public async Task<CatalogDto?> UpdateCatalogAsync(Guid id, UpdateCatalogRequest request)
    {
        try
        {
            var catalog = await _context.Catalogs.FirstOrDefaultAsync(c => c.Id == id);
            
            if (catalog == null)
            {
                return null;
            }

            // Update only provided fields
            if (!string.IsNullOrEmpty(request.Name))
                catalog.Name = request.Name;

            if (request.RegionId.HasValue)
                catalog.RegionId = request.RegionId.Value;

            if (request.MarketSegmentId.HasValue)
                catalog.MarketSegmentId = request.MarketSegmentId.Value;

            if (request.CurrencyId.HasValue)
                catalog.CurrencyId = request.CurrencyId.Value;

            if (request.EffectiveFrom.HasValue)
                catalog.EffectiveFrom = request.EffectiveFrom;

            if (request.EffectiveTo.HasValue)
                catalog.EffectiveTo = request.EffectiveTo;

            if (request.Priority.HasValue)
                catalog.Priority = request.Priority.Value;

            if (!string.IsNullOrEmpty(request.Status))
                catalog.Status = request.Status;

            if (request.IsActive.HasValue)
                catalog.IsActive = request.IsActive.Value;

            if (request.IsDefault.HasValue)
            {
                _logger.LogInformation("Setting IsDefault from {CurrentValue} to {NewValue} for catalog {Id}", catalog.IsDefault, request.IsDefault.Value, catalog.Id);
                catalog.IsDefault = request.IsDefault.Value;
            }

            catalog.UpdatedBy = request.UpdatedBy;
            catalog.UpdatedAt = DateTime.UtcNow;

            // Explicitly mark the entity as modified
            _context.Entry(catalog).State = EntityState.Modified;
            
            _logger.LogInformation("Before SaveChanges - IsDefault: {IsDefault}", catalog.IsDefault);
            await _context.SaveChangesAsync();
            _logger.LogInformation("After SaveChanges - IsDefault: {IsDefault}", catalog.IsDefault);

            _logger.LogInformation("Updated catalog: {Code} ({Id})", catalog.Code, catalog.Id);

            return MapToDto(catalog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating catalog: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteCatalogAsync(Guid id, string deletedBy)
    {
        try
        {
            var catalog = await _context.Catalogs.FirstOrDefaultAsync(c => c.Id == id);
            
            if (catalog == null)
            {
                return false;
            }

            // Soft delete - set inactive
            catalog.IsActive = false;
            catalog.Status = "inactive";
            catalog.UpdatedBy = deletedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted catalog: {Code} ({Id}) by {DeletedBy}", catalog.Code, catalog.Id, deletedBy);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting catalog: {Id}", id);
            throw;
        }
    }

    public async Task<bool> ActivateCatalogAsync(Guid id, string activatedBy)
    {
        try
        {
            var catalog = await _context.Catalogs.FirstOrDefaultAsync(c => c.Id == id);
            
            if (catalog == null)
            {
                return false;
            }

            catalog.IsActive = true;
            catalog.Status = "active";
            catalog.UpdatedBy = activatedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Activated catalog: {Code} ({Id}) by {ActivatedBy}", catalog.Code, catalog.Id, activatedBy);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating catalog: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeactivateCatalogAsync(Guid id, string deactivatedBy)
    {
        try
        {
            var catalog = await _context.Catalogs.FirstOrDefaultAsync(c => c.Id == id);
            
            if (catalog == null)
            {
                return false;
            }

            catalog.IsActive = false;
            catalog.Status = "inactive";
            catalog.UpdatedBy = deactivatedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deactivated catalog: {Code} ({Id}) by {DeactivatedBy}", catalog.Code, catalog.Id, deactivatedBy);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating catalog: {Id}", id);
            throw;
        }
    }

    public async Task<bool> IsCatalogCodeUniqueAsync(string code, Guid? excludeId = null)
    {
        try
        {
            var query = _context.Catalogs.Where(c => c.Code == code);
            
            if (excludeId.HasValue)
            {
                query = query.Where(c => c.Id != excludeId.Value);
            }

            return !await query.AnyAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking catalog code uniqueness: {Code}", code);
            throw;
        }
    }

    public async Task<Dictionary<string, object>> GetCatalogStatsAsync()
    {
        try
        {
            var totalCount = await _context.Catalogs.CountAsync();
            var activeCount = await _context.Catalogs.CountAsync(c => c.IsActive);
            var draftCount = await _context.Catalogs.CountAsync(c => c.Status == "draft");
            
            return new Dictionary<string, object>
            {
                ["total"] = totalCount,
                ["active"] = activeCount,
                ["inactive"] = totalCount - activeCount,
                ["draft"] = draftCount,
                ["published"] = totalCount - draftCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog stats");
            throw;
        }
    }

    public async Task<ServiceHealthResult> HealthCheckAsync()
    {
        _logger.LogInformation("Performing Pricing MDM health check");
        
        try
        {
            var result = new ServiceHealthResult
            {
                Status = "healthy",
                Service = "PricingMdmService",
                Timestamp = DateTime.UtcNow
            };

            // Check database connectivity
            try
            {
                var stats = await GetCatalogStatsAsync();
                var productCount = await _context.CatalogProducts.CountAsync();
                
                result.Database = new DatabaseHealthInfo
                {
                    Status = "healthy",
                    Schema = "averis_pricing",
                    RecordCount = (int)(stats["total"] ?? 0)
                };

                // Gather comprehensive statistics
                result.Stats = new StatisticsInfo
                {
                    TotalCatalogs = (int)(stats["total"] ?? 0),
                    ActiveCatalogs = (int)(stats["active"] ?? 0),
                    TotalProducts = productCount,
                    CatalogsByRegion = new Dictionary<string, int>(), // Would need additional query
                    CatalogsBySegment = new Dictionary<string, int>() // Would need additional query
                };
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Database health check failed");
                result.Database = new DatabaseHealthInfo
                {
                    Status = "error",
                    Schema = "averis_pricing",
                    Error = dbEx.Message
                };
                result.Status = "degraded";
            }

            _logger.LogInformation("Pricing MDM health check completed with status: {Status}", result.Status);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed with exception");
            return new ServiceHealthResult
            {
                Status = "error",
                Service = "PricingMdmService",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            };
        }
    }

    /// <summary>
    /// Maps a Catalog entity to CatalogDto
    /// </summary>
    private static CatalogDto MapToDto(Catalog catalog)
    {
        return new CatalogDto
        {
            Id = catalog.Id,
            Code = catalog.Code,
            Name = catalog.Name,
            RegionId = catalog.RegionId,
            MarketSegmentId = catalog.MarketSegmentId,
            CurrencyId = catalog.CurrencyId,
            EffectiveFrom = catalog.EffectiveFrom,
            EffectiveTo = catalog.EffectiveTo,
            Priority = catalog.Priority,
            Status = catalog.Status,
            IsActive = catalog.IsActive,
            IsDefault = catalog.IsDefault,
            CreatedBy = catalog.CreatedBy,
            UpdatedBy = catalog.UpdatedBy,
            CreatedAt = catalog.CreatedAt,
            UpdatedAt = catalog.UpdatedAt,
            ProductCount = catalog.CatalogProducts?.Count(cp => cp.IsActive) ?? 0,
            IsCurrentlyEffective = catalog.IsCurrentlyEffective()
        };
    }
}