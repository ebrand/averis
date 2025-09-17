using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// DTO for Catalog API requests and responses
/// </summary>
public class CatalogDto
{
    public Guid? Id { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid RegionId { get; set; }

    [Required]
    public Guid MarketSegmentId { get; set; }

    [Required]
    public Guid CurrencyId { get; set; }

    public DateTime? EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [Range(1, 100)]
    public int Priority { get; set; } = 1;

    [RegularExpression("^(active|inactive|draft)$")]
    public string Status { get; set; } = "active";

    public bool IsActive { get; set; } = true;

    public bool IsDefault { get; set; } = false;

    public string CreatedBy { get; set; } = string.Empty;

    public string UpdatedBy { get; set; } = string.Empty;

    // Read-only properties for response
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ProductCount { get; set; } = 0;
    public bool IsCurrentlyEffective { get; set; }
}

/// <summary>
/// DTO for creating a new Catalog
/// </summary>
public class CreateCatalogRequest
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid RegionId { get; set; }

    [Required]
    public Guid MarketSegmentId { get; set; }

    [Required]
    public Guid CurrencyId { get; set; }

    public DateTime? EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [Range(1, 100)]
    public int Priority { get; set; } = 1;

    [RegularExpression("^(active|inactive|draft)$")]
    public string Status { get; set; } = "active";

    public bool IsActive { get; set; } = true;

    public bool IsDefault { get; set; } = false;

    [Required]
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// DTO for updating an existing Catalog
/// </summary>
public class UpdateCatalogRequest
{
    [StringLength(255, MinimumLength = 1)]
    public string? Name { get; set; }

    public Guid? RegionId { get; set; }

    public Guid? MarketSegmentId { get; set; }

    public Guid? CurrencyId { get; set; }

    public DateTime? EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [Range(1, 100)]
    public int? Priority { get; set; }

    [RegularExpression("^(active|inactive|draft)$")]
    public string? Status { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsDefault { get; set; }

    [Required]
    public string UpdatedBy { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for paginated catalog results
/// </summary>
public class CatalogPagedResponse
{
    public List<CatalogDto> Catalogs { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}