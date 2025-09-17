using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Country Entity - Represents countries in the Region → Country → Locale hierarchy
/// Maps to the averis_pricing.countries table in PostgreSQL
/// </summary>
[Table("countries", Schema = "averis_pricing")]
public class Country
{
    /// <summary>
    /// Unique identifier for the country
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ISO 3166-1 alpha-2 country code (US, CA, FR, etc.)
    /// </summary>
    [Required]
    [MaxLength(2)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Country name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Country name in native language
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("native_name")]
    public string NativeName { get; set; } = string.Empty;

    /// <summary>
    /// Foreign key to the region this country belongs to
    /// </summary>
    [Column("region_id")]
    public Guid RegionId { get; set; }

    /// <summary>
    /// Navigation property to the region
    /// </summary>
    public virtual Region Region { get; set; } = null!;

    /// <summary>
    /// Foreign key to the default locale for this country
    /// </summary>
    [Column("default_locale_id")]
    public Guid? DefaultLocaleId { get; set; }

    /// <summary>
    /// Navigation property to the default locale
    /// </summary>
    public virtual Locale? DefaultLocale { get; set; }

    /// <summary>
    /// Indicates if this country is active for commerce
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Continent for broader geographic grouping
    /// </summary>
    [MaxLength(20)]
    [Column("continent")]
    public string? Continent { get; set; }

    /// <summary>
    /// International phone prefix (+1, +33, +49, etc.)
    /// </summary>
    [MaxLength(10)]
    [Column("phone_prefix")]
    public string? PhonePrefix { get; set; }

    /// <summary>
    /// Indicates if shipping to this country is supported
    /// </summary>
    [Column("supports_shipping")]
    public bool SupportsShipping { get; set; } = true;

    /// <summary>
    /// Indicates if billing from this country is supported
    /// </summary>
    [Column("supports_billing")]
    public bool SupportsBilling { get; set; } = true;

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created the record
    /// </summary>
    [MaxLength(255)]
    [Column("created_by")]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the record
    /// </summary>
    [MaxLength(255)]
    [Column("updated_by")]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Navigation property to locales in this country
    /// </summary>
    public virtual ICollection<Locale> Locales { get; set; } = new List<Locale>();

    /// <summary>
    /// Navigation property to compliance information
    /// </summary>
    public virtual CountryCompliance? ComplianceProfile { get; set; }
}

/// <summary>
/// Country Compliance Entity - Represents compliance and trade restrictions for countries
/// Maps to the averis_pricing.country_compliance table in PostgreSQL
/// </summary>
[Table("country_compliance", Schema = "averis_pricing")]
public class CountryCompliance
{
    /// <summary>
    /// Unique identifier for the compliance record
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign key to the country this compliance profile applies to
    /// </summary>
    [Required]
    [MaxLength(2)]
    [Column("country_code")]
    public string CountryCode { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to the country
    /// </summary>
    public virtual Country Country { get; set; } = null!;

    /// <summary>
    /// Indicates if this country has active trade sanctions
    /// </summary>
    [Column("has_trade_sanctions")]
    public bool HasTradeSanctions { get; set; } = false;

    /// <summary>
    /// Indicates if exports to this country have restrictions
    /// </summary>
    [Column("has_export_restrictions")]
    public bool HasExportRestrictions { get; set; } = false;

    /// <summary>
    /// Indicates if export licenses are required
    /// </summary>
    [Column("requires_export_license")]
    public bool RequiresExportLicense { get; set; } = false;

    /// <summary>
    /// Indicates if denied party screening is required
    /// </summary>
    [Column("requires_denied_party_screening")]
    public bool RequiresDeniedPartyScreening { get; set; } = true;

    /// <summary>
    /// Minimum order value that triggers compliance screening
    /// </summary>
    [Column("screening_threshold_amount")]
    [Precision(15, 4)]
    public decimal? ScreeningThresholdAmount { get; set; }

    /// <summary>
    /// Product categories that are restricted for this country
    /// </summary>
    [Column("restricted_categories", TypeName = "text[]")]
    public List<string> RestrictedCategories { get; set; } = new();

    /// <summary>
    /// Overall compliance risk level for this country
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("compliance_risk_level")]
    public ComplianceRiskLevel ComplianceRiskLevel { get; set; } = ComplianceRiskLevel.Medium;

    /// <summary>
    /// Date of last risk assessment
    /// </summary>
    [Column("last_risk_assessment")]
    public DateTime? LastRiskAssessment { get; set; }

    /// <summary>
    /// Additional regulatory notes
    /// </summary>
    [Column("regulatory_notes")]
    public string? RegulatoryNotes { get; set; }

    /// <summary>
    /// Special compliance requirements
    /// </summary>
    [Column("special_requirements")]
    public string? SpecialRequirements { get; set; }

    /// <summary>
    /// Indicates if this compliance profile is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Compliance risk levels for countries
/// </summary>
public enum ComplianceRiskLevel
{
    /// <summary>
    /// Low compliance risk - standard processing
    /// </summary>
    Low,

    /// <summary>
    /// Medium compliance risk - enhanced due diligence
    /// </summary>
    Medium,

    /// <summary>
    /// High compliance risk - comprehensive screening required
    /// </summary>
    High
}

/// <summary>
/// IP Range Entity for country detection
/// Maps to the averis_pricing.ip_country_ranges table in PostgreSQL
/// </summary>
[Table("ip_country_ranges", Schema = "averis_pricing")]
public class IpCountryRange
{
    /// <summary>
    /// Unique identifier for the IP range
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Country code this IP range belongs to
    /// </summary>
    [Required]
    [MaxLength(2)]
    [Column("country_code")]
    public string CountryCode { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to the country
    /// </summary>
    public virtual Country Country { get; set; } = null!;

    /// <summary>
    /// Start of IP address range
    /// </summary>
    [Required]
    [Column("ip_start")]
    public string IpStart { get; set; } = string.Empty;

    /// <summary>
    /// End of IP address range
    /// </summary>
    [Required]
    [Column("ip_end")]
    public string IpEnd { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if this IP range is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Data source provider (MaxMind, IP2Location, etc.)
    /// </summary>
    [MaxLength(50)]
    [Column("provider")]
    public string? Provider { get; set; }

    /// <summary>
    /// When this range was last updated
    /// </summary>
    [Column("last_updated")]
    public DateTime? LastUpdated { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User Locale Preferences Entity with compliance context
/// Maps to the averis_pricing.user_locale_preferences table in PostgreSQL
/// </summary>
[Table("user_locale_preferences", Schema = "averis_pricing")]
public class UserLocalePreference
{
    /// <summary>
    /// Unique identifier for the preference record
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// External user ID
    /// </summary>
    [Required]
    [MaxLength(255)]
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Session ID for anonymous users
    /// </summary>
    [MaxLength(255)]
    [Column("session_id")]
    public string? SessionId { get; set; }

    /// <summary>
    /// Auto-detected country based on IP
    /// </summary>
    [Column("detected_country_id")]
    public Guid? DetectedCountryId { get; set; }

    /// <summary>
    /// Navigation property to detected country
    /// </summary>
    public virtual Country? DetectedCountry { get; set; }

    /// <summary>
    /// IP address used for detection
    /// </summary>
    [Column("detected_ip_address")]
    public string? DetectedIpAddress { get; set; }

    /// <summary>
    /// User's chosen country (if different from detected)
    /// </summary>
    [Column("chosen_country_id")]
    public Guid? ChosenCountryId { get; set; }

    /// <summary>
    /// Navigation property to chosen country
    /// </summary>
    public virtual Country? ChosenCountry { get; set; }

    /// <summary>
    /// User's chosen locale
    /// </summary>
    [Column("chosen_locale_id")]
    public Guid? ChosenLocaleId { get; set; }

    /// <summary>
    /// Navigation property to chosen locale
    /// </summary>
    public virtual Locale? ChosenLocale { get; set; }

    /// <summary>
    /// Indicates if user manually overrode country detection
    /// </summary>
    [Column("country_overridden")]
    public bool CountryOverridden { get; set; } = false;

    /// <summary>
    /// Indicates if user manually overrode locale selection
    /// </summary>
    [Column("locale_overridden")]
    public bool LocaleOverridden { get; set; } = false;

    /// <summary>
    /// Country where user is making purchases
    /// </summary>
    [Column("shopping_country_id")]
    public Guid? ShoppingCountryId { get; set; }

    /// <summary>
    /// Navigation property to shopping country
    /// </summary>
    public virtual Country? ShoppingCountry { get; set; }

    /// <summary>
    /// Country where items will be shipped
    /// </summary>
    [Column("shipping_country_id")]
    public Guid? ShippingCountryId { get; set; }

    /// <summary>
    /// Navigation property to shipping country
    /// </summary>
    public virtual Country? ShippingCountry { get; set; }

    /// <summary>
    /// Country for billing address
    /// </summary>
    [Column("billing_country_id")]
    public Guid? BillingCountryId { get; set; }

    /// <summary>
    /// Navigation property to billing country
    /// </summary>
    public virtual Country? BillingCountry { get; set; }

    /// <summary>
    /// Indicates if compliance screening is required
    /// </summary>
    [Column("compliance_screening_required")]
    public bool ComplianceScreeningRequired { get; set; } = false;

    /// <summary>
    /// Reference to last compliance screening
    /// </summary>
    [Column("last_screening_id")]
    public Guid? LastScreeningId { get; set; }

    /// <summary>
    /// Current compliance status
    /// </summary>
    [MaxLength(20)]
    [Column("compliance_status")]
    public string ComplianceStatus { get; set; } = "UNKNOWN";

    /// <summary>
    /// Browser user agent
    /// </summary>
    [Column("user_agent")]
    public string? UserAgent { get; set; }

    /// <summary>
    /// HTTP referrer
    /// </summary>
    [Column("referrer")]
    public string? Referrer { get; set; }

    /// <summary>
    /// Indicates if this preference is active
    /// </summary>
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this preference expires
    /// </summary>
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}