using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Models;

/// <summary>
/// Locale Entity - Represents international locales for multi-regional commerce
/// Maps to the averis_pricing.locales table in PostgreSQL
/// </summary>
[Table("locales", Schema = "averis_pricing")]
public class Locale
{
    /// <summary>
    /// Unique identifier for the locale
    /// </summary>
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Locale code (e.g., en_US, fr_FR, de_DE)
    /// </summary>
    [Required]
    [MaxLength(10)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Language code (ISO 639-1)
    /// </summary>
    [Required]
    [MaxLength(2)]
    [Column("language_code")]
    public string LanguageCode { get; set; } = string.Empty;

    /// <summary>
    /// Country code (ISO 3166-1 alpha-2)
    /// </summary>
    [Required]
    [MaxLength(2)]
    [Column("country_code")]
    public string CountryCode { get; set; } = string.Empty;

    /// <summary>
    /// Foreign key to the region this locale belongs to
    /// </summary>
    [Column("region_id")]
    public Guid RegionId { get; set; }

    /// <summary>
    /// Navigation property to the region
    /// </summary>
    public virtual Region Region { get; set; } = null!;

    /// <summary>
    /// Foreign key to the country this locale belongs to
    /// </summary>
    [Column("country_id")]
    public Guid? CountryId { get; set; }

    /// <summary>
    /// Navigation property to the country
    /// </summary>
    public virtual Country? Country { get; set; }

    /// <summary>
    /// Priority within the country (1 = default/primary locale)
    /// </summary>
    [Column("priority_in_country")]
    public int PriorityInCountry { get; set; } = 100;

    /// <summary>
    /// Foreign key to the default currency for this locale
    /// </summary>
    [Column("currency_id")]
    public Guid CurrencyId { get; set; }

    /// <summary>
    /// Navigation property to the currency
    /// </summary>
    public virtual Currency Currency { get; set; } = null!;

    /// <summary>
    /// Display name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Native name in the locale's language
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("native_name")]
    public string NativeName { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if this is a right-to-left language
    /// </summary>
    [Column("is_rtl")]
    public bool IsRtl { get; set; } = false;

    /// <summary>
    /// Date format pattern for this locale
    /// </summary>
    [Required]
    [MaxLength(20)]
    [Column("date_format")]
    public string DateFormat { get; set; } = string.Empty;

    /// <summary>
    /// Number formatting rules as JSON
    /// </summary>
    [Column("number_format", TypeName = "jsonb")]
    public string NumberFormat { get; set; } = "{}";

    /// <summary>
    /// Indicates if this locale is active
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
    /// Parses the number format JSON into a dictionary for easy access
    /// </summary>
    public Dictionary<string, object> GetNumberFormatSettings()
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(NumberFormat) ?? new Dictionary<string, object>();
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// Sets the number format from a dictionary
    /// </summary>
    public void SetNumberFormatSettings(Dictionary<string, object> settings)
    {
        NumberFormat = JsonSerializer.Serialize(settings);
    }
}