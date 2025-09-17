namespace Commerce.Services.Ecommerce.Api.Models;

/// <summary>
/// Models for locale-aware catalog assignment and content filtering
/// </summary>

public class CatalogAssignmentRequest
{
    public string? CountryCode { get; set; }
    public string? IpAddress { get; set; }
    public string? AcceptLanguage { get; set; }
    public string UserType { get; set; } = "anonymous"; // anonymous, authenticated, business
    public string[]? UserRoles { get; set; }
    public string? CustomerTier { get; set; } // bronze, silver, gold, platinum
}

public class CatalogAssignmentResponse
{
    public AssignedCatalog Catalog { get; set; } = new();
    public AssignedLocale Locale { get; set; } = new();
    public string AssignmentMethod { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
}

public class AssignedCatalog
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string RegionCode { get; set; } = string.Empty;
    public string MarketSegment { get; set; } = string.Empty;
}

public class AssignedLocale
{
    public string Code { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string NativeName { get; set; } = string.Empty;
    public CurrencyInfo Currency { get; set; } = new();
    public LocaleFormatting Formatting { get; set; } = new();
}

public class CurrencyInfo
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public int DecimalPlaces { get; set; } = 2;
}

public class LocaleFormatting
{
    public bool IsRtl { get; set; }
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public Dictionary<string, object> NumberFormat { get; set; } = new();
}

public class LocaleProductRequest
{
    public Guid ProductId { get; set; }
    public string LocaleCode { get; set; } = string.Empty;
    public Guid? CatalogId { get; set; }
    public bool IncludeTranslations { get; set; } = true;
    public bool IncludeLocalePricing { get; set; } = true;
}

public class SessionInitializationRequest
{
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? AcceptLanguage { get; set; }
    public string? CountryCode { get; set; }
    public string? PreferredLocale { get; set; }
    public Guid? UserId { get; set; }
    public string[]? UserRoles { get; set; }
}

public class SessionContext
{
    public Guid SessionId { get; set; }
    public AssignedCatalog AssignedCatalog { get; set; } = new();
    public AssignedLocale Locale { get; set; } = new();
    public string AssignmentMethod { get; set; } = string.Empty;
    public Dictionary<string, object>? Preferences { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}