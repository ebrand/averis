using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service implementation for communicating with the Product Staging API
/// </summary>
public class ProductStagingApiService : IProductStagingApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductStagingApiService> _logger;
    private readonly string _productStagingApiUrl;

    public ProductStagingApiService(HttpClient httpClient, IConfiguration configuration, ILogger<ProductStagingApiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _productStagingApiUrl = configuration["ProductStagingApiUrl"] ?? "http://averis-product-staging-api:6002";
    }

    public async Task<ProductDetailsDto?> GetProductAsync(Guid productId)
    {
        try
        {
            _logger.LogInformation("Attempting to fetch product {ProductId} from {Url}", productId, _productStagingApiUrl);
            var response = await _httpClient.GetAsync($"{_productStagingApiUrl}/api/products/{productId}");
            
            if (response.IsSuccessStatusCode)
            {
                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("Product API response: {JsonContent}", jsonContent);
                var product = JsonSerializer.Deserialize<ProductDetailsDto>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                _logger.LogInformation("Successfully fetched product {ProductId}: {Name}", productId, product?.Name ?? "null");
                return product;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Product {ProductId} not found in Product Staging API", productId);
                return null;
            }
            else
            {
                _logger.LogWarning("Failed to fetch product {ProductId} from Product Staging API. Status: {StatusCode}, Url: {Url}", 
                    productId, response.StatusCode, _productStagingApiUrl);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {ProductId} from Product Staging API at {Url}", productId, _productStagingApiUrl);
            return null;
        }
    }

    public async Task<List<ProductDetailsDto>> GetProductsAsync(List<Guid> productIds)
    {
        Console.WriteLine($"🔍 PRODUCT SERVICE DEBUG: GetProductsAsync called with {productIds.Count} product IDs");
        _logger.LogCritical("🔍 PRODUCT SERVICE CRITICAL: GetProductsAsync called with {ProductCount} product IDs: {ProductIds}", productIds.Count, string.Join(", ", productIds.Take(3)));
        
        var products = new List<ProductDetailsDto>();
        
        // Make parallel requests for better performance
        var tasks = productIds.Select(async productId =>
        {
            Console.WriteLine($"🔍 PRODUCT SERVICE DEBUG: About to fetch product {productId}");
            var product = await GetProductAsync(productId);
            Console.WriteLine($"🔍 PRODUCT SERVICE DEBUG: Fetched product {productId}: {product?.Name ?? "null"}");
            return product;
        });

        var results = await Task.WhenAll(tasks);
        
        foreach (var product in results)
        {
            if (product != null)
            {
                products.Add(product);
            }
        }

        Console.WriteLine($"🔍 PRODUCT SERVICE DEBUG: Returning {products.Count} products out of {productIds.Count} requested");
        _logger.LogCritical("🔍 PRODUCT SERVICE CRITICAL: Returning {SuccessCount} products out of {RequestedCount} requested", products.Count, productIds.Count);

        return products;
    }
}