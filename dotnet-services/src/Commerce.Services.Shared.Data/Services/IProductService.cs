using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service interface for Product business logic
/// Provides high-level operations for product management
/// </summary>
public interface IProductService
{
    /// <summary>
    /// Get products with filtering, sorting, and pagination
    /// </summary>
    Task<PagedProductResponse> GetProductsAsync(
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
    Task<ProductDto?> GetProductByIdAsync(Guid id);

    /// <summary>
    /// Get a product by SKU
    /// </summary>
    Task<ProductDto?> GetProductBySkuAsync(string sku);

    /// <summary>
    /// Create a new product
    /// </summary>
    Task<ProductDto> CreateProductAsync(CreateProductRequest request, string? createdByUser = null);

    /// <summary>
    /// Update an existing product
    /// </summary>
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequest request, string? updatedByUser = null);

    /// <summary>
    /// Delete a product by ID
    /// </summary>
    Task<bool> DeleteProductAsync(Guid id);

    /// <summary>
    /// Get product analytics summary
    /// </summary>
    Task<ProductAnalyticsDto> GetProductAnalyticsAsync();

    /// <summary>
    /// Get distinct product types
    /// </summary>
    Task<ProductTypesResponse> GetProductTypesAsync();

    /// <summary>
    /// Validate product data for business rules
    /// </summary>
    Task<(bool IsValid, List<string> Errors)> ValidateProductAsync(CreateProductRequest request, Guid? excludeId = null);

    /// <summary>
    /// Check if a product is ready for activation
    /// </summary>
    Task<bool> IsProductReadyForActivationAsync(Guid id);

    /// <summary>
    /// Get products that need to be synchronized with downstream systems
    /// </summary>
    Task<IEnumerable<ProductDto>> GetProductsForSynchronizationAsync(string status = "active");

    /// <summary>
    /// Perform comprehensive health check including database connectivity and statistics
    /// </summary>
    Task<ServiceHealthResult> HealthCheckAsync();
}