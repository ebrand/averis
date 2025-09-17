using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Data.Repositories;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service implementation for Product business logic
/// Handles business rules, validation, and coordinates with repository layer
/// </summary>
public class ProductService : IProductService
{
    private readonly IProductRepository _repository;
    private readonly ILogger<ProductService> _logger;
    private readonly object? _messageService; // Generic to avoid direct dependency

    public ProductService(IProductRepository repository, ILogger<ProductService> logger, object? messageService = null)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _messageService = messageService;
    }

    public async Task<PagedProductResponse> GetProductsAsync(
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
        string sortOrder = "ASC")
    {
        _logger.LogInformation("Getting products with filters - Page: {Page}, Limit: {Limit}, Search: {Search}", 
            page, limit, search);

        var (products, totalCount) = await _repository.GetProductsAsync(
            page, limit, search, status, type, available, webDisplay, 
            licenseRequired, contractItem, sortBy, sortOrder);

        var productDtos = products.Select(MapToDto).ToList();

        return new PagedProductResponse
        {
            Products = productDtos,
            Pagination = new PaginationInfo
            {
                Page = page,
                Limit = limit,
                TotalItems = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / limit),
                HasNextPage = page * limit < totalCount,
                HasPreviousPage = page > 1
            }
        };
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        _logger.LogInformation("Getting product by ID: {ProductId}", id);

        var product = await _repository.GetProductByIdAsync(id);
        return product == null ? null : MapToDto(product);
    }

    public async Task<ProductDto?> GetProductBySkuAsync(string sku)
    {
        _logger.LogInformation("Getting product by SKU: {Sku}", sku);

        var product = await _repository.GetProductBySkuAsync(sku);
        return product == null ? null : MapToDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest request, string? createdByUser = null)
    {
        _logger.LogInformation("Creating new product with SKU: {Sku}", request.Sku);

        // Validate business rules
        var (isValid, errors) = await ValidateProductAsync(request);
        if (!isValid)
        {
            throw new InvalidOperationException($"Product validation failed: {string.Join(", ", errors)}");
        }

        // Map to entity
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Sku = request.Sku,
            Name = request.Name,
            Description = request.Description,
            Type = request.Type,
            BasePrice = request.BasePrice,
            CostPrice = request.CostPrice,
            LicenseRequiredFlag = request.LicenseRequiredFlag,
            SeatBasedPricingFlag = request.SeatBasedPricingFlag,
            WebDisplayFlag = request.WebDisplayFlag,
            AvaTaxCode = request.AvaTaxCode,
            CanBeFulfilledFlag = request.CanBeFulfilledFlag,
            ContractItemFlag = request.ContractItemFlag,
            Slug = request.Slug,
            LongDescription = request.LongDescription,
            Status = request.Status,
            AvailableFlag = request.AvailableFlag,
            CreatedBy = createdByUser ?? "system",
            UpdatedBy = createdByUser ?? "system"
        };

        // Set navigation properties
        product.Categorization = request.Categorization;
        product.Pricing = request.Pricing.Select(p => new PricingEntry
        {
            CurrencyCode = p.CurrencyCode,
            UnitPrice = p.UnitPrice,
            OnlinePrice = p.OnlinePrice,
            PriceLevel = p.PriceLevel
        }).ToList();
        product.Approvals = request.Approvals.Select(a => new ApprovalEntry
        {
            ApprovalType = a.ApprovalType,
            Status = a.Status,
            ApprovedBy = a.ApprovedBy,
            ApprovedDate = a.ApprovedDate,
            Comments = a.Comments
        }).ToList();

        var createdProduct = await _repository.CreateProductAsync(product);
        
        _logger.LogInformation("Successfully created product: {ProductName} ({ProductId})", 
            createdProduct.Name, createdProduct.Id);

        return MapToDto(createdProduct);
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequest request, string? updatedByUser = null)
    {
        _logger.LogInformation("Updating product: {ProductId}", id);

        var existingProduct = await _repository.GetProductByIdAsync(id);
        if (existingProduct == null)
        {
            _logger.LogWarning("Product not found for update: {ProductId}", id);
            return null;
        }

        // Apply partial updates
        if (!string.IsNullOrEmpty(request.Sku)) existingProduct.Sku = request.Sku;
        if (!string.IsNullOrEmpty(request.Name)) existingProduct.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Description)) existingProduct.Description = request.Description;
        if (!string.IsNullOrEmpty(request.Type)) existingProduct.Type = request.Type;
        if (request.BasePrice.HasValue) existingProduct.BasePrice = request.BasePrice.Value;
        if (request.CostPrice.HasValue) existingProduct.CostPrice = request.CostPrice.Value;
        if (request.LicenseRequiredFlag.HasValue) existingProduct.LicenseRequiredFlag = request.LicenseRequiredFlag.Value;
        if (request.SeatBasedPricingFlag.HasValue) existingProduct.SeatBasedPricingFlag = request.SeatBasedPricingFlag.Value;
        if (request.WebDisplayFlag.HasValue) existingProduct.WebDisplayFlag = request.WebDisplayFlag.Value;
        if (!string.IsNullOrEmpty(request.AvaTaxCode)) existingProduct.AvaTaxCode = request.AvaTaxCode;
        if (request.CanBeFulfilledFlag.HasValue) existingProduct.CanBeFulfilledFlag = request.CanBeFulfilledFlag.Value;
        if (request.ContractItemFlag.HasValue) existingProduct.ContractItemFlag = request.ContractItemFlag.Value;
        if (!string.IsNullOrEmpty(request.Slug)) existingProduct.Slug = request.Slug;
        if (!string.IsNullOrEmpty(request.LongDescription)) existingProduct.LongDescription = request.LongDescription;
        if (!string.IsNullOrEmpty(request.Status)) existingProduct.Status = request.Status;
        if (request.AvailableFlag.HasValue) existingProduct.AvailableFlag = request.AvailableFlag.Value;

        if (request.Categorization != null) existingProduct.Categorization = request.Categorization;
        if (request.Pricing != null) 
        {
            existingProduct.Pricing = request.Pricing.Select(p => new PricingEntry
            {
                CurrencyCode = p.CurrencyCode,
                UnitPrice = p.UnitPrice,
                OnlinePrice = p.OnlinePrice,
                PriceLevel = p.PriceLevel
            }).ToList();
        }
        if (request.Approvals != null) 
        {
            existingProduct.Approvals = request.Approvals.Select(a => new ApprovalEntry
            {
                ApprovalType = a.ApprovalType,
                Status = a.Status,
                ApprovedBy = a.ApprovedBy,
                ApprovedDate = a.ApprovedDate,
                Comments = a.Comments
            }).ToList();
        }

        existingProduct.UpdatedBy = updatedByUser ?? "system";

        // Validate after updates
        if (!string.IsNullOrEmpty(request.Sku))
        {
            var skuExists = await _repository.ProductExistsBySkuAsync(request.Sku, id);
            if (skuExists)
            {
                throw new InvalidOperationException($"Product with SKU '{request.Sku}' already exists");
            }
        }

        var updatedProduct = await _repository.UpdateProductAsync(existingProduct);
        
        _logger.LogInformation("Successfully updated product: {ProductName} ({ProductId})", 
            updatedProduct.Name, updatedProduct.Id);

        return MapToDto(updatedProduct);
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        _logger.LogInformation("Deleting product: {ProductId}", id);

        var result = await _repository.DeleteProductAsync(id);
        
        if (result)
        {
            _logger.LogInformation("Successfully deleted product: {ProductId}", id);
        }
        else
        {
            _logger.LogWarning("Product not found for deletion: {ProductId}", id);
        }

        return result;
    }

    public async Task<ProductAnalyticsDto> GetProductAnalyticsAsync()
    {
        _logger.LogInformation("Getting product analytics");
        return await _repository.GetProductAnalyticsAsync();
    }

    public async Task<ProductTypesResponse> GetProductTypesAsync()
    {
        _logger.LogInformation("Getting product types");
        var types = await _repository.GetProductTypesAsync();
        return new ProductTypesResponse { Types = types.ToList() };
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidateProductAsync(CreateProductRequest request, Guid? excludeId = null)
    {
        var errors = new List<string>();

        // SKU uniqueness validation
        var skuExists = await _repository.ProductExistsBySkuAsync(request.Sku, excludeId);
        if (skuExists)
        {
            errors.Add($"Product with SKU '{request.Sku}' already exists");
        }

        // Business rule validations
        if (request.BasePrice < 0)
        {
            errors.Add("Base price cannot be negative");
        }

        if (request.CostPrice < 0)
        {
            errors.Add("Cost price cannot be negative");
        }

        if (request.SeatBasedPricingFlag && request.BasePrice <= 0)
        {
            errors.Add("Seat-based pricing products must have a base price greater than zero");
        }

        // Slug validation for web display products
        if (request.WebDisplayFlag && string.IsNullOrWhiteSpace(request.Slug))
        {
            errors.Add("Web display products must have a slug");
        }

        return (errors.Count == 0, errors);
    }

    public async Task<bool> IsProductReadyForActivationAsync(Guid id)
    {
        var product = await _repository.GetProductByIdAsync(id);
        return product?.IsReadyForActivation() ?? false;
    }

    public async Task<IEnumerable<ProductDto>> GetProductsForSynchronizationAsync(string status = "active")
    {
        _logger.LogInformation("Getting products for synchronization with status: {Status}", status);
        
        var products = await _repository.GetProductsByStatusAsync(status);
        return products.Select(MapToDto);
    }

    public async Task<ServiceHealthResult> HealthCheckAsync()
    {
        _logger.LogInformation("Performing Product MDM health check");
        
        try
        {
            var result = new ServiceHealthResult
            {
                Status = "healthy",
                Service = "ProductMdmService",
                Timestamp = DateTime.UtcNow
            };

            // Check database connectivity
            try
            {
                var analytics = await _repository.GetProductAnalyticsAsync();
                
                result.Database = new DatabaseHealthInfo
                {
                    Status = "healthy",
                    Schema = "averis_product",
                    RecordCount = (int)analytics.TotalProducts
                };

                // Gather comprehensive statistics
                result.Stats = new StatisticsInfo
                {
                    ActiveProducts = (int)analytics.ActiveProducts,
                    TotalProducts = (int)analytics.TotalProducts,
                    DraftProducts = 0, // Calculate from database queries if needed
                    PendingProducts = 0, // Calculate from database queries if needed
                    ProductsByType = new Dictionary<string, int>(), // Would need additional query
                    ProductsByStatus = new Dictionary<string, int>() // Would need additional query
                };
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Database health check failed");
                result.Database = new DatabaseHealthInfo
                {
                    Status = "error",
                    Schema = "averis_product",
                    Error = dbEx.Message
                };
                result.Status = "degraded";
            }

            // Check NATS connectivity (Product MDM publishes messages)
            try
            {
                bool isNatsHealthy = false;
                
                // Check if message service is available and healthy
                if (_messageService != null)
                {
                    var isHealthyMethod = _messageService.GetType().GetMethod("IsHealthyAsync");
                    if (isHealthyMethod != null)
                    {
                        var task = isHealthyMethod.Invoke(_messageService, null) as Task<bool>;
                        isNatsHealthy = await (task ?? Task.FromResult(false));
                    }
                }
                
                result.Nats = new NatsHealthInfo
                {
                    Status = isNatsHealthy ? "healthy" : "degraded",
                    ConnectionEstablished = isNatsHealthy,
                    Server = "localhost:4222"
                };
            }
            catch (Exception natsEx)
            {
                _logger.LogWarning(natsEx, "NATS health check failed");
                result.Nats = new NatsHealthInfo
                {
                    Status = "error",
                    ConnectionEstablished = false,
                    Error = natsEx.Message
                };
                
                // NATS issues don't make the service unhealthy, just degraded
                if (result.Status == "healthy")
                {
                    result.Status = "degraded";
                }
            }

            _logger.LogInformation("Product MDM health check completed with status: {Status}", result.Status);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed with exception");
            return new ServiceHealthResult
            {
                Status = "error",
                Service = "ProductMdmService",
                Timestamp = DateTime.UtcNow,
                Error = ex.Message
            };
        }
    }

    private static ProductDto MapToDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            Type = product.Type,
            Categorization = product.Categorization,
            BasePrice = product.BasePrice,
            CostPrice = product.CostPrice,
            LicenseRequiredFlag = product.LicenseRequiredFlag,
            SeatBasedPricingFlag = product.SeatBasedPricingFlag,
            WebDisplayFlag = product.WebDisplayFlag,
            AvaTaxCode = product.AvaTaxCode,
            CanBeFulfilledFlag = product.CanBeFulfilledFlag,
            ContractItemFlag = product.ContractItemFlag,
            Slug = product.Slug,
            LongDescription = product.LongDescription,
            Status = product.Status,
            AvailableFlag = product.AvailableFlag,
            Pricing = SafeGetPricing(product),
            Approvals = SafeGetApprovals(product),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CreatedBy = product.CreatedBy,
            UpdatedBy = product.UpdatedBy
        };
    }

    private static List<PricingEntryDto> SafeGetPricing(Product product)
    {
        try
        {
            return product.Pricing.Select(p => new PricingEntryDto
            {
                CurrencyCode = p.CurrencyCode,
                UnitPrice = p.UnitPrice,
                OnlinePrice = p.OnlinePrice,
                PriceLevel = p.PriceLevel
            }).ToList();
        }
        catch
        {
            return new List<PricingEntryDto>();
        }
    }

    private static List<ApprovalEntryDto> SafeGetApprovals(Product product)
    {
        try
        {
            return product.Approvals.Select(a => new ApprovalEntryDto
            {
                ApprovalType = a.ApprovalType,
                Status = a.Status,
                ApprovedBy = a.ApprovedBy,
                ApprovedDate = a.ApprovedDate,
                Comments = a.Comments
            }).ToList();
        }
        catch
        {
            return new List<ApprovalEntryDto>();
        }
    }
}