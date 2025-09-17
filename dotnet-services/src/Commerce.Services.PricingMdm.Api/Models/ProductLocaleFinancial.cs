using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Product locale-specific financial data
/// </summary>
public class ProductLocaleFinancial
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid LocaleId { get; set; }
    public Guid CatalogId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? BaseCost { get; set; }
    public decimal? CurrencyConversionRate { get; set; } = 1.0m;
    public DateTime? ConversionDate { get; set; } = DateTime.UtcNow;
    public decimal? LocalPrice { get; set; }
    public decimal? LocalCost { get; set; }
    public decimal? TaxRate { get; set; } = 0.0m;
    public decimal? TaxAmount { get; set; } = 0.0m;
    public decimal? TaxIncludedPrice { get; set; }
    public decimal? RegulatoryFees { get; set; } = 0.0m;
    public decimal? EnvironmentalFees { get; set; } = 0.0m;
    public JsonDocument? PriceRoundingRules { get; set; }
    public JsonDocument? DisplayFormat { get; set; }
    public decimal? PromotionalPrice { get; set; }
    public DateTime? PromotionStartDate { get; set; }
    public DateTime? PromotionEndDate { get; set; }
    public DateTime? EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }
    public bool? IsActive { get; set; } = true;
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Locale Locale { get; set; } = null!;
    public virtual Catalog Catalog { get; set; } = null!;
}