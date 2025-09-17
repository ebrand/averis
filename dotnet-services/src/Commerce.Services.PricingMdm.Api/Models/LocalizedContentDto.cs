namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// DTO for localized content and pricing information
/// </summary>
public class LocalizedContentDto
{
    public Guid LocaleId { get; set; }
    public string LocaleCode { get; set; } = string.Empty;
    public string LocaleName { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    
    // Content data
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? MarketingCopy { get; set; }
    public string? Features { get; set; }
    public string? Benefits { get; set; }
    public string TranslationStatus { get; set; } = "pending";
    public DateTime? ApprovedAt { get; set; }
    
    // Financial data
    public decimal? LocalPrice { get; set; }
    public decimal? TaxIncludedPrice { get; set; }
    public decimal? TaxRate { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? RegulatoryFees { get; set; }
    public decimal? CurrencyConversionRate { get; set; }
    public DateTime? ConversionDate { get; set; }
    public bool IsActive { get; set; }
}
