using Commerce.Services.Shared.Models.DTOs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service for synchronizing products with the Product Cache API
/// Handles HTTP communication to sync active products and remove deactivated ones
/// </summary>
public class ProductCacheService : IProductCacheService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductCacheService> _logger;
    private readonly string _productCacheApiUrl;

    public ProductCacheService(HttpClient httpClient, ILogger<ProductCacheService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        // Get Product Cache API URL from configuration, default to localhost:6002
        _productCacheApiUrl = configuration.GetConnectionString("ProductCacheApi") ?? "http://localhost:6002";
        
        _logger.LogInformation("ProductCacheService initialized with URL: {ProductCacheApiUrl}", _productCacheApiUrl);
    }

    /// <summary>
    /// Sync an active product to the Product Cache
    /// Only active products are synchronized to maintain cache efficiency
    /// </summary>
    public async Task<bool> SyncActiveProductAsync(ProductDto productDto)
    {
        if (productDto == null)
        {
            _logger.LogWarning("Cannot sync null product to cache");
            return false;
        }

        if (productDto.Status != "active")
        {
            _logger.LogWarning("Product {ProductId} ({Sku}) is not active, skipping cache sync", 
                productDto.Id, productDto.Sku);
            return false;
        }

        try
        {
            _logger.LogInformation("Syncing active product {ProductId} ({Sku}) to Product Cache", 
                productDto.Id, productDto.Sku);

            var json = JsonSerializer.Serialize(productDto, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            // Use PUT to upsert the product in the cache
            var response = await _httpClient.PutAsync($"{_productCacheApiUrl}/api/products/{productDto.Id}", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully synced product {ProductId} to Product Cache", productDto.Id);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to sync product {ProductId} to Product Cache. Status: {StatusCode}, Error: {Error}", 
                    productDto.Id, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while syncing product {ProductId} to Product Cache", productDto.Id);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while syncing product {ProductId} to Product Cache", productDto.Id);
            return false;
        }
    }

    /// <summary>
    /// Remove a product from the Product Cache when it becomes inactive
    /// </summary>
    public async Task<bool> RemoveProductFromCacheAsync(Guid productId)
    {
        try
        {
            _logger.LogInformation("Removing product {ProductId} from Product Cache", productId);

            var response = await _httpClient.DeleteAsync($"{_productCacheApiUrl}/api/products/{productId}");

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully removed product {ProductId} from Product Cache", productId);
                return true;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Product {ProductId} was not in Product Cache, no removal needed", productId);
                return true; // Not an error - product wasn't cached anyway
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to remove product {ProductId} from Product Cache. Status: {StatusCode}, Error: {Error}", 
                    productId, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while removing product {ProductId} from Product Cache", productId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while removing product {ProductId} from Product Cache", productId);
            return false;
        }
    }

    /// <summary>
    /// Check if the Product Cache API is available
    /// </summary>
    public async Task<bool> IsProductCacheAvailableAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_productCacheApiUrl}/api/health");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Product Cache API is not available at {Url}", _productCacheApiUrl);
            return false;
        }
    }
}