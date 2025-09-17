using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service for communicating with the Product Staging API
/// </summary>
public interface IProductStagingApiService
{
    Task<ProductDetailsDto?> GetProductAsync(Guid productId);
    Task<List<ProductDetailsDto>> GetProductsAsync(List<Guid> productIds);
}

/// <summary>
/// Product details from Product Staging API
/// </summary>
public class ProductDetailsDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}