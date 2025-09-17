using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service implementation for CatalogProduct business logic operations
/// </summary>
public class CatalogProductService : ICatalogProductService
{
    private readonly PricingDbContext _context;
    private readonly ILogger<CatalogProductService> _logger;
    private readonly ILocaleFinancialService _localeFinancialService;
    private readonly IMultiLanguageContentService _multiLanguageContentService;
    private readonly IBackgroundJobQueue _backgroundJobQueue;
    private readonly ILocalizationApiService _localizationApiService;
    private readonly IProductStagingApiService _productStagingApiService;

    public CatalogProductService(
        PricingDbContext context, 
        ILogger<CatalogProductService> logger,
        ILocaleFinancialService localeFinancialService,
        IMultiLanguageContentService multiLanguageContentService,
        IBackgroundJobQueue backgroundJobQueue,
        ILocalizationApiService localizationApiService,
        IProductStagingApiService productStagingApiService)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _localeFinancialService = localeFinancialService ?? throw new ArgumentNullException(nameof(localeFinancialService));
        _multiLanguageContentService = multiLanguageContentService ?? throw new ArgumentNullException(nameof(multiLanguageContentService));
        _backgroundJobQueue = backgroundJobQueue ?? throw new ArgumentNullException(nameof(backgroundJobQueue));
        _localizationApiService = localizationApiService ?? throw new ArgumentNullException(nameof(localizationApiService));
        _productStagingApiService = productStagingApiService ?? throw new ArgumentNullException(nameof(productStagingApiService));
    }

    public async Task<CatalogProductPagedResponse> GetCatalogProductsAsync(CatalogProductsQuery query)
    {
        try
        {
            var dbQuery = _context.CatalogProducts
                .Include(cp => cp.Catalog)
                .AsQueryable();

            // Apply filters
            if (query.CatalogId.HasValue)
                dbQuery = dbQuery.Where(cp => cp.CatalogId == query.CatalogId.Value);

            if (query.ProductId.HasValue)
                dbQuery = dbQuery.Where(cp => cp.ProductId == query.ProductId.Value);

            if (query.IsActive.HasValue)
                dbQuery = dbQuery.Where(cp => cp.IsActive == query.IsActive.Value);

            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                dbQuery = dbQuery.Where(cp => 
                    cp.Catalog!.Name.Contains(query.SearchTerm) ||
                    cp.Catalog!.Code.Contains(query.SearchTerm));
            }

            var totalCount = await dbQuery.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var catalogProducts = await dbQuery
                .OrderByDescending(cp => cp.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            // Fetch product details from Product Staging API to enrich the DTOs
            var productIds = catalogProducts.Select(cp => cp.ProductId).ToList();
            Console.WriteLine($"🔎 CATALOG SERVICE DEBUG: About to fetch {productIds.Count} product details via ProductStagingApiService");
            _logger.LogCritical("🔎 CATALOG SERVICE CRITICAL: About to fetch {ProductCount} product details via ProductStagingApiService", productIds.Count);
            Console.WriteLine($"🔎 CATALOG SERVICE DEBUG: ProductIds are: {string.Join(", ", productIds.Take(3))}");
            
            var productDetails = await _productStagingApiService.GetProductsAsync(productIds);
            
            Console.WriteLine($"🔎 CATALOG SERVICE DEBUG: ProductStagingApiService returned {productDetails.Count} products");
            _logger.LogCritical("🔎 CATALOG SERVICE CRITICAL: ProductStagingApiService returned {ReturnedCount} products", productDetails.Count);
            var productDetailsMap = productDetails.ToDictionary(p => p.Id, p => p);

            var catalogProductDtos = catalogProducts.Select(cp => MapToDto(cp, productDetailsMap.GetValueOrDefault(cp.ProductId))).ToList();

            return new CatalogProductPagedResponse
            {
                CatalogProducts = catalogProductDtos,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = totalPages,
                HasNext = query.Page < totalPages,
                HasPrevious = query.Page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog products");
            throw;
        }
    }

    public async Task<CatalogProductDto> CreateCatalogProductAsync(CreateCatalogProductRequest request)
    {
        try
        {
            // Check if relationship already exists
            var existing = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.CatalogId == request.CatalogId && cp.ProductId == request.ProductId);

            if (existing != null)
            {
                if (existing.IsActive)
                {
                    throw new InvalidOperationException("Product is already in this catalog");
                }
                
                // Reactivate existing relationship
                existing.IsActive = true;
                await _context.SaveChangesAsync();
                return MapToDto(existing);
            }

            var catalogProduct = new CatalogProduct
            {
                Id = Guid.NewGuid(),
                CatalogId = request.CatalogId,
                ProductId = request.ProductId,
                IsActive = request.IsActive,
                OverridePrice = request.OverridePrice,
                DiscountPercentage = request.DiscountPercentage,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CatalogProducts.Add(catalogProduct);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added product {ProductId} to catalog {CatalogId}", 
                request.ProductId, request.CatalogId);

            return MapToDto(catalogProduct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating catalog product relationship");
            throw;
        }
    }

    public async Task<bool> RemoveProductFromCatalogAsync(Guid catalogId, Guid productId)
    {
        try
        {
            var catalogProduct = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

            if (catalogProduct == null)
                return false;

            // Actually delete the catalog product relationship (not just deactivate)
            _context.CatalogProducts.Remove(catalogProduct);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed product {ProductId} from catalog {CatalogId}", 
                productId, catalogId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing product from catalog");
            throw;
        }
    }

    public async Task<CatalogProductResponse> BulkAddProductsToCatalogAsync(BulkCatalogProductRequest request)
    {
        try
        {
            var response = new CatalogProductResponse { Success = true, TotalProcessed = request.ProductIds.Count };
            var addedProducts = new List<CatalogProductDto>();
            
            foreach (var productId in request.ProductIds)
            {
                try
                {
                    var createRequest = new CreateCatalogProductRequest
                    {
                        CatalogId = request.CatalogId,
                        ProductId = productId,
                        IsActive = request.IsActive
                    };
                    
                    var catalogProduct = await CreateCatalogProductAsync(createRequest);
                    addedProducts.Add(catalogProduct);
                    response.SuccessfullyProcessed++;
                }
                catch (Exception ex)
                {
                    response.Errors.Add($"Product {productId}: {ex.Message}");
                }
            }

            response.CatalogProducts = addedProducts;
            response.Message = $"Processed {response.SuccessfullyProcessed} of {response.TotalProcessed} products";

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk add products to catalog");
            throw;
        }
    }

    // Implement remaining interface methods with basic implementations
    public async Task<CatalogProductPagedResponse> GetProductsInCatalogAsync(Guid catalogId, int page = 1, int pageSize = 20, string? searchTerm = null, bool? isActive = null)
    {
        var query = new CatalogProductsQuery
        {
            CatalogId = catalogId,
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive
        };
        return await GetCatalogProductsAsync(query);
    }

    public async Task<List<CatalogProductDto>> GetCatalogsForProductAsync(Guid productId, bool activeOnly = true)
    {
        var catalogProducts = await _context.CatalogProducts
            .Include(cp => cp.Catalog)
            .Where(cp => cp.ProductId == productId && (!activeOnly || cp.IsActive))
            .ToListAsync();

        return catalogProducts.Select(MapToDto).ToList();
    }

    public async Task<CatalogProductDto?> GetCatalogProductByIdAsync(Guid id)
    {
        var catalogProduct = await _context.CatalogProducts
            .Include(cp => cp.Catalog)
            .FirstOrDefaultAsync(cp => cp.Id == id);

        return catalogProduct != null ? MapToDto(catalogProduct) : null;
    }

    public async Task<CatalogProductDto?> GetCatalogProductAsync(Guid catalogId, Guid productId)
    {
        var catalogProduct = await _context.CatalogProducts
            .Include(cp => cp.Catalog)
            .FirstOrDefaultAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId);

        return catalogProduct != null ? MapToDto(catalogProduct) : null;
    }

    public async Task<CatalogProductDto?> UpdateCatalogProductAsync(Guid id, UpdateCatalogProductRequest request)
    {
        var catalogProduct = await _context.CatalogProducts.FirstOrDefaultAsync(cp => cp.Id == id);
        if (catalogProduct == null) return null;

        // Update IsActive only if provided
        if (request.IsActive.HasValue)
            catalogProduct.IsActive = request.IsActive.Value;
        
        // Always update pricing fields to support clearing them
        // Frontend should send null explicitly when switching pricing modes
        catalogProduct.OverridePrice = request.OverridePrice;
        catalogProduct.DiscountPercentage = request.DiscountPercentage ?? 0;
            
        catalogProduct.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(catalogProduct);
    }

    public async Task<CatalogProductResponse> BulkRemoveProductsFromCatalogAsync(Guid catalogId, List<Guid> productIds)
    {
        var response = new CatalogProductResponse { Success = true, TotalProcessed = productIds.Count };
        
        foreach (var productId in productIds)
        {
            var success = await RemoveProductFromCatalogAsync(catalogId, productId);
            if (success) response.SuccessfullyProcessed++;
        }

        response.Message = $"Removed {response.SuccessfullyProcessed} of {response.TotalProcessed} products";
        return response;
    }

    public async Task<bool> ActivateCatalogProductAsync(Guid id)
    {
        return await UpdateCatalogProductAsync(id, new UpdateCatalogProductRequest { IsActive = true }) != null;
    }

    public async Task<bool> DeactivateCatalogProductAsync(Guid id)
    {
        return await UpdateCatalogProductAsync(id, new UpdateCatalogProductRequest { IsActive = false }) != null;
    }

    public async Task<bool> IsProductInCatalogAsync(Guid catalogId, Guid productId, bool activeOnly = true)
    {
        return await _context.CatalogProducts
            .AnyAsync(cp => cp.CatalogId == catalogId && cp.ProductId == productId && (!activeOnly || cp.IsActive));
    }

    public async Task<int> GetProductCountInCatalogAsync(Guid catalogId, bool activeOnly = true)
    {
        return await _context.CatalogProducts
            .CountAsync(cp => cp.CatalogId == catalogId && (!activeOnly || cp.IsActive));
    }

    public async Task<Dictionary<string, object>> GetCatalogProductStatsAsync()
    {
        var totalCount = await _context.CatalogProducts.CountAsync();
        var activeCount = await _context.CatalogProducts.CountAsync(cp => cp.IsActive);
        
        return new Dictionary<string, object>
        {
            ["total"] = totalCount,
            ["active"] = activeCount,
            ["inactive"] = totalCount - activeCount
        };
    }

    // ========================================
    // LOCALE-AWARE WORKFLOW METHODS
    // ========================================

    public async Task<List<AvailableLocaleDto>> GetAvailableLocalesForCatalogAsync(Guid catalogId)
    {
        try
        {
            _logger.LogInformation("Getting available locales for catalog {CatalogId}", catalogId);

            var result = new List<AvailableLocaleDto>();

            // Build the query to get NON-ENGLISH locales for this catalog's region
            var sql = @"
                SELECT 
                    l.id,
                    l.code,
                    l.name,
                    c.code as country_code,
                    c.name as country_name,
                    cur.code as currency_code,
                    (c.default_locale_id = l.id) as is_default,
                    COALESCE(l.priority_in_country, 1) as priority
                FROM averis_pricing.catalogs cat
                JOIN averis_pricing.regions r ON r.id = cat.region_id
                JOIN averis_pricing.countries c ON c.region_id = r.id
                JOIN averis_pricing.locales l ON l.country_id = c.id
                JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
                WHERE cat.id = @catalogId
                    AND cat.is_active = true
                    AND c.is_active = true
                    AND l.is_active = true
                    AND cur.is_active = true
                    AND l.code NOT LIKE 'en_%'
                ORDER BY c.name, COALESCE(l.priority_in_country, 1), l.name";

            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandText = sql;
            
            // Use named parameters for PostgreSQL
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@catalogId";
            parameter.Value = catalogId;
            command.Parameters.Add(parameter);
            
            if (_context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
            {
                await _context.Database.OpenConnectionAsync();
            }
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new AvailableLocaleDto
                {
                    LocaleId = reader.GetGuid(0),                    // id
                    LocaleCode = reader.GetString(1),               // code
                    LocaleName = reader.GetString(2),               // name
                    CountryCode = reader.GetString(3),              // country_code
                    CountryName = reader.GetString(4),              // country_name
                    CurrencyCode = reader.GetString(5),             // currency_code
                    IsDefault = reader.GetBoolean(6),               // is_default
                    Priority = reader.GetInt32(7)                   // priority
                });
            }

            _logger.LogInformation("Found {Count} available locales for catalog {CatalogId}", result.Count, catalogId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locales for catalog {CatalogId}", catalogId);
            throw;
        }
    }

    public async Task<LocaleWorkflowResponse> CalculateLocaleFinancialsAsync(Guid catalogProductId, CalculateLocaleFinancialsRequest request)
    {
        try
        {
            _logger.LogInformation("Starting locale financial calculations for catalog product {CatalogProductId}", catalogProductId);

            // Get catalog product
            var catalogProduct = await _context.CatalogProducts
                .Include(cp => cp.Catalog)
                .FirstOrDefaultAsync(cp => cp.Id == catalogProductId);

            if (catalogProduct == null)
                throw new InvalidOperationException($"Catalog product {catalogProductId} not found");

            // Create workflow job
            var jobId = await CreateWorkflowJobAsync(
                $"Locale Financials - {catalogProduct.Catalog!.Name}",
                "locale_financials",
                catalogProduct.CatalogId,
                new[] { catalogProduct.ProductId },
                request.LocaleIds.ToArray(),
                request.InitiatedBy ?? "system",
                null,
                request.Configuration);

            // Update catalog product workflow status
            catalogProduct.LocaleWorkflowStatus = "in_progress";
            catalogProduct.WorkflowInitiatedBy = request.InitiatedBy;
            catalogProduct.WorkflowInitiatedAt = DateTime.UtcNow;
            catalogProduct.SelectedLocales = request.LocaleIds.Select(id => id.ToString()).ToArray();

            // Enqueue background job for locale financial processing
            var jobParameters = new LocaleFinancialJobParameters
            {
                ProductId = catalogProduct.ProductId,
                CatalogId = catalogProduct.CatalogId,
                LocaleIds = request.LocaleIds
            };

            var backgroundJobId = await _backgroundJobQueue.EnqueueAsync(
                JobType.CalculateLocaleFinancials,
                catalogProduct.ProductId.ToString(),
                "Product",
                jobParameters,
                request.InitiatedBy ?? "system",
                jobId, // Link to workflow job
                catalogProductId); // Link to catalog product

            _logger.LogInformation("Enqueued background job {BackgroundJobId} for locale financial processing", backgroundJobId);

            // Update workflow job status to running
            await UpdateWorkflowJobStatusAsync(jobId, "running", 0, 0);

            // Update catalog product status to in_progress
            catalogProduct.LocaleWorkflowStatus = "in_progress";

            await _context.SaveChangesAsync();

            return new LocaleWorkflowResponse
            {
                WorkflowJobId = jobId,
                Status = "running",
                ProcessedLocales = new List<Guid>(),
                FailedLocales = new List<Guid>(),
                Message = $"Started locale financial processing for {request.LocaleIds.Count} locales",
                EstimatedCompletion = DateTime.UtcNow.AddMinutes(request.LocaleIds.Count * 0.5) // Estimate 30 seconds per locale
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating locale financials for catalog product {CatalogProductId}", catalogProductId);
            throw;
        }
    }

    public async Task<ContentWorkflowResponse> GenerateMultiLanguageContentAsync(Guid catalogProductId, GenerateMultiLanguageContentRequest request)
    {
        try
        {
            _logger.LogInformation("Starting multi-language content generation for catalog product {CatalogProductId}", catalogProductId);

            // Get catalog product
            var catalogProduct = await _context.CatalogProducts
                .Include(cp => cp.Catalog)
                .FirstOrDefaultAsync(cp => cp.Id == catalogProductId);

            if (catalogProduct == null)
                throw new InvalidOperationException($"Catalog product {catalogProductId} not found");

            // Get product SKU for job naming
            string productSku = "Unknown";
            try
            {
                using var httpClient = new HttpClient();
                var productResponse = await httpClient.GetAsync($"http://localhost:6002/api/products/{catalogProduct.ProductId}");
                if (productResponse.IsSuccessStatusCode)
                {
                    var productJson = await productResponse.Content.ReadAsStringAsync();
                    var productData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(productJson);
                    if (productData.TryGetProperty("sku", out var skuElement) && skuElement.GetString() is string sku)
                    {
                        productSku = sku;
                    }
                }
            }
            catch
            {
                // Use fallback if SKU fetch fails
                productSku = catalogProduct.ProductId.ToString().Substring(0, 8);
            }

            // Create separate workflow jobs for each target locale (one job per product-locale combination)
            var locales = await _context.Locales
                .Where(l => request.TargetLocaleCodes.Contains(l.Code))
                .ToListAsync();

            var createdJobIds = new List<Guid>();

            foreach (var locale in locales)
            {
                // Create individual workflow job for this specific translation
                var jobId = await CreateWorkflowJobAsync(
                    $"Translation ({request.SourceLocaleCode} → {locale.Code})",
                    "translation",
                    catalogProduct.CatalogId,
                    new[] { catalogProduct.ProductId },
                    new[] { locale.Id },
                    request.InitiatedBy ?? "system",
                    null,
                    request.Configuration);

                createdJobIds.Add(jobId);

                // Create localization workflow job using the dedicated Localization API
                var localizationRequest = new CreateLocalizationWorkflowRequest
                {
                    JobName = $"Localization: {productSku} ({request.SourceLocaleCode} → {locale.Code})",
                    CatalogId = catalogProduct.CatalogId,
                    ProductIds = new List<Guid> { catalogProduct.ProductId },
                    FromLocale = request.SourceLocaleCode,
                    ToLocale = locale.Code,
                    CreatedBy = request.InitiatedBy ?? "system",
                    JobData = new 
                    {
                        catalogProductId = catalogProductId,
                        workflowJobId = jobId,
                        sourceContent = new
                        {
                            // Add any source content data here if needed
                        }
                    }
                };

                try
                {
                    var localizationWorkflow = await _localizationApiService.CreateLocalizationWorkflowAsync(localizationRequest);
                    _logger.LogInformation("Created localization workflow {WorkflowId} for product {ProductId} locale {Locale}", 
                        localizationWorkflow.Id, catalogProduct.ProductId, locale.Code);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create localization workflow for product {ProductId} locale {Locale}", 
                        catalogProduct.ProductId, locale.Code);
                    // Continue with other locales even if one fails
                }

                // Create separate currency conversion job for this locale
                var currencyJobId = await CreateWorkflowJobAsync(
                    $"Currency Conversion ({catalogProduct.Catalog!.Currency?.Code ?? "USD"} → {locale.Currency?.Code ?? locale.Code})",
                    "currency_conversion",
                    catalogProduct.CatalogId,
                    new[] { catalogProduct.ProductId },
                    new[] { locale.Id },
                    request.InitiatedBy ?? "system",
                    null,
                    request.Configuration);

                createdJobIds.Add(currencyJobId);

                // Enqueue background job for currency conversion
                var localeJobParameters = new LocaleFinancialJobParameters
                {
                    ProductId = catalogProduct.ProductId,
                    CatalogId = catalogProduct.CatalogId,
                    LocaleIds = new List<Guid> { locale.Id }
                };

                var localeBackgroundJobId = await _backgroundJobQueue.EnqueueAsync(
                    JobType.CalculateLocaleFinancials,
                    catalogProduct.ProductId.ToString(),
                    "Product",
                    localeJobParameters,
                    request.InitiatedBy ?? "system",
                    currencyJobId, // Link to this specific currency workflow job
                    catalogProductId); // Link to catalog product
            }

            // Update catalog product workflow status
            catalogProduct.ContentWorkflowStatus = "in_progress";
            catalogProduct.WorkflowInitiatedBy = request.InitiatedBy;
            catalogProduct.WorkflowInitiatedAt = DateTime.UtcNow;

            // Update all workflow job statuses to running
            foreach (var jobId in createdJobIds)
            {
                await UpdateWorkflowJobStatusAsync(jobId, "running", 0, 0);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Created {JobCount} granular workflow jobs for product {ProductSku}: {TranslationJobs} translations and {CurrencyJobs} currency conversions", 
                createdJobIds.Count, productSku, locales.Count, locales.Count);

            return new ContentWorkflowResponse
            {
                WorkflowJobId = createdJobIds.FirstOrDefault(), // Return first job ID for backward compatibility
                Status = "running",
                GeneratedLanguages = new List<string>(),
                FailedLanguages = new List<string>(),
                Message = $"Started {createdJobIds.Count} jobs: {locales.Count} translations and {locales.Count} currency conversions for {productSku}",
                EstimatedCompletion = DateTime.UtcNow.AddMinutes(locales.Count * 0.5) // Estimate 0.5 minutes per job (faster with parallelism)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating multi-language content for catalog product {CatalogProductId}", catalogProductId);
            throw;
        }
    }

    public async Task<WorkflowProgressResponse> GetWorkflowProgressAsync(Guid catalogProductId)
    {
        try
        {
            var catalogProduct = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.Id == catalogProductId);

            if (catalogProduct == null)
                throw new InvalidOperationException($"Catalog product {catalogProductId} not found");

            // This would query the workflow progress tables created in the migration
            // For now, return basic status from catalog product
            return new WorkflowProgressResponse
            {
                CatalogProductId = catalogProductId,
                LocaleWorkflowStatus = catalogProduct.LocaleWorkflowStatus ?? "pending",
                ContentWorkflowStatus = catalogProduct.ContentWorkflowStatus ?? "pending",
                LocaleProgress = new List<WorkflowProgressItem>(),
                ContentProgress = new List<WorkflowProgressItem>(),
                OverallProgress = CalculateOverallProgress(catalogProduct.LocaleWorkflowStatus, catalogProduct.ContentWorkflowStatus)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow progress for catalog product {CatalogProductId}", catalogProductId);
            throw;
        }
    }

    public async Task<List<WorkflowTemplateDto>> GetWorkflowTemplatesAsync()
    {
        try
        {
            // Return mock templates for now
            var result = new List<WorkflowTemplateDto>
            {
                new WorkflowTemplateDto
                {
                    Id = Guid.NewGuid(),
                    TemplateName = "Quick Localization - Major Markets",
                    TemplateType = "full_localization",
                    Description = "Generates locale-specific financials and content for major markets (US, EU, UK, Canada)",
                    SupportedLocales = new List<string> { "en_US", "en_GB", "en_CA", "fr_FR", "de_DE", "es_ES", "it_IT" },
                    DefaultConfig = new Dictionary<string, object>(),
                    IsSystemTemplate = true,
                    EstimatedSecondsPerItem = 8
                },
                new WorkflowTemplateDto
                {
                    Id = Guid.NewGuid(),
                    TemplateName = "Pricing Only - All Markets",
                    TemplateType = "locale_financials",
                    Description = "Calculates locale-specific pricing for all available markets without content translation",
                    SupportedLocales = new List<string>(),
                    DefaultConfig = new Dictionary<string, object>(),
                    IsSystemTemplate = true,
                    EstimatedSecondsPerItem = 3
                }
            };

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow templates");
            throw;
        }
    }

    public async Task<BatchWorkflowResponse> CreateBatchWorkflowAsync(CreateBatchWorkflowRequest request)
    {
        try
        {
            _logger.LogInformation("Creating batch workflow: {JobName}", request.JobName);

            var jobId = await CreateWorkflowJobAsync(
                request.JobName,
                request.JobType,
                request.CatalogId,
                request.ProductIds.ToArray(),
                request.LocaleIds.ToArray(),
                request.CreatedBy,
                request.TemplateId,
                request.JobConfig);

            var totalItems = request.ProductIds.Count * request.LocaleIds.Count;
            var estimatedCompletion = DateTime.UtcNow.AddMinutes(totalItems * 2); // Rough estimate

            // Enqueue background jobs for each product based on job type
            foreach (var productId in request.ProductIds)
            {
                if (request.JobType == "locale_financials" || request.JobType == "full_localization")
                {
                    var localeJobParameters = new LocaleFinancialJobParameters
                    {
                        ProductId = productId,
                        CatalogId = request.CatalogId,
                        LocaleIds = request.LocaleIds
                    };

                    await _backgroundJobQueue.EnqueueAsync(
                        JobType.CalculateLocaleFinancials,
                        productId.ToString(),
                        "Product",
                        localeJobParameters,
                        request.CreatedBy,
                        jobId); // Link to workflow job

                    _logger.LogInformation("Enqueued locale financials job for product {ProductId}", productId);
                }

                if (request.JobType == "multi_language_content" || request.JobType == "full_localization")
                {
                    // For batch workflows, we need to extract target locales from the workflow configuration
                    var targetLocaleCodes = new List<string> { "es_ES", "fr_FR", "de_DE", "it_IT" }; // Default target languages
                    
                    // Create localization workflows for each target locale using the dedicated Localization API
                    foreach (var targetLocaleCode in targetLocaleCodes)
                    {
                        var localizationRequest = new CreateLocalizationWorkflowRequest
                        {
                            JobName = $"Batch Localization: Product {productId.ToString().Substring(0, 8)} (en_US → {targetLocaleCode})",
                            CatalogId = request.CatalogId,
                            ProductIds = new List<Guid> { productId },
                            FromLocale = "en_US", // Default source locale
                            ToLocale = targetLocaleCode,
                            CreatedBy = request.CreatedBy,
                            JobData = new 
                            {
                                batchWorkflowJobId = jobId,
                                batchJob = true
                            }
                        };

                        try
                        {
                            var localizationWorkflow = await _localizationApiService.CreateLocalizationWorkflowAsync(localizationRequest);
                            _logger.LogInformation("Created batch localization workflow {WorkflowId} for product {ProductId} locale {Locale}", 
                                localizationWorkflow.Id, productId, targetLocaleCode);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to create batch localization workflow for product {ProductId} locale {Locale}", 
                                productId, targetLocaleCode);
                        }
                    }

                    _logger.LogInformation("Created localization workflows for product {ProductId} with {LocaleCount} target locales", productId, targetLocaleCodes.Count);
                }
            }

            // Update workflow job status to running
            await UpdateWorkflowJobStatusAsync(jobId, "running", 0, 0);

            return new BatchWorkflowResponse
            {
                JobId = jobId,
                JobName = request.JobName,
                Status = "running",
                TotalItems = totalItems,
                EstimatedCompletion = estimatedCompletion,
                Message = $"Batch workflow started with {totalItems} items to process"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating batch workflow");
            throw;
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private async Task<Guid> CreateWorkflowJobAsync(
        string jobName, string jobType, Guid catalogId, Guid[] productIds, Guid[] localeIds,
        string createdBy, Guid? templateId, Dictionary<string, object> jobConfig)
    {
        var jobId = Guid.NewGuid();
        var totalItems = productIds.Length * localeIds.Length;

        // Get catalog code for display
        var catalogCode = await _context.Catalogs
            .Where(c => c.Id == catalogId)
            .Select(c => c.Code)
            .FirstOrDefaultAsync();

        // Get product SKU for display (single product per job now)
        string productSku = "";
        if (productIds.Length == 1)
        {
            try
            {
                using var httpClient = new HttpClient();
                var productResponse = await httpClient.GetAsync($"http://localhost:6002/api/products/{productIds[0]}");
                if (productResponse.IsSuccessStatusCode)
                {
                    var productJson = await productResponse.Content.ReadAsStringAsync();
                    var productData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(productJson);
                    if (productData.TryGetProperty("sku", out var skuElement) && skuElement.GetString() is string sku)
                    {
                        productSku = sku;
                    }
                    else
                    {
                        productSku = productIds[0].ToString().Substring(0, 8) + "...";
                    }
                }
                else
                {
                    productSku = productIds[0].ToString().Substring(0, 8) + "...";
                }
            }
            catch
            {
                productSku = productIds[0].ToString().Substring(0, 8) + "...";
            }
        }
        else
        {
            // Fallback for multiple products (shouldn't happen with new single-product approach)
            productSku = $"{productIds.Length} products";
        }

        // Get locale codes for display
        var localeCodes = await _context.Locales
            .Where(l => localeIds.Contains(l.Id))
            .Select(l => l.Code)
            .ToListAsync();

        // Join locale codes for display
        var localeCodesString = string.Join(", ", localeCodes);

        // Insert workflow job with cached display fields
        await _context.Database.ExecuteSqlRawAsync(@"
            INSERT INTO averis_pricing.catalog_workflow_jobs 
            (id, job_name, job_type, catalog_id, product_ids, locale_ids, job_config, total_items, created_by, 
             catalog_code, product_skus, locale_codes)
            VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}::jsonb, {7}, {8}, {9}, {10}, {11})",
            jobId, jobName, jobType, catalogId, productIds, localeIds, 
            System.Text.Json.JsonSerializer.Serialize(jobConfig), totalItems, createdBy,
            catalogCode, productSku, localeCodesString);

        return jobId;
    }

    private async Task UpdateWorkflowJobStatusAsync(Guid jobId, string status, int completedItems, int failedItems)
    {
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE averis_pricing.catalog_workflow_jobs 
            SET status = {1}, completed_items = {2}, failed_items = {3}, 
                progress_percentage = CASE WHEN total_items > 0 THEN ({2} * 100 / total_items) ELSE 100 END,
                completed_at = CASE WHEN {1} IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = {0}",
            jobId, status, completedItems, failedItems);
    }

    private static double CalculateOverallProgress(string? localeStatus, string? contentStatus)
    {
        var localeProgress = GetStatusProgress(localeStatus);
        var contentProgress = GetStatusProgress(contentStatus);
        return (localeProgress + contentProgress) / 2.0;
    }

    private static double GetStatusProgress(string? status)
    {
        return status switch
        {
            "completed" => 100.0,
            "in_progress" => 50.0,
            "failed" => 0.0,
            _ => 0.0
        };
    }

    /// <summary>
    /// Gets NON-ENGLISH localized content and pricing for a catalog product
    /// Only returns content from product_locale_content table (not English content from base products table)
    /// </summary>
    public async Task<List<LocalizedContentDto>> GetLocalizedContentAsync(Guid catalogProductId)
    {
        try
        {
            // Get the catalog product to find the product and catalog IDs
            var catalogProduct = await _context.CatalogProducts
                .Include(cp => cp.Catalog)
                .FirstOrDefaultAsync(cp => cp.Id == catalogProductId);

            if (catalogProduct == null)
                return new List<LocalizedContentDto>();

            // Get available locales for this catalog
            var availableLocales = await GetAvailableLocalesForCatalogAsync(catalogProduct.CatalogId);
            
            // Filter to only NON-ENGLISH locales
            var nonEnglishLocales = availableLocales.Where(locale => !locale.LocaleCode.StartsWith("en_")).ToList();
            
            // Get all localized content and financial data for this product
            var result = new List<LocalizedContentDto>();

            foreach (var locale in nonEnglishLocales)
            {
                // Get content data from localization table only
                var contentData = await _context.ProductContents
                    .FirstOrDefaultAsync(pc => pc.ProductId == catalogProduct.ProductId && pc.LocaleId == locale.LocaleId);
                
                // Skip this locale if no localized content exists
                if (contentData == null)
                    continue;

                string? features = contentData.Features != null ? string.Join(", ", contentData.Features) : null;
                string? benefits = contentData.Benefits != null ? string.Join(", ", contentData.Benefits) : null;

                // Get localized financial data from database
                var financialData = await _context.ProductLocaleFinancials
                    .FirstOrDefaultAsync(plf => plf.ProductId == catalogProduct.ProductId && 
                                                plf.CatalogId == catalogProduct.CatalogId && 
                                                plf.LocaleId == locale.LocaleId);

                var localizedContent = new LocalizedContentDto
                {
                    LocaleId = locale.LocaleId,
                    LocaleCode = locale.LocaleCode,
                    LocaleName = locale.LocaleName,
                    CountryName = locale.CountryName,
                    CurrencyCode = locale.CurrencyCode,
                    IsDefault = locale.IsDefault,
                    
                    // Content data from localization table only
                    Name = contentData.Name,
                    Description = contentData.Description,
                    ShortDescription = contentData.ShortDescription,
                    MarketingCopy = contentData.MarketingCopy,
                    Features = features,
                    Benefits = benefits,
                    TranslationStatus = contentData.TranslationStatus,
                    ApprovedAt = contentData.ApprovedAt,
                    
                    // Financial data from database
                    LocalPrice = financialData?.LocalPrice,
                    TaxIncludedPrice = financialData?.TaxIncludedPrice,
                    TaxRate = financialData?.TaxRate,
                    TaxAmount = financialData?.TaxAmount,
                    RegulatoryFees = financialData?.RegulatoryFees,
                    CurrencyConversionRate = financialData?.CurrencyConversionRate,
                    ConversionDate = financialData?.ConversionDate,
                    IsActive = financialData?.IsActive ?? false
                };

                result.Add(localizedContent);
            }

            // Sort by locale name
            return result.OrderBy(r => r.LocaleName).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized content for catalog product {CatalogProductId}", catalogProductId);
            throw;
        }
    }

    /// <summary>
    /// Gets the count of localized content items for a catalog product
    /// Efficiently counts without loading all data
    /// </summary>
    public async Task<int> GetLocalizedContentCountAsync(Guid catalogProductId)
    {
        try
        {
            // Get the catalog product to find the product and catalog IDs
            var catalogProduct = await _context.CatalogProducts
                .FirstOrDefaultAsync(cp => cp.Id == catalogProductId);

            if (catalogProduct == null)
                return 0;

            // Get available locales for this catalog
            var availableLocales = await GetAvailableLocalesForCatalogAsync(catalogProduct.CatalogId);
            
            // Filter to only NON-ENGLISH locales
            var nonEnglishLocaleIds = availableLocales
                .Where(locale => !locale.LocaleCode.StartsWith("en_"))
                .Select(locale => locale.LocaleId)
                .ToList();
            
            // Count localized content entries for this product in non-English locales
            var count = await _context.ProductContents
                .CountAsync(pc => pc.ProductId == catalogProduct.ProductId && 
                                 nonEnglishLocaleIds.Contains(pc.LocaleId));

            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized content count for catalog product {CatalogProductId}", catalogProductId);
            throw;
        }
    }

    public async Task<bool> SaveLocalizedContentAsync(Guid productId, string localeCode, string translatedName, string translatedDescription, string createdBy)
    {
        try
        {
            _logger.LogInformation("Attempting to save localized content for product {ProductId}, locale {LocaleCode}", productId, localeCode);
            
            // Find the locale by code
            var locale = await _context.Locales
                .FirstOrDefaultAsync(l => l.Code == localeCode);
            
            if (locale == null)
            {
                _logger.LogWarning("Locale not found for code: {LocaleCode}. Available locales: {AvailableLocales}", 
                    localeCode, 
                    string.Join(", ", await _context.Locales.Select(l => l.Code).ToListAsync()));
                return false;
            }
            
            _logger.LogInformation("Found locale {LocaleId} for code {LocaleCode}", locale.Id, localeCode);

            // Check if content already exists for this product and locale
            var existingContent = await _context.ProductContents
                .FirstOrDefaultAsync(pc => pc.ProductId == productId && pc.LocaleId == locale.Id);

            if (existingContent != null)
            {
                _logger.LogInformation("Updating existing content for product {ProductId}, locale {LocaleCode}", productId, localeCode);
                
                // Update existing content
                existingContent.Name = translatedName;
                existingContent.Description = translatedDescription;
                existingContent.TranslationStatus = "completed";
                existingContent.UpdatedBy = createdBy;
                existingContent.UpdatedAt = DateTime.UtcNow;
                existingContent.ContentVersion++;
                
                _context.ProductContents.Update(existingContent);
            }
            else
            {
                _logger.LogInformation("Creating new content for product {ProductId}, locale {LocaleCode}", productId, localeCode);
                
                // Create new content
                var newContent = new ProductContent
                {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    LocaleId = locale.Id,
                    Name = translatedName,
                    Description = translatedDescription,
                    TranslationStatus = "completed",
                    CreatedBy = createdBy,
                    UpdatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ContentVersion = 1
                };
                
                await _context.ProductContents.AddAsync(newContent);
            }

            _logger.LogInformation("About to save changes to database for product {ProductId}, locale {LocaleCode}", productId, localeCode);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully saved changes to database for product {ProductId}, locale {LocaleCode}", productId, localeCode);
            
            _logger.LogInformation("Successfully saved localized content for product {ProductId} in locale {LocaleCode}", 
                productId, localeCode);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving localized content for product {ProductId} in locale {LocaleCode}. Exception: {ExceptionMessage}, InnerException: {InnerException}", 
                productId, localeCode, ex.Message, ex.InnerException?.Message ?? "None");
            return false;
        }
    }

    /// <summary>
    /// Maps a CatalogProduct entity to CatalogProductDto
    /// </summary>
    private static CatalogProductDto MapToDto(CatalogProduct catalogProduct)
    {
        return MapToDto(catalogProduct, null);
    }

    private static CatalogProductDto MapToDto(CatalogProduct catalogProduct, ProductDetailsDto? productDetails)
    {
        return new CatalogProductDto
        {
            Id = catalogProduct.Id,
            CatalogId = catalogProduct.CatalogId,
            ProductId = catalogProduct.ProductId,
            IsActive = catalogProduct.IsActive,
            OverridePrice = catalogProduct.OverridePrice,
            DiscountPercentage = catalogProduct.DiscountPercentage,
            CreatedAt = catalogProduct.CreatedAt,
            UpdatedAt = catalogProduct.UpdatedAt,
            CatalogCode = catalogProduct.Catalog?.Code,
            CatalogName = catalogProduct.Catalog?.Name,
            ProductName = productDetails?.Name,
            ProductDescription = productDetails?.Description,
            ProductSku = productDetails?.Sku
        };
    }
}