using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Commerce.Services.Localization.Api.Data;
using Commerce.Services.Localization.Api.Models;
using Commerce.Services.Localization.Api.Services;
using Commerce.Services.Localization.Api.Hubs;

namespace Commerce.Services.Localization.Api.Workers;

/// <summary>
/// Processes localization jobs and broadcasts progress via SignalR
/// </summary>
public class LocalizationProcessor : ILocalizationProcessor
{
    private readonly LocalizationDbContext _dbContext;
    private readonly IProgressBroadcastService _progressBroadcast;
    private readonly IJobManagementService _jobManagement;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LocalizationProcessor> _logger;

    public LocalizationProcessor(
        LocalizationDbContext dbContext,
        IProgressBroadcastService progressBroadcast,
        IJobManagementService jobManagement,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<LocalizationProcessor> logger)
    {
        _dbContext = dbContext;
        _progressBroadcast = progressBroadcast;
        _jobManagement = jobManagement;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task ProcessJobAsync(Guid workerId, LocalizationWorkflow job, CancellationToken cancellationToken)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            _logger.LogInformation("Worker {WorkerId} starting localization job {JobId} ({JobName})", 
                workerId, job.Id, job.JobName);

            Console.WriteLine($"DEBUG: About to call first broadcast for job {job.Id}");
            _logger.LogCritical("CRITICAL: About to call first broadcast for job {JobId}", job.Id);
            
            // Broadcast initial progress
            await BroadcastProgressAsync(workerId, job.Id, 0, "Starting localization process", job.JobName);
            
            Console.WriteLine($"DEBUG: First broadcast completed for job {job.Id}");
            _logger.LogCritical("CRITICAL: First broadcast completed for job {JobId}", job.Id);

            // Step 1: Fetch catalog products (20% progress)
            await BroadcastProgressAsync(workerId, job.Id, 10, "Fetching catalog products", job.JobName);
            
            Console.WriteLine($"🚨 PROCESSOR DEBUG: About to call FetchCatalogProductsAsync for catalog {job.CatalogId}");
            _logger.LogCritical("🚨 PROCESSOR CRITICAL: About to call FetchCatalogProductsAsync for catalog {CatalogId}", job.CatalogId);
            
            var allCatalogProducts = await FetchCatalogProductsAsync(job.CatalogId, cancellationToken);
            
            // Check if we should filter for a specific product
            var catalogProducts = allCatalogProducts;
            if (!string.IsNullOrEmpty(job.JobData))
            {
                try
                {
                    var jobData = JsonSerializer.Deserialize<Dictionary<string, object>>(job.JobData);
                    
                    // Check for specific product filtering
                    if (jobData.ContainsKey("productId") || jobData.ContainsKey("catalogProductId"))
                    {
                        var targetProductId = jobData.ContainsKey("productId") ? jobData["productId"].ToString() : null;
                        var targetCatalogProductId = jobData.ContainsKey("catalogProductId") ? jobData["catalogProductId"].ToString() : null;
                        
                        Console.WriteLine($"🎯 PROCESSOR DEBUG: Filtering for specific product - ProductId: {targetProductId}, CatalogProductId: {targetCatalogProductId}");
                        _logger.LogCritical("🎯 PROCESSOR CRITICAL: Filtering for specific product - ProductId: {ProductId}, CatalogProductId: {CatalogProductId}", targetProductId, targetCatalogProductId);
                        
                        catalogProducts = allCatalogProducts.Where(p => 
                            (targetProductId != null && p.ProductId.ToString() == targetProductId) ||
                            (targetCatalogProductId != null && p.Id.ToString() == targetCatalogProductId)
                        ).ToList();
                        
                        Console.WriteLine($"🎯 PROCESSOR DEBUG: Filtered from {allCatalogProducts.Count} to {catalogProducts.Count} products");
                        _logger.LogCritical("🎯 PROCESSOR CRITICAL: Filtered from {AllCount} to {FilteredCount} products", allCatalogProducts.Count, catalogProducts.Count);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"🎯 PROCESSOR DEBUG: Error parsing JobData for product filtering: {ex.Message}");
                    _logger.LogWarning("Error parsing JobData for product filtering: {Error}", ex.Message);
                    // Fall back to processing all products in catalog
                }
            }
            
            Console.WriteLine($"🚨 PROCESSOR DEBUG: Processing {catalogProducts.Count} products");
            _logger.LogCritical("🚨 PROCESSOR CRITICAL: Processing {ProductCount} products", catalogProducts.Count);
            
            await BroadcastProgressAsync(workerId, job.Id, 20, $"Found {catalogProducts.Count} products to localize", job.JobName);

            if (catalogProducts.Count == 0)
            {
                await _jobManagement.CompleteJobAsync(job.Id, JsonSerializer.Serialize(new { message = "No products found in catalog" }));
                await BroadcastJobCompleteAsync(workerId, job.Id, TimeSpan.Zero);
                return;
            }

            // Determine what type of processing to do based on job type
            var jobType = job.JobType?.ToLower() ?? "full_localization";
            
            // Map UI job types to processing logic
            var shouldDoLanguageTranslation = jobType == "multi_language_content" || 
                                            jobType == "translation" || 
                                            jobType == "full_localization";
            var shouldDoFinancialProcessing = jobType == "locale_financials" || 
                                            jobType == "currency_conversion" || 
                                            jobType == "full_localization";

            Console.WriteLine($"🎯 PROCESSOR DEBUG: Job type is '{jobType}' - Language: {shouldDoLanguageTranslation}, Financial: {shouldDoFinancialProcessing}");
            _logger.LogCritical("🎯 PROCESSOR CRITICAL: Job type is '{JobType}' - Language: {Language}, Financial: {Financial}", jobType, shouldDoLanguageTranslation, shouldDoFinancialProcessing);

            var translatedProducts = new List<object>();
            var savedTranslations = new List<object>();
            var processedFinancials = new List<object>();

            // Step 2: Process language translations if needed (20% to 60% progress)
            if (shouldDoLanguageTranslation)
            {
                var progressStep = 40.0 / catalogProducts.Count; // 40% of progress for translations

                for (int i = 0; i < catalogProducts.Count; i++)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    var product = catalogProducts[i];
                    var progress = 20 + (int)(i * progressStep);
                    
                    await BroadcastProgressAsync(workerId, job.Id, progress, 
                        $"Translating product {i + 1} of {catalogProducts.Count}: {product.Name}", job.JobName);

                    try
                    {
                        var translatedProduct = await TranslateProductAsync(product, job.FromLocale, job.ToLocale, cancellationToken);
                        translatedProducts.Add(translatedProduct);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to translate product {ProductId}, skipping", product.Id);
                    }

                    // Small delay to simulate work and prevent overwhelming the translation API
                    await Task.Delay(500, cancellationToken);
                }

                // Step 3: Save translation results to database (60% to 70% progress)
                await BroadcastProgressAsync(workerId, job.Id, 60, "Saving translation results to database", job.JobName);
                
                var saveProgress = 10.0 / translatedProducts.Count; // 10% of progress for saving

                for (int i = 0; i < translatedProducts.Count; i++)
                {
                    var translatedProduct = translatedProducts[i] as dynamic;
                    var progress = 60 + (int)(i * saveProgress);

                    await BroadcastProgressAsync(workerId, job.Id, progress, 
                        $"Saving translation {i + 1} of {translatedProducts.Count}", job.JobName);

                    try
                    {
                        var saved = await SaveTranslationToDatabaseAsync(
                            translatedProduct.Id,
                            job.ToLocale,
                            translatedProduct.TranslatedName?.ToString() ?? "",
                            translatedProduct.TranslatedDescription?.ToString() ?? "",
                            job.CreatedBy ?? "Localization Service");

                        if (saved)
                        {
                            savedTranslations.Add(translatedProduct);
                        }
                    }
                    catch (Exception ex)
                    {
                        var productId = ((dynamic)translatedProduct).Id?.ToString() ?? "unknown";
                        Console.WriteLine($"Failed to save translation for product {productId}: {ex.Message}");
                    }
                }
            }
            else
            {
                Console.WriteLine($"🎯 PROCESSOR DEBUG: Skipping language translation for job type '{jobType}'");
                _logger.LogInformation("Skipping language translation for job type '{JobType}'", jobType);
            }

            // Step 4: Process financial localization if needed (70% to 90% progress)
            if (shouldDoFinancialProcessing)
            {
                await BroadcastProgressAsync(workerId, job.Id, 70, "Processing financial localization", job.JobName);
                
                try
                {
                    // Get target locale information for financial processing
                    var targetLocaleInfo = await GetLocaleInfoAsync(job.ToLocale);
                    if (targetLocaleInfo != null)
                    {
                        var financialProgressStep = 20.0 / catalogProducts.Count; // 20% of progress for financial processing

                        for (int i = 0; i < catalogProducts.Count; i++)
                        {
                            var product = catalogProducts[i];
                            var progress = 70 + (int)(i * financialProgressStep);
                            
                            await BroadcastProgressAsync(workerId, job.Id, progress, 
                                $"Processing financial data for product {i + 1} of {catalogProducts.Count}: {product.Name}", job.JobName);

                            try
                            {
                                var financialResult = await ProcessFinancialLocalizationAsync(
                                    product, 
                                    targetLocaleInfo.LocaleId, 
                                    job.CreatedBy ?? "Localization Service",
                                    cancellationToken);
                                
                                if (financialResult != null)
                                {
                                    processedFinancials.Add(financialResult);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to process financial localization for product {ProductId}", product.Id);
                            }

                            // Small delay to prevent overwhelming the API
                            await Task.Delay(200, cancellationToken);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Could not find locale information for {ToLocale}, skipping financial processing", job.ToLocale);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during financial localization processing");
                }
            }
            else
            {
                Console.WriteLine($"🎯 PROCESSOR DEBUG: Skipping financial processing for job type '{jobType}'");
                _logger.LogInformation("Skipping financial processing for job type '{JobType}'", jobType);
            }

            await BroadcastProgressAsync(workerId, job.Id, 95, "Finalizing localization", job.JobName);

            // Create results based on what was actually processed
            var finalResults = new
            {
                CatalogId = job.CatalogId,
                FromLocale = job.FromLocale,
                ToLocale = job.ToLocale,
                JobType = job.JobType,
                TotalProducts = catalogProducts.Count,
                SuccessfulTranslations = translatedProducts.Count,
                SavedTranslations = savedTranslations.Count,
                ProcessedFinancials = processedFinancials.Count,
                ProcessingTime = stopwatch.Elapsed,
                TranslatedProducts = shouldDoLanguageTranslation ? translatedProducts : new List<object>(),
                FinancialResults = shouldDoFinancialProcessing ? processedFinancials : new List<object>()
            };

            // Step 5: Complete the job (100% progress)
            await _jobManagement.CompleteJobAsync(job.Id, JsonSerializer.Serialize(finalResults));
            await BroadcastProgressAsync(workerId, job.Id, 100, "Localization completed successfully", job.JobName, "completed");

            // Broadcast job completion
            await BroadcastJobCompleteAsync(workerId, job.Id, stopwatch.Elapsed);

            _logger.LogInformation("Worker {WorkerId} completed localization job {JobId} in {Duration}ms", 
                workerId, job.Id, stopwatch.ElapsedMilliseconds);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Worker {WorkerId} job {JobId} was cancelled", workerId, job.Id);
            await _jobManagement.UpdateJobStatusAsync(job.Id, "cancelled", null, "Job was cancelled");
            await _progressBroadcast.BroadcastJobErrorAsync(workerId, "Job was cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Worker {WorkerId} failed processing job {JobId}", workerId, job.Id);
            await _jobManagement.FailJobAsync(job.Id, ex.Message);
            await _progressBroadcast.BroadcastJobErrorAsync(workerId, ex.Message);
        }
        finally
        {
            stopwatch.Stop();
        }
    }

    private async Task BroadcastProgressAsync(Guid workerId, Guid jobId, int progressPercentage, string currentStep, string jobName, string status = "running")
    {
        _logger.LogInformation("ABOUT TO BROADCAST: Worker {WorkerId}, Job {JobId}, Progress {Progress}%, Step: {Step}", 
            workerId, jobId, progressPercentage, currentStep);
            
        var update = new LocalizationProgressUpdate
        {
            JobId = jobId,
            WorkerId = workerId,
            JobName = jobName,
            ProgressPercentage = progressPercentage,
            CurrentStep = currentStep,
            Status = status
        };

        try
        {
            await _progressBroadcast.BroadcastProgressAsync(workerId, update);
            _logger.LogInformation("BROADCAST COMPLETED for Worker {WorkerId}, Job {JobId}", workerId, jobId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BROADCAST FAILED for Worker {WorkerId}, Job {JobId}", workerId, jobId);
        }
        
        // Only update job status if not completed (CompleteJobAsync handles the final status)
        if (status != "completed")
        {
            await _jobManagement.UpdateJobStatusAsync(jobId, status, progressPercentage, currentStep);
        }
    }

    private async Task BroadcastJobCompleteAsync(Guid workerId, Guid jobId, TimeSpan duration)
    {
        var result = new LocalizationJobResult
        {
            JobId = jobId,
            WorkerId = workerId,
            Status = "completed",
            Duration = duration
        };

        await _progressBroadcast.BroadcastJobCompleteAsync(workerId, result);
    }

    private async Task<List<CatalogProduct>> FetchCatalogProductsAsync(Guid catalogId, CancellationToken cancellationToken)
    {
        try
        {
            // Fetch catalog products from the pricing API
            var pricingApiUrl = _configuration["PricingApiUrl"] ?? "http://averis-pricing-api:6003";
            using var httpClient = _httpClientFactory.CreateClient();
            
            Console.WriteLine($"🔥 LOCALIZATION DEBUG: About to call {pricingApiUrl}/api/catalogproduct/catalog/{catalogId}/products");
            _logger.LogCritical("🔥 LOCALIZATION CRITICAL: About to call {PricingApiUrl}/api/catalogproduct/catalog/{CatalogId}/products", pricingApiUrl, catalogId);
            
            var response = await httpClient.GetAsync($"{pricingApiUrl}/api/catalogproduct/catalog/{catalogId}/products", cancellationToken);
            
            Console.WriteLine($"🔥 LOCALIZATION DEBUG: Response status: {response.StatusCode}");
            _logger.LogCritical("🔥 LOCALIZATION CRITICAL: Response status: {StatusCode}", response.StatusCode);
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
                Console.WriteLine($"🔥 LOCALIZATION DEBUG: Response content length: {jsonContent.Length}");
                
                var apiResponse = JsonSerializer.Deserialize<CatalogProductsApiResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                Console.WriteLine($"🔥 LOCALIZATION DEBUG: Parsed {apiResponse?.CatalogProducts?.Count ?? 0} catalog products");
                _logger.LogCritical("🔥 LOCALIZATION CRITICAL: Parsed {ProductCount} catalog products", apiResponse?.CatalogProducts?.Count ?? 0);
                
                return apiResponse?.CatalogProducts ?? new List<CatalogProduct>();
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                Console.WriteLine($"🔥 LOCALIZATION DEBUG: Error response: {errorContent}");
                _logger.LogCritical("🔥 LOCALIZATION CRITICAL: Failed to fetch catalog products. Status: {StatusCode}, Error: {ErrorContent}", response.StatusCode, errorContent);
                return new List<CatalogProduct>();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"🔥 LOCALIZATION DEBUG: Exception: {ex.Message}");
            _logger.LogCritical(ex, "🔥 LOCALIZATION CRITICAL: Error fetching catalog products for catalog {CatalogId}", catalogId);
            return new List<CatalogProduct>();
        }
    }

    private async Task<object> TranslateProductAsync(CatalogProduct product, string fromLocale, string toLocale, CancellationToken cancellationToken)
    {
        try
        {
            var googleTranslateApiKey = _configuration["GoogleTranslateApiKey"];
            if (string.IsNullOrEmpty(googleTranslateApiKey))
            {
                _logger.LogWarning("Google Translate API key not configured, using mock translations");
                return CreateMockTranslation(product, toLocale);
            }

            using var httpClient = _httpClientFactory.CreateClient();
            
            // Translate product name
            var translatedName = await TranslateTextAsync(httpClient, product.Name, fromLocale, toLocale, googleTranslateApiKey, cancellationToken);
            
            // Translate product description if available
            var translatedDescription = !string.IsNullOrEmpty(product.Description) 
                ? await TranslateTextAsync(httpClient, product.Description, fromLocale, toLocale, googleTranslateApiKey, cancellationToken)
                : product.Description;

            return new
            {
                Id = product.ProductId,
                OriginalName = product.Name,
                TranslatedName = translatedName,
                OriginalDescription = product.Description,
                TranslatedDescription = translatedDescription,
                Locale = toLocale,
                Sku = product.Sku,
                Price = product.Price
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error translating product {ProductId}", product.Id);
            return CreateMockTranslation(product, toLocale);
        }
    }

    private async Task<string> TranslateTextAsync(HttpClient httpClient, string text, string fromLocale, string toLocale, string apiKey, CancellationToken cancellationToken)
    {
        try
        {
            var url = $"https://translation.googleapis.com/language/translate/v2?key={apiKey}";
            var requestBody = new
            {
                q = text,
                source = fromLocale,
                target = toLocale,
                format = "text"
            };

            var response = await httpClient.PostAsJsonAsync(url, requestBody, cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonSerializer.Deserialize<GoogleTranslateResponse>(jsonContent);
                
                return result?.Data?.Translations?.FirstOrDefault()?.TranslatedText ?? text;
            }
            else
            {
                _logger.LogWarning("Translation API call failed. Status: {StatusCode}", response.StatusCode);
                return $"[{toLocale}] {text}"; // Mock translation
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling translation API");
            return $"[{toLocale}] {text}"; // Mock translation
        }
    }

    private object CreateMockTranslation(CatalogProduct product, string toLocale)
    {
        return new
        {
            Id = product.ProductId,
            OriginalName = product.Name,
            TranslatedName = $"[{toLocale}] {product.Name}",
            OriginalDescription = product.Description,
            TranslatedDescription = !string.IsNullOrEmpty(product.Description) ? $"[{toLocale}] {product.Description}" : null,
            Locale = toLocale,
            Sku = product.Sku,
            Price = product.Price
        };
    }

    private async Task<bool> SaveTranslationToDatabaseAsync(Guid productId, string localeCode, string translatedName, string translatedDescription, string createdBy)
    {
        try
        {
            var pricingApiUrl = _configuration["PricingApiUrl"] ?? "http://localhost:6003";
            using var httpClient = _httpClientFactory.CreateClient();

            var requestData = new
            {
                LocaleCode = localeCode,
                TranslatedName = translatedName,
                TranslatedDescription = translatedDescription,
                CreatedBy = createdBy
            };

            var jsonContent = JsonSerializer.Serialize(requestData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            Console.WriteLine($"💾 SAVE DEBUG: About to save translation to {pricingApiUrl}/api/catalogproduct/product/{productId}/localized-content");
            _logger.LogCritical("💾 SAVE CRITICAL: About to save translation for product {ProductId} in locale {LocaleCode} to URL: {Url}", productId, localeCode, $"{pricingApiUrl}/api/catalogproduct/product/{productId}/localized-content");
            Console.WriteLine($"💾 SAVE DEBUG: Request data: {jsonContent}");

            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{pricingApiUrl}/api/catalogproduct/product/{productId}/localized-content", content);

            Console.WriteLine($"💾 SAVE DEBUG: Response status: {response.StatusCode}");

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"💾 SAVE DEBUG: Successfully saved translation for product {productId} in locale {localeCode}");
                _logger.LogInformation("Successfully saved translation for product {ProductId} in locale {LocaleCode}", productId, localeCode);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"💾 SAVE DEBUG: Failed to save translation. Status: {response.StatusCode}, Error: {errorContent}");
                _logger.LogWarning("Failed to save translation for product {ProductId} in locale {LocaleCode}. Status: {StatusCode}, Error: {Error}", 
                    productId, localeCode, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving translation for product {ProductId} in locale {LocaleCode}", productId, localeCode);
            return false;
        }
    }

    private async Task<LocaleInfo?> GetLocaleInfoAsync(string localeCode)
    {
        try
        {
            var pricingApiUrl = _configuration["PricingApiUrl"] ?? "http://localhost:6003";
            using var httpClient = _httpClientFactory.CreateClient();
            
            var response = await httpClient.GetAsync($"{pricingApiUrl}/api/locales");
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync();
                var locales = JsonSerializer.Deserialize<List<LocaleInfo>>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                return locales?.FirstOrDefault(l => l.Code == localeCode);
            }
            else
            {
                _logger.LogWarning("Failed to fetch locales from Pricing API. Status: {StatusCode}", response.StatusCode);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching locale information for {LocaleCode}", localeCode);
            return null;
        }
    }

    private async Task<object?> ProcessFinancialLocalizationAsync(CatalogProduct product, Guid localeId, string createdBy, CancellationToken cancellationToken)
    {
        try
        {
            var pricingApiUrl = _configuration["PricingApiUrl"] ?? "http://localhost:6003";
            using var httpClient = _httpClientFactory.CreateClient();

            var requestData = new
            {
                LocaleIds = new List<Guid> { localeId },
                AutoApprove = true,
                InitiatedBy = createdBy,
                Configuration = new Dictionary<string, object>()
            };

            var jsonContent = JsonSerializer.Serialize(requestData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            _logger.LogInformation("💰 FINANCIAL DEBUG: Processing financial localization for product {ProductId} (CatalogProduct {CatalogProductId}) in locale {LocaleId}", 
                product.ProductId, product.Id, localeId);

            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{pricingApiUrl}/api/catalogproduct/{product.Id}/calculate-locale-financials", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("💰 FINANCIAL DEBUG: Successfully processed financial localization for product {ProductId}", product.ProductId);
                
                return new
                {
                    ProductId = product.ProductId,
                    CatalogProductId = product.Id,
                    LocaleId = localeId,
                    Status = "completed",
                    Response = responseContent
                };
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("💰 FINANCIAL DEBUG: Failed to process financial localization for product {ProductId}. Status: {StatusCode}, Error: {Error}", 
                    product.ProductId, response.StatusCode, errorContent);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💰 FINANCIAL ERROR: Error processing financial localization for product {ProductId}", product.ProductId);
            return null;
        }
    }
}

/// <summary>
/// Data structure for catalog products (matches Pricing API response format)
/// </summary>
public class CatalogProduct
{
    public Guid Id { get; set; }
    public Guid CatalogId { get; set; }
    public Guid ProductId { get; set; }
    public bool IsActive { get; set; }
    public decimal? OverridePrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CatalogCode { get; set; }
    public string? CatalogName { get; set; }
    public string? ProductName { get; set; }
    public string? ProductDescription { get; set; }
    public string? ProductSku { get; set; }
    
    // Compatibility properties for existing code
    public string Name => ProductName ?? string.Empty;
    public string? Description => ProductDescription;
    public string Sku => ProductSku ?? string.Empty;
    public decimal Price => OverridePrice ?? 0m;
}

/// <summary>
/// Google Translate API response structure
/// </summary>
public class GoogleTranslateResponse
{
    public GoogleTranslateData? Data { get; set; }
}

public class GoogleTranslateData
{
    public List<GoogleTranslation>? Translations { get; set; }
}

public class GoogleTranslation
{
    public string TranslatedText { get; set; } = string.Empty;
}

/// <summary>
/// API response structure for catalog products endpoint
/// </summary>
public class CatalogProductsApiResponse
{
    public List<CatalogProduct> CatalogProducts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}

/// <summary>
/// Locale information for financial processing
/// </summary>
public class LocaleInfo
{
    public Guid LocaleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
}