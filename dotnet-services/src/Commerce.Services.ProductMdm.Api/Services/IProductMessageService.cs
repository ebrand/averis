using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.ProductMdm.Api.Services;

/// <summary>
/// Service interface for publishing product-related messages to RabbitMQ
/// </summary>
public interface IProductMessageService
{
    /// <summary>
    /// Publish a message when a product is created
    /// </summary>
    /// <param name="product">The product that was created</param>
    Task PublishProductCreatedAsync(ProductDto product);

    /// <summary>
    /// Publish a message when a product is updated
    /// </summary>
    /// <param name="product">The product that was updated</param>
    /// <param name="existingProduct">The product before the update</param>
    Task PublishProductUpdatedAsync(ProductDto product, ProductDto existingProduct);

    /// <summary>
    /// Publish a message when a product is deleted
    /// </summary>
    /// <param name="product">The product that was deleted</param>
    Task PublishProductDeletedAsync(ProductDto product);

    /// <summary>
    /// Publish a message when a product becomes active (launched)
    /// </summary>
    /// <param name="product">The product that became active</param>
    Task PublishProductLaunchedAsync(ProductDto product);

    /// <summary>
    /// Publish a message when a product is deactivated
    /// </summary>
    /// <param name="product">The product that was deactivated</param>
    Task PublishProductDeactivatedAsync(ProductDto product);

    /// <summary>
    /// Health check for the messaging service
    /// </summary>
    Task<bool> IsHealthyAsync();

    /// <summary>
    /// Dispose resources
    /// </summary>
    void Dispose();
}