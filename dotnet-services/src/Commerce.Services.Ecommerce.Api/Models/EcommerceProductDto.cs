using System.Text.Json;

namespace Commerce.Services.Ecommerce.Api.Models;

/// <summary>
/// Data Transfer Object for Ecommerce Product API responses
/// Includes pricing information merged from Pricing MDM
/// </summary>
public class EcommerceProductDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public string? Slug { get; set; }
    public string? Brand { get; set; }
    
    // Locale-specific content
    public LocalizedContent? Localized { get; set; }
    
    public CategoryInfo? Category { get; set; }
    public string[]? Tags { get; set; }
    public Dictionary<string, object>? Specifications { get; set; }
    public string[]? Features { get; set; }
    
    public ImageInfo Images { get; set; } = new();
    public StockInfo Stock { get; set; } = new();
    public DimensionInfo Dimensions { get; set; } = new();
    public RatingInfo Ratings { get; set; } = new();
    public SeoInfo Seo { get; set; } = new();
    public PricingInfo? Pricing { get; set; }
    
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public class CategoryInfo
    {
        public Guid? Id { get; set; }
        public string? Name { get; set; }
    }

    public class ImageInfo
    {
        public string? Primary { get; set; }
        public string[]? Gallery { get; set; }
    }

    public class StockInfo
    {
        public string Status { get; set; } = "in_stock";
        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; }
        public bool BackorderAllowed { get; set; }
    }

    public class DimensionInfo
    {
        public decimal? Weight { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public string WeightUnit { get; set; } = "kg";
        public string DimensionUnit { get; set; } = "cm";
    }

    public class RatingInfo
    {
        public decimal Average { get; set; }
        public int Count { get; set; }
        public int ReviewCount { get; set; }
    }

    public class SeoInfo
    {
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string[]? SearchKeywords { get; set; }
    }

    public class LocalizedContent
    {
        public string LocaleCode { get; set; } = string.Empty;
        public string? LocalizedName { get; set; }
        public string? LocalizedDescription { get; set; }
        public string? LocalizedShortDescription { get; set; }
        public string? LocalizedMarketingCopy { get; set; }
        public Dictionary<string, object>? LocalizedTechnicalSpecs { get; set; }
        public string[]? LocalizedFeatures { get; set; }
        public string[]? LocalizedBenefits { get; set; }
        public LocalizedSeoInfo? Seo { get; set; }
        public string TranslationStatus { get; set; } = "pending";
    }

    public class LocalizedSeoInfo
    {
        public string? LocalizedMetaTitle { get; set; }
        public string? LocalizedMetaDescription { get; set; }
        public string[]? LocalizedKeywords { get; set; }
    }

    public class PricingInfo
    {
        public decimal BasePrice { get; set; }
        public decimal ListPrice { get; set; }
        public decimal FinalPrice { get; set; }
        public string Currency { get; set; } = "USD";
        public bool HasDiscount { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal DiscountAmount { get; set; }
        public bool Available { get; set; }
        public string FormattedBasePrice { get; set; } = string.Empty;
        public string FormattedFinalPrice { get; set; } = string.Empty;
        public string? Error { get; set; }
        
        // Locale-specific pricing
        public decimal? LocalPrice { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? TaxIncludedPrice { get; set; }
        public string? LocalCurrency { get; set; }
        public string? FormattedLocalPrice { get; set; }
        public string? FormattedTaxIncludedPrice { get; set; }
        public Dictionary<string, object>? DisplayFormat { get; set; }
    }

    /// <summary>
    /// Convert EcommerceProduct entity to DTO
    /// </summary>
    public static EcommerceProductDto FromEntity(EcommerceProduct product)
    {
        var specifications = new Dictionary<string, object>();
        if (!string.IsNullOrEmpty(product.Specifications))
        {
            try
            {
                specifications = JsonSerializer.Deserialize<Dictionary<string, object>>(product.Specifications) 
                                ?? new Dictionary<string, object>();
            }
            catch
            {
                specifications = new Dictionary<string, object>();
            }
        }

        return new EcommerceProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            DisplayName = product.DisplayName,
            ShortDescription = product.ShortDescription,
            LongDescription = product.LongDescription,
            Slug = product.Slug,
            Brand = product.Brand,
            Category = product.Category != null ? new CategoryInfo
            {
                Id = product.Category.Id,
                Name = product.Category.Name
            } : null,
            Tags = product.Tags,
            Specifications = specifications,
            Features = product.Features,
            Images = new ImageInfo
            {
                Primary = product.PrimaryImageUrl,
                Gallery = product.ImageUrls
            },
            Stock = new StockInfo
            {
                Status = product.StockStatus,
                Quantity = product.StockQuantity,
                LowStockThreshold = product.LowStockThreshold,
                BackorderAllowed = product.BackorderAllowed
            },
            Dimensions = new DimensionInfo
            {
                Weight = product.Weight,
                Length = product.Length,
                Width = product.Width,
                Height = product.Height,
                WeightUnit = product.WeightUnit,
                DimensionUnit = product.DimensionUnit
            },
            Ratings = new RatingInfo
            {
                Average = product.RatingAverage,
                Count = product.RatingCount,
                ReviewCount = product.ReviewCount
            },
            Seo = new SeoInfo
            {
                MetaTitle = product.MetaTitle,
                MetaDescription = product.MetaDescription,
                SearchKeywords = product.SearchKeywords
            },
            Status = product.Status,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }
}