using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository interface for Product data operations
/// Provides abstraction layer for data access
/// </summary>
public interface IProductRepository
{
    /// <summary>
    /// Get products with filtering, sorting, and pagination
    /// </summary>
    Task<(IEnumerable<Product> Products, int TotalCount)> GetProductsAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? status = null,
        string? type = null,
        bool? available = null,
        bool? webDisplay = null,
        bool? licenseRequired = null,
        bool? contractItem = null,
        string sortBy = "name",
        string sortOrder = "ASC");

    /// <summary>
    /// Get a product by ID
    /// </summary>
    Task<Product?> GetProductByIdAsync(Guid id);

    /// <summary>
    /// Get a product by SKU
    /// </summary>
    Task<Product?> GetProductBySkuAsync(string sku);

    /// <summary>
    /// Create a new product
    /// </summary>
    Task<Product> CreateProductAsync(Product product);

    /// <summary>
    /// Update an existing product
    /// </summary>
    Task<Product> UpdateProductAsync(Product product);

    /// <summary>
    /// Delete a product by ID
    /// </summary>
    Task<bool> DeleteProductAsync(Guid id);

    /// <summary>
    /// Check if a product exists by SKU (for uniqueness validation)
    /// </summary>
    Task<bool> ProductExistsBySkuAsync(string sku, Guid? excludeId = null);

    /// <summary>
    /// Get product analytics summary
    /// </summary>
    Task<ProductAnalyticsDto> GetProductAnalyticsAsync();

    /// <summary>
    /// Get distinct product types
    /// </summary>
    Task<IEnumerable<string>> GetProductTypesAsync();

    /// <summary>
    /// Get products by status for messaging/synchronization
    /// </summary>
    Task<IEnumerable<Product>> GetProductsByStatusAsync(string status);
}