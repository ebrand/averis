using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;
using Commerce.Services.PricingMdm.Api.Services;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// Controller for managing catalog products and triggering background jobs
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CatalogManagementController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly IBackgroundJobQueue _jobQueue;
    private readonly ILogger<CatalogManagementController> _logger;

    public CatalogManagementController(
        PricingDbContext context,
        IBackgroundJobQueue jobQueue,
        ILogger<CatalogManagementController> logger)
    {
        _context = context;
        _jobQueue = jobQueue;
        _logger = logger;
    }

    /// <summary>
    /// Get all catalogs with their basic information
    /// </summary>
    [HttpGet("catalogs")]
    public async Task<ActionResult<List<CatalogSummaryDto>>> GetCatalogs()
    {
        try
        {
            var catalogs = await _context.Catalogs
                .Include(c => c.Region)
                .Include(c => c.Currency)
                .Include(c => c.MarketSegment)
                .Where(c => c.IsActive)
                .Select(c => new CatalogSummaryDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Name = c.Name,
                    RegionName = c.Region.Name,
                    CurrencyCode = c.Currency.Code,
                    MarketSegmentName = c.MarketSegment.Name,
                    Status = c.Status,
                    IsDefault = c.IsDefault,
                    ProductCount = _context.CatalogProducts.Count(cp => cp.CatalogId == c.Id && cp.IsActive)
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(catalogs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving catalogs");
            return StatusCode(500, new { error = "Failed to retrieve catalogs" });
        }
    }

    /// <summary>
    /// Get catalog details including products
    /// </summary>
    [HttpGet("catalogs/{catalogId}")]
    public async Task<ActionResult<CatalogDetailDto>> GetCatalog(Guid catalogId)
    {
        try
        {
            var catalog = await _context.Catalogs
                .Include(c => c.Region)
                .Include(c => c.Currency)
                .Include(c => c.MarketSegment)
                .FirstOrDefaultAsync(c => c.Id == catalogId);

            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }

            var catalogProducts = await _context.CatalogProducts
                .Where(cp => cp.CatalogId == catalogId && cp.IsActive)
                .Select(cp => new CatalogProductDto
                {
                    Id = cp.Id,
                    ProductId = cp.ProductId,
                    ProductName = cp.Sku ?? "Unknown Product", // Use SKU as fallback name since we cache it
                    ProductSku = cp.Sku ?? "",
                    DiscountPercentage = cp.DiscountPercentage,
                    OverridePrice = cp.OverridePrice,
                    AddedAt = cp.CreatedAt,
                    LocaleFinancialCount = _context.ProductLocaleFinancials
                        .Count(plf => plf.ProductId == cp.ProductId && plf.CatalogId == catalogId)
                })
                .OrderBy(cp => cp.ProductSku)
                .ToListAsync();

            var catalogDetail = new CatalogDetailDto
            {
                Id = catalog.Id,
                Code = catalog.Code,
                Name = catalog.Name,
                RegionName = catalog.Region.Name,
                CurrencyCode = catalog.Currency.Code,
                CurrencySymbol = catalog.Currency.Symbol,
                MarketSegmentName = catalog.MarketSegment.Name,
                Status = catalog.Status,
                IsDefault = catalog.IsDefault,
                EffectiveFrom = catalog.EffectiveFrom,
                EffectiveTo = catalog.EffectiveTo,
                Products = catalogProducts
            };

            return Ok(catalogDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving catalog {CatalogId}", catalogId);
            return StatusCode(500, new { error = "Failed to retrieve catalog details" });
        }
    }

    /// <summary>
    /// Search for products that can be added to a catalog
    /// </summary>
    [HttpGet("catalogs/{catalogId}/available-products")]
    public async Task<ActionResult<List<AvailableProductDto>>> GetAvailableProducts(
        Guid catalogId, 
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            // Get product IDs already in this catalog
            var existingProductIds = await _context.CatalogProducts
                .Where(cp => cp.CatalogId == catalogId && cp.IsActive)
                .Select(cp => cp.ProductId)
                .ToListAsync();

            // Fetch available products from Product Staging API
            using var httpClient = new HttpClient();
            var productStagingUrl = $"http://localhost:6002/api/products?page={page}&limit={pageSize}";
            if (!string.IsNullOrEmpty(search))
            {
                productStagingUrl += $"&search={Uri.EscapeDataString(search)}";
            }
            
            var productResponse = await httpClient.GetAsync(productStagingUrl);
            if (!productResponse.IsSuccessStatusCode)
            {
                return StatusCode(500, new { error = "Failed to fetch products from staging system" });
            }
            
            var productJson = await productResponse.Content.ReadAsStringAsync();
            var productData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(productJson);
            
            var availableProducts = new List<AvailableProductDto>();
            
            if (productData.TryGetProperty("products", out var productsArray))
            {
                foreach (var productElement in productsArray.EnumerateArray())
                {
                    if (productElement.TryGetProperty("id", out var idElement) &&
                        Guid.TryParse(idElement.GetString(), out var productId))
                    {
                        // Skip if product is already in catalog
                        if (existingProductIds.Contains(productId))
                            continue;
                            
                        var availableProduct = new AvailableProductDto
                        {
                            Id = productId,
                            Sku = productElement.TryGetProperty("sku", out var skuElement) ? skuElement.GetString() ?? "" : "",
                            Name = productElement.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? "" : "",
                            Description = productElement.TryGetProperty("description", out var descElement) ? descElement.GetString() : null,
                            Status = productElement.TryGetProperty("status", out var statusElement) ? statusElement.GetString() ?? "" : "",
                            CreatedAt = productElement.TryGetProperty("createdAt", out var createdElement) && 
                                       DateTime.TryParse(createdElement.GetString(), out var createdDate) ? createdDate : DateTime.MinValue
                        };
                        
                        availableProducts.Add(availableProduct);
                    }
                }
            }

            return Ok(availableProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available products for catalog {CatalogId}", catalogId);
            return StatusCode(500, new { error = "Failed to retrieve available products" });
        }
    }

    /// <summary>
    /// Add products to a catalog and trigger background jobs
    /// </summary>
    [HttpPost("catalogs/{catalogId}/products")]
    public async Task<ActionResult<AddProductsToCatalogResponse>> AddProductsToCatalog(
        Guid catalogId, 
        [FromBody] AddProductsToCatalogRequest request)
    {
        try
        {
            _logger.LogInformation("Adding {ProductCount} products to catalog {CatalogId}", 
                request.ProductIds.Count, catalogId);

            // Validate catalog exists
            var catalog = await _context.Catalogs
                .Include(c => c.Region)
                .FirstOrDefaultAsync(c => c.Id == catalogId);

            if (catalog == null)
            {
                return NotFound(new { error = "Catalog not found" });
            }

            var response = new AddProductsToCatalogResponse
            {
                CatalogId = catalogId,
                SuccessfulProducts = new List<Guid>(),
                FailedProducts = new List<ProductAddError>(),
                JobIds = new List<Guid>()
            };

            // Get region's locales for background job processing
            var regionLocales = await _context.Locales
                .Where(l => l.Country.RegionId == catalog.Region.Id && l.IsActive)
                .Select(l => l.Id)
                .ToListAsync();

            foreach (var productId in request.ProductIds)
            {
                try
                {
                    // Fetch product information from Product Staging API
                    string? productSku = null;
                    decimal? productBasePrice = null;
                    
                    try
                    {
                        using var httpClient = new HttpClient();
                        var productStagingUrl = $"http://localhost:6002/api/products/{productId}";
                        var productResponse = await httpClient.GetAsync(productStagingUrl);
                        
                        if (!productResponse.IsSuccessStatusCode)
                        {
                            response.FailedProducts.Add(new ProductAddError
                            {
                                ProductId = productId,
                                Error = "Product not found in staging system"
                            });
                            continue;
                        }
                        
                        var productJson = await productResponse.Content.ReadAsStringAsync();
                        var productData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(productJson);
                        
                        if (productData.TryGetProperty("sku", out var skuElement))
                            productSku = skuElement.GetString();
                        if (productData.TryGetProperty("basePrice", out var priceElement))
                            productBasePrice = priceElement.GetDecimal();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to fetch product {ProductId} from staging API", productId);
                        response.FailedProducts.Add(new ProductAddError
                        {
                            ProductId = productId,
                            Error = "Unable to fetch product details from staging system"
                        });
                        continue;
                    }

                    var existingCatalogProduct = await _context.CatalogProducts
                        .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

                    if (existingCatalogProduct != null)
                    {
                        if (existingCatalogProduct.IsActive)
                        {
                            response.FailedProducts.Add(new ProductAddError
                            {
                                ProductId = productId,
                                Error = "Product already in catalog"
                            });
                            continue;
                        }
                        else
                        {
                            // Reactivate existing entry
                            existingCatalogProduct.IsActive = true;
                            existingCatalogProduct.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        // Add new catalog product entry with cached product data
                        var catalogProduct = new Models.CatalogProduct
                        {
                            Id = Guid.NewGuid(),
                            CatalogId = catalogId,
                            ProductId = productId,
                            IsActive = true,
                            DiscountPercentage = request.DefaultDiscountPercentage ?? 0m,
                            OverridePrice = null, // Can be set later
                            Sku = productSku, // Cache SKU for local access
                            BasePrice = productBasePrice, // Cache base price for calculations
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.CatalogProducts.Add(catalogProduct);
                    }

                    response.SuccessfulProducts.Add(productId);

                    // Enqueue background jobs for locale financial calculations
                    if (regionLocales.Any())
                    {
                        var localeFinancialJobId = await _jobQueue.EnqueueAsync(
                            JobType.CalculateLocaleFinancials,
                            productSku ?? productId.ToString(),
                            "Product",
                            new LocaleFinancialJobParameters
                            {
                                ProductId = productId,
                                CatalogId = catalogId,
                                LocaleIds = regionLocales
                            },
                            request.CreatedBy ?? "system");

                        response.JobIds.Add(localeFinancialJobId);
                    }

                    // Enqueue multi-language content generation job
                    if (request.GenerateMultiLanguageContent && regionLocales.Any())
                    {
                        var contentJobId = await _jobQueue.EnqueueAsync(
                            JobType.GenerateMultiLanguageContent,
                            productSku ?? productId.ToString(),
                            "Product",
                            new MultiLanguageContentJobParameters
                            {
                                ProductId = productId,
                                SourceLocale = request.SourceLocale ?? "en_US",
                                TargetLocales = await GetLocaleCodesForRegion(catalog.Region.Id)
                            },
                            request.CreatedBy ?? "system");

                        response.JobIds.Add(contentJobId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error adding product {ProductId} to catalog {CatalogId}", productId, catalogId);
                    response.FailedProducts.Add(new ProductAddError
                    {
                        ProductId = productId,
                        Error = ex.Message
                    });
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully added {SuccessCount} products to catalog {CatalogId}, {FailCount} failed, {JobCount} jobs enqueued",
                response.SuccessfulProducts.Count, response.FailedProducts.Count, response.JobIds.Count, catalogId);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding products to catalog {CatalogId}", catalogId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Remove a product from a catalog
    /// </summary>
    [HttpDelete("catalogs/{catalogId}/products/{productId}")]
    public async Task<ActionResult> RemoveProductFromCatalog(Guid catalogId, Guid productId)
    {
        try
        {
            var catalogProduct = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

            if (catalogProduct == null)
            {
                return NotFound(new { error = "Product not found in catalog" });
            }

            // Soft delete by setting IsActive = false
            catalogProduct.IsActive = false;
            catalogProduct.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Product removed from catalog successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing product {ProductId} from catalog {CatalogId}", productId, catalogId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get background job status for a catalog or product
    /// </summary>
    [HttpGet("jobs")]
    public async Task<ActionResult<List<BackgroundJobDto>>> GetJobs(
        [FromQuery] string? entityId = null,
        [FromQuery] string? entityType = null,
        [FromQuery] int limit = 50)
    {
        try
        {
            List<BackgroundJob> jobs;
            
            if (!string.IsNullOrEmpty(entityId) && !string.IsNullOrEmpty(entityType))
            {
                jobs = await _jobQueue.GetJobsByEntityAsync(entityId, entityType);
            }
            else
            {
                jobs = await _jobQueue.GetJobHistoryAsync(limit);
            }

            var jobDtos = jobs.Select(j => new BackgroundJobDto
            {
                Id = j.Id,
                Type = j.Type.ToString(),
                Status = j.Status.ToString(),
                EntityId = j.EntityId,
                EntityType = j.EntityType,
                CreatedAt = j.CreatedAt,
                StartedAt = j.StartedAt,
                CompletedAt = j.CompletedAt,
                Duration = j.Duration,
                ErrorMessage = j.ErrorMessage,
                Result = j.Result,
                RetryCount = j.RetryCount,
                CreatedBy = j.CreatedBy
            }).ToList();

            return Ok(jobDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving background jobs");
            return StatusCode(500, new { error = "Failed to retrieve jobs" });
        }
    }

    /// <summary>
    /// Get specific job details
    /// </summary>
    [HttpGet("jobs/{jobId}")]
    public async Task<ActionResult<BackgroundJobDto>> GetJob(Guid jobId)
    {
        try
        {
            var job = await _jobQueue.GetJobAsync(jobId);
            if (job == null)
            {
                return NotFound(new { error = "Job not found" });
            }

            var jobDto = new BackgroundJobDto
            {
                Id = job.Id,
                Type = job.Type.ToString(),
                Status = job.Status.ToString(),
                EntityId = job.EntityId,
                EntityType = job.EntityType,
                CreatedAt = job.CreatedAt,
                StartedAt = job.StartedAt,
                CompletedAt = job.CompletedAt,
                Duration = job.Duration,
                ErrorMessage = job.ErrorMessage,
                Result = job.Result,
                RetryCount = job.RetryCount,
                CreatedBy = job.CreatedBy
            };

            return Ok(jobDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving job {JobId}", jobId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get workflow jobs from database for Background Jobs page
    /// </summary>
    [HttpGet("workflow-jobs")]
    public async Task<ActionResult<List<WorkflowJobDto>>> GetWorkflowJobs([FromQuery] int limit = 50)
    {
        try
        {
            var workflowJobDtos = new List<WorkflowJobDto>();
            
            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandText = @"
                SELECT 
                    id, job_name, job_type, status, total_items, completed_items, 
                    failed_items, progress_percentage, created_by, created_at, 
                    started_at, completed_at, error_message,
                    catalog_code, product_skus, locale_codes
                FROM averis_pricing.catalog_workflow_jobs
                ORDER BY created_at DESC 
                LIMIT @limit";
            
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@limit";
            parameter.Value = limit;
            command.Parameters.Add(parameter);
            
            if (_context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
            {
                await _context.Database.OpenConnectionAsync();
            }
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                workflowJobDtos.Add(new WorkflowJobDto
                {
                    Id = reader.GetGuid(0),                    // id
                    JobName = reader.GetString(1),            // job_name
                    JobType = reader.GetString(2),            // job_type
                    Status = reader.GetString(3),             // status
                    TotalItems = reader.GetInt32(4),          // total_items
                    CompletedItems = reader.GetInt32(5),      // completed_items
                    FailedItems = reader.GetInt32(6),         // failed_items
                    ProgressPercentage = reader.IsDBNull(7) ? 0 : reader.GetInt32(7), // progress_percentage
                    CreatedBy = reader.GetString(8),          // created_by
                    CreatedAt = reader.GetDateTime(9),        // created_at
                    StartedAt = reader.IsDBNull(10) ? null : reader.GetDateTime(10),   // started_at
                    CompletedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11), // completed_at
                    ErrorMessage = reader.IsDBNull(12) ? null : reader.GetString(12),  // error_message
                    CatalogCode = reader.IsDBNull(13) ? null : reader.GetString(13),   // catalog_code
                    ProductSkus = reader.IsDBNull(14) ? null : reader.GetString(14),   // product_skus
                    LocaleCodes = reader.IsDBNull(15) ? null : reader.GetString(15)    // locale_codes
                });
            }

            return Ok(workflowJobDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving workflow jobs");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Complete stuck workflow jobs that have finished processing but weren't updated
    /// </summary>
    [HttpPost("complete-stuck-workflow-jobs")]
    public async Task<IActionResult> CompleteStuckWorkflowJobs()
    {
        try
        {
            var updatedJobs = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE averis_pricing.catalog_workflow_jobs 
                SET status = 'completed', 
                    progress_percentage = 100,
                    completed_at = CURRENT_TIMESTAMP,
                    completed_items = total_items
                WHERE status = 'running' 
                AND created_at < NOW() - INTERVAL '5 minutes'");

            _logger.LogInformation("Completed {UpdatedJobs} stuck workflow jobs", updatedJobs);
            
            return Ok(new { completedJobs = updatedJobs, message = $"Completed {updatedJobs} stuck workflow jobs" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing stuck workflow jobs");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Complete a specific stuck workflow job by ID
    /// </summary>
    [HttpPost("complete-stuck-workflow-job/{jobId}")]
    public async Task<IActionResult> CompleteStuckWorkflowJob(Guid jobId)
    {
        try
        {
            var updatedJobs = await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE averis_pricing.catalog_workflow_jobs 
                SET status = 'completed', 
                    progress_percentage = 100,
                    completed_at = CURRENT_TIMESTAMP,
                    completed_items = total_items
                WHERE id = {0} AND status = 'running'", jobId);

            if (updatedJobs > 0)
            {
                _logger.LogInformation("Completed stuck workflow job {JobId}", jobId);
                return Ok(new { message = $"Successfully completed workflow job {jobId}" });
            }
            else
            {
                return NotFound(new { message = $"Workflow job {jobId} not found or not in running state" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing stuck workflow job {JobId}", jobId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private async Task<List<string>> GetLocaleCodesForRegion(Guid regionId)
    {
        return await _context.Locales
            .Where(l => l.Country.RegionId == regionId && l.IsActive)
            .Select(l => l.Code)
            .ToListAsync();
    }
}

#region DTOs

public class CatalogSummaryDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public string MarketSegmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int ProductCount { get; set; }
}

public class CatalogDetailDto : CatalogSummaryDto
{
    public string CurrencySymbol { get; set; } = string.Empty;
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public List<CatalogProductDto> Products { get; set; } = new();
}

public class CatalogProductDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public decimal DiscountPercentage { get; set; }
    public decimal? OverridePrice { get; set; }
    public DateTime AddedAt { get; set; }
    public int LocaleFinancialCount { get; set; }
}

public class AvailableProductDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AddProductsToCatalogRequest
{
    public List<Guid> ProductIds { get; set; } = new();
    public decimal? DefaultDiscountPercentage { get; set; }
    public bool GenerateMultiLanguageContent { get; set; } = true;
    public string? SourceLocale { get; set; }
    public string? CreatedBy { get; set; }
}

public class AddProductsToCatalogResponse
{
    public Guid CatalogId { get; set; }
    public List<Guid> SuccessfulProducts { get; set; } = new();
    public List<ProductAddError> FailedProducts { get; set; } = new();
    public List<Guid> JobIds { get; set; } = new();
}

public class ProductAddError
{
    public Guid ProductId { get; set; }
    public string Error { get; set; } = string.Empty;
}

public class BackgroundJobDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Result { get; set; }
    public int RetryCount { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

#endregion