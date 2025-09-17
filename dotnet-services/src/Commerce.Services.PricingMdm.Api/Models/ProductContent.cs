using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Product content model for multi-language support
/// Maps to averis_pricing.product_locale_content table
/// </summary>
[Table("product_locale_content", Schema = "averis_pricing")]
public class ProductContent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid LocaleId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? MarketingCopy { get; set; }
    [Column("technical_specs", TypeName = "jsonb")]
    public JsonDocument? TechnicalSpecs { get; set; }
    public string[]? Features { get; set; }
    public string[]? Benefits { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string[]? Keywords { get; set; }
    public int ContentVersion { get; set; } = 1;
    public string? ReviewedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string TranslationStatus { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Locale Locale { get; set; } = null!;
}