using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.Shared.Models.DTOs;

/// <summary>
/// Product Data Transfer Object for API responses
/// Contains all product fields in a clean, consumable format
/// </summary>
public class ProductDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string> Categorization { get; set; } = new();
    public decimal BasePrice { get; set; }
    public decimal CostPrice { get; set; }
    public bool LicenseRequiredFlag { get; set; }
    public bool SeatBasedPricingFlag { get; set; }
    public bool WebDisplayFlag { get; set; }
    public string? AvaTaxCode { get; set; }
    public bool CanBeFulfilledFlag { get; set; }
    public bool ContractItemFlag { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? LongDescription { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool AvailableFlag { get; set; }
    public List<PricingEntryDto> Pricing { get; set; } = new();
    public List<ApprovalEntryDto> Approvals { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}

/// <summary>
/// Product creation request DTO with validation attributes
/// </summary>
public class CreateProductRequest
{
    [Required(ErrorMessage = "SKU is required")]
    [StringLength(100, ErrorMessage = "SKU cannot exceed 100 characters")]
    [RegularExpression(@"^[A-Z0-9\-_]+$", ErrorMessage = "SKU can only contain letters, numbers, hyphens, and underscores")]
    public string Sku { get; set; } = string.Empty;

    [Required(ErrorMessage = "Name is required")]
    [StringLength(500, ErrorMessage = "Name cannot exceed 500 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string Description { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Type cannot exceed 100 characters")]
    public string Type { get; set; } = string.Empty;

    public List<string> Categorization { get; set; } = new();

    [Range(0, double.MaxValue, ErrorMessage = "Base price cannot be negative")]
    public decimal BasePrice { get; set; } = 0m;

    [Range(0, double.MaxValue, ErrorMessage = "Cost price cannot be negative")]
    public decimal CostPrice { get; set; } = 0m;

    public bool LicenseRequiredFlag { get; set; } = false;
    public bool SeatBasedPricingFlag { get; set; } = false;
    public bool WebDisplayFlag { get; set; } = false;

    [StringLength(50, ErrorMessage = "AvaTax Code cannot exceed 50 characters")]
    public string? AvaTaxCode { get; set; }

    public bool CanBeFulfilledFlag { get; set; } = false;
    public bool ContractItemFlag { get; set; } = false;

    [StringLength(200, ErrorMessage = "Slug cannot exceed 200 characters")]
    public string Slug { get; set; } = string.Empty;

    public string? LongDescription { get; set; }

    [RegularExpression(@"^(draft|active|deprecated|archived)$", ErrorMessage = "Status must be one of: draft, active, deprecated, archived")]
    public string Status { get; set; } = "draft";

    public bool AvailableFlag { get; set; } = true;
    public List<PricingEntryDto> Pricing { get; set; } = new();
    public List<ApprovalEntryDto> Approvals { get; set; } = new();
}

/// <summary>
/// Product update request DTO - allows partial updates
/// </summary>
public class UpdateProductRequest
{
    [StringLength(100, ErrorMessage = "SKU cannot exceed 100 characters")]
    [RegularExpression(@"^[A-Z0-9\-_]+$", ErrorMessage = "SKU can only contain letters, numbers, hyphens, and underscores")]
    public string? Sku { get; set; }

    [StringLength(500, ErrorMessage = "Name cannot exceed 500 characters")]
    public string? Name { get; set; }

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    [StringLength(100, ErrorMessage = "Type cannot exceed 100 characters")]
    public string? Type { get; set; }

    public List<string>? Categorization { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Base price cannot be negative")]
    public decimal? BasePrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Cost price cannot be negative")]
    public decimal? CostPrice { get; set; }

    public bool? LicenseRequiredFlag { get; set; }
    public bool? SeatBasedPricingFlag { get; set; }
    public bool? WebDisplayFlag { get; set; }

    [StringLength(50, ErrorMessage = "AvaTax Code cannot exceed 50 characters")]
    public string? AvaTaxCode { get; set; }

    public bool? CanBeFulfilledFlag { get; set; }
    public bool? ContractItemFlag { get; set; }

    [StringLength(200, ErrorMessage = "Slug cannot exceed 200 characters")]
    public string? Slug { get; set; }

    public string? LongDescription { get; set; }

    [RegularExpression(@"^(draft|active|deprecated|archived)$", ErrorMessage = "Status must be one of: draft, active, deprecated, archived")]
    public string? Status { get; set; }

    public bool? AvailableFlag { get; set; }
    public List<PricingEntryDto>? Pricing { get; set; }
    public List<ApprovalEntryDto>? Approvals { get; set; }
}

/// <summary>
/// Pricing entry DTO for multi-currency support
/// </summary>
public class PricingEntryDto
{
    [Required]
    public string CurrencyCode { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; } = 0m;
    
    [Range(0, double.MaxValue)]
    public decimal OnlinePrice { get; set; } = 0m;
    
    public string PriceLevel { get; set; } = string.Empty;
}

/// <summary>
/// Approval entry DTO for workflow management
/// </summary>
public class ApprovalEntryDto
{
    public string ApprovalType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime? ApprovedDate { get; set; }
    public string Comments { get; set; } = string.Empty;
}

/// <summary>
/// Paginated list response for product queries
/// </summary>
public class PagedProductResponse
{
    public List<ProductDto> Products { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
    public string Source { get; set; } = "api";
}

/// <summary>
/// Pagination information for list responses
/// </summary>
public class PaginationInfo
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

/// <summary>
/// Product analytics summary DTO
/// </summary>
public class ProductAnalyticsDto
{
    public long TotalProducts { get; set; }
    public long ActiveProducts { get; set; }
    public long AvailableProducts { get; set; }
    public long WebDisplayProducts { get; set; }
    public long LicensedProducts { get; set; }
    public long ContractProducts { get; set; }
    public long ProductTypes { get; set; }
    public decimal AverageBasePrice { get; set; }
    public decimal TotalActiveValue { get; set; }
    public string Source { get; set; } = "api";
}

/// <summary>
/// Product types list response
/// </summary>
public class ProductTypesResponse
{
    public List<string> Types { get; set; } = new();
    public string Source { get; set; } = "api";
}

/// <summary>
/// Product cache synchronization status
/// </summary>
public class CacheSyncStatusDto
{
    public int TotalCachedProducts { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public DateTime? OldestProductSyncAt { get; set; }
    public DateTime? NewestProductSyncAt { get; set; }
    public bool IsHealthy { get; set; }
    public List<string> Issues { get; set; } = new();
    public string Source { get; set; } = "product-cache-api";
}