using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service interface for synchronizing products with the Product Cache
/// </summary>
public interface IProductCacheService
{
    /// <summary>
    /// Sync an active product to the Product Cache
    /// </summary>
    /// <param name="productDto">Product to sync</param>
    /// <returns>True if successful, false otherwise</returns>
    Task<bool> SyncActiveProductAsync(ProductDto productDto);

    /// <summary>
    /// Remove a product from the Product Cache (when deactivated)
    /// </summary>
    /// <param name="productId">Product ID to remove</param>
    /// <returns>True if successful, false otherwise</returns>
    Task<bool> RemoveProductFromCacheAsync(Guid productId);

    /// <summary>
    /// Check if Product Cache API is available
    /// </summary>
    /// <returns>True if available, false otherwise</returns>
    Task<bool> IsProductCacheAvailableAsync();
}