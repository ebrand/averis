using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Commerce.Services.Shared.Models.Entities;

/// <summary>
/// Customer entity representing customers in the averis_customer schema
/// Supports graduated disclosure levels: Cold (visitor) -> Warm (registered) -> Hot (authenticated)
/// Matches the actual database schema in averis_customer.customers table
/// </summary>
public class Customer
{
    /// <summary>
    /// Unique identifier for the customer (UUID)
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Stytch user ID for authentication correlation
    /// </summary>
    [StringLength(255)]
    public string? StytchUserId { get; set; }
    
    /// <summary>
    /// Customer number (business identifier)
    /// </summary>
    [StringLength(50)]
    public string? CustomerNumber { get; set; }
    
    /// <summary>
    /// Customer's first name
    /// </summary>
    [StringLength(100)]
    public string? FirstName { get; set; }
    
    /// <summary>
    /// Customer's last name  
    /// </summary>
    [StringLength(100)]
    public string? LastName { get; set; }
    
    /// <summary>
    /// Customer's email address
    /// </summary>
    [StringLength(255)]
    public string? Email { get; set; }
    
    /// <summary>
    /// Customer's phone number
    /// </summary>
    [StringLength(50)]
    public string? Phone { get; set; }
    
    /// <summary>
    /// Company name if applicable
    /// </summary>
    [StringLength(200)]
    public string? CompanyName { get; set; }
    
    /// <summary>
    /// Customer disclosure level: cold, warm, hot
    /// </summary>
    [StringLength(20)]
    public string? DisclosureLevel { get; set; } = "cold";
    
    /// <summary>
    /// Customer data stored as JSONB
    /// </summary>
    public JsonDocument? CustomerData { get; set; } = JsonDocument.Parse("{}");
    
    /// <summary>
    /// Customer preferences stored as JSONB
    /// </summary>
    public JsonDocument? Preferences { get; set; } = JsonDocument.Parse("{}");
    
    /// <summary>
    /// Customer status: active, inactive, suspended
    /// </summary>
    [StringLength(50)]
    public string? Status { get; set; } = "active";
    
    /// <summary>
    /// When the customer record was created
    /// </summary>
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When the customer record was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Computed properties for UI compatibility
    
    /// <summary>
    /// Display name for the customer
    /// </summary>
    [NotMapped]
    public string DisplayName => 
        !string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName) 
            ? $"{FirstName} {LastName}" 
            : Email ?? "Anonymous Customer";
    
    /// <summary>
    /// Whether the customer is active
    /// </summary>
    [NotMapped]
    public bool IsActive => Status?.Equals("active", StringComparison.OrdinalIgnoreCase) ?? false;
    
    /// <summary>
    /// Customer segment - derived from customer data JSONB
    /// </summary>
    [NotMapped]
    public string? CustomerSegment 
    {
        get
        {
            try
            {
                if (CustomerData != null && CustomerData.RootElement.TryGetProperty("customerSegment", out var segment))
                {
                    return segment.GetString();
                }
            }
            catch { }
            return null;
        }
    }
    
    /// <summary>
    /// Lifetime value - derived from customer data JSONB
    /// </summary>
    [NotMapped]
    public decimal LifetimeValue 
    {
        get
        {
            try
            {
                if (CustomerData != null && CustomerData.RootElement.TryGetProperty("lifetimeValue", out var ltv))
                {
                    return ltv.GetDecimal();
                }
            }
            catch { }
            return 0.00m;
        }
    }
    
    /// <summary>
    /// Email verified status - derived from customer data JSONB
    /// </summary>
    [NotMapped]
    public bool EmailVerified 
    {
        get
        {
            try
            {
                if (CustomerData != null && CustomerData.RootElement.TryGetProperty("emailVerified", out var verified))
                {
                    return verified.GetBoolean();
                }
            }
            catch { }
            return false;
        }
    }
    
    /// <summary>
    /// Last activity - derived from customer data JSONB
    /// </summary>
    [NotMapped]
    public DateTime? LastActivity 
    {
        get
        {
            try
            {
                if (CustomerData != null && CustomerData.RootElement.TryGetProperty("lastActivity", out var activity))
                {
                    return DateTime.Parse(activity.GetString() ?? "");
                }
            }
            catch { }
            return null;
        }
    }
    
    /// <summary>
    /// Whether this is a high-value customer
    /// </summary>
    [NotMapped]
    public bool IsHighValue => LifetimeValue >= 10000.00m;
    
    /// <summary>
    /// Customer's disclosure level as enum-like property
    /// </summary>
    [NotMapped]
    public bool IsColdCustomer => DisclosureLevel?.Equals("cold", StringComparison.OrdinalIgnoreCase) ?? true;
    
    [NotMapped]
    public bool IsWarmCustomer => DisclosureLevel?.Equals("warm", StringComparison.OrdinalIgnoreCase) ?? false;
    
    [NotMapped] 
    public bool IsHotCustomer => DisclosureLevel?.Equals("hot", StringComparison.OrdinalIgnoreCase) ?? false;
}