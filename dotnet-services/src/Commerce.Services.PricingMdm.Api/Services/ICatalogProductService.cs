using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Interface for CatalogProduct business logic operations
/// </summary>
public interface ICatalogProductService
{
    /// <summary>
    /// Gets all catalog products with optional filtering and pagination
    /// </summary>
    Task<CatalogProductPagedResponse> GetCatalogProductsAsync(CatalogProductsQuery query);

    /// <summary>
    /// Gets products in a specific catalog
    /// </summary>
    Task<CatalogProductPagedResponse> GetProductsInCatalogAsync(
        Guid catalogId, 
        int page = 1, 
        int pageSize = 20,
        string? searchTerm = null,
        bool? isActive = null);

    /// <summary>
    /// Gets catalogs containing a specific product
    /// </summary>
    Task<List<CatalogProductDto>> GetCatalogsForProductAsync(Guid productId, bool activeOnly = true);

    /// <summary>
    /// Gets a catalog product relationship by ID
    /// </summary>
    Task<CatalogProductDto?> GetCatalogProductByIdAsync(Guid id);

    /// <summary>
    /// Gets a catalog product relationship by catalog and product IDs
    /// </summary>
    Task<CatalogProductDto?> GetCatalogProductAsync(Guid catalogId, Guid productId);

    /// <summary>
    /// Creates a new catalog product relationship
    /// </summary>
    Task<CatalogProductDto> CreateCatalogProductAsync(CreateCatalogProductRequest request);

    /// <summary>
    /// Updates an existing catalog product relationship
    /// </summary>
    Task<CatalogProductDto?> UpdateCatalogProductAsync(Guid id, UpdateCatalogProductRequest request);

    /// <summary>
    /// Removes a product from a catalog (soft delete)
    /// </summary>
    Task<bool> RemoveProductFromCatalogAsync(Guid catalogId, Guid productId);

    /// <summary>
    /// Adds multiple products to a catalog in bulk
    /// </summary>
    Task<CatalogProductResponse> BulkAddProductsToCatalogAsync(BulkCatalogProductRequest request);

    /// <summary>
    /// Removes multiple products from a catalog in bulk
    /// </summary>
    Task<CatalogProductResponse> BulkRemoveProductsFromCatalogAsync(Guid catalogId, List<Guid> productIds);

    /// <summary>
    /// Activates a catalog product relationship
    /// </summary>
    Task<bool> ActivateCatalogProductAsync(Guid id);

    /// <summary>
    /// Deactivates a catalog product relationship
    /// </summary>
    Task<bool> DeactivateCatalogProductAsync(Guid id);

    /// <summary>
    /// Checks if a product is in a catalog
    /// </summary>
    Task<bool> IsProductInCatalogAsync(Guid catalogId, Guid productId, bool activeOnly = true);

    /// <summary>
    /// Gets catalog product count for a specific catalog
    /// </summary>
    Task<int> GetProductCountInCatalogAsync(Guid catalogId, bool activeOnly = true);

    /// <summary>
    /// Gets catalog product statistics
    /// </summary>
    Task<Dictionary<string, object>> GetCatalogProductStatsAsync();

    // ========================================
    // LOCALE-AWARE WORKFLOW METHODS
    // ========================================

    /// <summary>
    /// Gets available locales for a catalog based on region and market
    /// </summary>
    Task<List<AvailableLocaleDto>> GetAvailableLocalesForCatalogAsync(Guid catalogId);

    /// <summary>
    /// Calculates locale-specific financials for a catalog product
    /// </summary>
    Task<LocaleWorkflowResponse> CalculateLocaleFinancialsAsync(Guid catalogProductId, CalculateLocaleFinancialsRequest request);

    /// <summary>
    /// Generates multi-language content for a catalog product
    /// </summary>
    Task<ContentWorkflowResponse> GenerateMultiLanguageContentAsync(Guid catalogProductId, GenerateMultiLanguageContentRequest request);

    /// <summary>
    /// Gets workflow progress for a catalog product
    /// </summary>
    Task<WorkflowProgressResponse> GetWorkflowProgressAsync(Guid catalogProductId);

    /// <summary>
    /// Gets available workflow templates
    /// </summary>
    Task<List<WorkflowTemplateDto>> GetWorkflowTemplatesAsync();

    /// <summary>
    /// Creates a batch workflow job for multiple products and locales
    /// </summary>
    Task<BatchWorkflowResponse> CreateBatchWorkflowAsync(CreateBatchWorkflowRequest request);

    /// <summary>
    /// Gets localized content and pricing for a catalog product
    /// </summary>
    Task<List<LocalizedContentDto>> GetLocalizedContentAsync(Guid catalogProductId);

    /// <summary>
    /// Gets the count of localized content items for a catalog product
    /// </summary>
    Task<int> GetLocalizedContentCountAsync(Guid catalogProductId);

    /// <summary>
    /// Saves or updates localized content for a product
    /// </summary>
    Task<bool> SaveLocalizedContentAsync(Guid productId, string localeCode, string translatedName, string translatedDescription, string createdBy);
}