using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Services;

/// <summary>
/// Service interface for locale-aware catalog assignment and content localization
/// </summary>
public interface ILocaleService
{
    /// <summary>
    /// Initialize a new session with automatic catalog and locale assignment
    /// </summary>
    Task<SessionContext> InitializeSessionAsync(SessionInitializationRequest request);

    /// <summary>
    /// Get default catalog assignment for a user based on geography and profile
    /// </summary>
    Task<CatalogAssignmentResponse> GetDefaultCatalogAsync(CatalogAssignmentRequest request);

    /// <summary>
    /// Get localized product content for a specific locale
    /// </summary>
    Task<EcommerceProductDto.LocalizedContent?> GetLocalizedProductContentAsync(Guid productId, string localeCode);

    /// <summary>
    /// Get locale-specific pricing for a product
    /// </summary>
    Task<EcommerceProductDto.PricingInfo?> GetLocalePricingAsync(Guid productId, string localeCode, Guid catalogId);

    /// <summary>
    /// Get available locales for a region
    /// </summary>
    Task<List<AssignedLocale>> GetAvailableLocalesAsync(string regionCode);

    /// <summary>
    /// Update session catalog and locale preferences
    /// </summary>
    Task<SessionContext> UpdateSessionPreferencesAsync(Guid sessionId, string? catalogCode = null, string? localeCode = null);

    /// <summary>
    /// Detect country from IP address (integration with geolocation service)
    /// </summary>
    Task<string?> DetectCountryFromIpAsync(string ipAddress);

    /// <summary>
    /// Parse Accept-Language header to determine preferred locale
    /// </summary>
    string ParsePreferredLocale(string? acceptLanguageHeader, string? detectedCountryCode = null);
}