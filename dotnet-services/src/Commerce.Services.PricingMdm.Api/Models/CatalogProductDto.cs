using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// DTO for CatalogProduct API requests and responses
/// </summary>
public class CatalogProductDto
{
    public Guid? Id { get; set; }

    [Required]
    public Guid CatalogId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    public bool IsActive { get; set; } = true;

    public decimal? OverridePrice { get; set; }
    
    public decimal DiscountPercentage { get; set; } = 0;

    // Read-only properties for response
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CatalogCode { get; set; }
    public string? CatalogName { get; set; }
    public string? ProductName { get; set; }
    public string? ProductDescription { get; set; }
    public string? ProductSku { get; set; }
}

/// <summary>
/// DTO for creating a new CatalogProduct relationship
/// </summary>
public class CreateCatalogProductRequest
{
    [Required]
    public Guid CatalogId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    public bool IsActive { get; set; } = true;
    
    public decimal? OverridePrice { get; set; }
    
    public decimal DiscountPercentage { get; set; } = 0;
}

/// <summary>
/// DTO for updating an existing CatalogProduct relationship
/// </summary>
public class UpdateCatalogProductRequest
{
    public bool? IsActive { get; set; }
    
    public decimal? OverridePrice { get; set; }
    
    public decimal? DiscountPercentage { get; set; }
}

/// <summary>
/// DTO for bulk operations on catalog products
/// </summary>
public class BulkCatalogProductRequest
{
    [Required]
    public Guid CatalogId { get; set; }

    [Required]
    [MinLength(1)]
    public List<Guid> ProductIds { get; set; } = new();

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Response DTO for catalog product operations
/// </summary>
public class CatalogProductResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CatalogProductDto> CatalogProducts { get; set; } = new();
    public int TotalProcessed { get; set; }
    public int SuccessfullyProcessed { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Response DTO for paginated catalog product results
/// </summary>
public class CatalogProductPagedResponse
{
    public List<CatalogProductDto> CatalogProducts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}

/// <summary>
/// DTO for getting products in a specific catalog with filtering
/// </summary>
public class CatalogProductsQuery
{
    public Guid? CatalogId { get; set; }
    public Guid? ProductId { get; set; }
    public bool? IsActive { get; set; } = true;
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "CreatedAt";
    public string SortOrder { get; set; } = "desc";
}

/// <summary>
/// DTO for saving localized content for a product
/// </summary>
public class SaveLocalizedContentRequest
{
    [Required]
    [StringLength(10)]
    public string LocaleCode { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string TranslatedName { get; set; } = string.Empty;

    [StringLength(2000)]
    public string TranslatedDescription { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string CreatedBy { get; set; } = string.Empty;
}