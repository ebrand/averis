using System.Text.Json;

namespace Commerce.Services.Shared.Models.DTOs;

/// <summary>
/// Data Transfer Object for Customer information
/// Used for API communication and data exchange
/// Matches the simplified database schema
/// </summary>
public class CustomerDto
{
    /// <summary>
    /// Unique identifier for the customer
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Customer disclosure level: cold, warm, hot
    /// </summary>
    public string DisclosureLevel { get; set; } = "cold";
    
    /// <summary>
    /// Stytch user ID for authentication correlation
    /// </summary>
    public string? StytchUserId { get; set; }
    
    /// <summary>
    /// Customer number (business identifier)
    /// </summary>
    public string? CustomerNumber { get; set; }
    
    /// <summary>
    /// Customer's first name
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// Customer's last name
    /// </summary>
    public string? LastName { get; set; }
    
    /// <summary>
    /// Customer's email address
    /// </summary>
    public string? Email { get; set; }
    
    /// <summary>
    /// Customer's phone number
    /// </summary>
    public string? Phone { get; set; }
    
    /// <summary>
    /// Company name if applicable
    /// </summary>
    public string? CompanyName { get; set; }
    
    /// <summary>
    /// Customer status
    /// </summary>
    public string Status { get; set; } = "active";
    
    /// <summary>
    /// When the customer record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// When the customer record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
    
    // Computed/derived properties (for UI compatibility)
    
    /// <summary>
    /// Whether the customer's email has been verified (derived from customer data)
    /// </summary>
    public bool EmailVerified { get; set; } = false;
    
    /// <summary>
    /// Customer segment classification (derived from customer data)
    /// </summary>
    public string? CustomerSegment { get; set; }
    
    /// <summary>
    /// Customer's lifetime value (derived from customer data)
    /// </summary>
    public decimal LifetimeValue { get; set; } = 0.00m;
    
    /// <summary>
    /// Last activity timestamp (derived from customer data)
    /// </summary>
    public DateTime? LastActivity { get; set; }
    
    /// <summary>
    /// Display name for the customer
    /// </summary>
    public string DisplayName => 
        !string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName) 
            ? $"{FirstName} {LastName}" 
            : Email ?? "Anonymous Customer";
    
    /// <summary>
    /// Whether the customer is active
    /// </summary>
    public bool IsActive => Status.Equals("active", StringComparison.OrdinalIgnoreCase);
    
    /// <summary>
    /// Whether this is a high-value customer
    /// </summary>
    public bool IsHighValue => LifetimeValue >= 10000.00m;
}