using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Commerce.Services.Shared.Models.DTOs;

/// <summary>
/// User DTO for API responses
/// </summary>
public class UserDto
{
    public int Id { get; set; }
    public string? StytchUserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public string Status { get; set; } = "active";
    public DateTime? LastLogin { get; set; }
    public string PreferencesJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Computed properties
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsAdmin { get; set; }
    public IEnumerable<string> ProductMdmRoles { get; set; } = new List<string>();
    public bool CanApproveProducts { get; set; }
    public bool CanLaunchProducts { get; set; }
}

/// <summary>
/// DTO for creating a new user
/// </summary>
public class CreateUserRequest
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Stytch user ID cannot exceed 255 characters")]
    public string? StytchUserId { get; set; }

    [Required(ErrorMessage = "At least one role is required")]
    [MinLength(1, ErrorMessage = "At least one role is required")]
    public List<string> Roles { get; set; } = new() { "user" };

    [Required(ErrorMessage = "Status is required")]
    [RegularExpression("^(active|inactive|pending|suspended)$", 
        ErrorMessage = "Status must be one of: active, inactive, pending, suspended")]
    public string Status { get; set; } = "active";

    public string PreferencesJson { get; set; } = "{}";
}

/// <summary>
/// DTO for updating an existing user
/// </summary>
public class UpdateUserRequest
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Stytch user ID cannot exceed 255 characters")]
    public string? StytchUserId { get; set; }

    [Required(ErrorMessage = "At least one role is required")]
    [MinLength(1, ErrorMessage = "At least one role is required")]
    public List<string> Roles { get; set; } = new();

    [Required(ErrorMessage = "Status is required")]
    [RegularExpression("^(active|inactive|pending|suspended)$", 
        ErrorMessage = "Status must be one of: active, inactive, pending, suspended")]
    public string Status { get; set; } = string.Empty;

    public string PreferencesJson { get; set; } = "{}";
}

/// <summary>
/// DTO for paginated user responses
/// </summary>
public class PagedUserResponse
{
    public IEnumerable<UserDto> Users { get; set; } = new List<UserDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

/// <summary>
/// DTO for user analytics/summary information
/// </summary>
public class UserAnalyticsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int PendingUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public Dictionary<string, int> UsersByRole { get; set; } = new();
    public Dictionary<string, int> UsersByStatus { get; set; } = new();
    public DateTime? LastUserCreated { get; set; }
    public DateTime? LastUserLogin { get; set; }
    public int UsersWithRecentActivity { get; set; } // Active within last 30 days
}

/// <summary>
/// DTO for updating user's last login
/// </summary>
public class UpdateLastLoginRequest
{
    [Required]
    public DateTime LastLogin { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// DTO for user role information
/// </summary>
public class UserRoleDto
{
    public string Role { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g., "Product MDM", "Administrative"
    public bool IsApprovalRole { get; set; }
}

/// <summary>
/// DTO for available roles response
/// </summary>
public class AvailableRolesResponse
{
    public IEnumerable<UserRoleDto> Roles { get; set; } = new List<UserRoleDto>();
    public Dictionary<string, IEnumerable<UserRoleDto>> RolesByCategory { get; set; } = new();
}

/// <summary>
/// Common user validation attributes
/// </summary>
public static class UserValidationRules
{
    public static readonly string[] ValidStatuses = { "active", "inactive", "pending", "suspended" };
    
    public static readonly string[] ProductMdmRoles = {
        "product_mdm", // General Product MDM access role
        "product_marketing", "product_marketing_approve",
        "product_legal", "product_legal_approve", 
        "product_finance", "product_finance_approve",
        "product_salesops", "product_salesops_approve",
        "product_contracts", "product_contracts_approve",
        "product_launch", "product_admin", "product_view"
    };

    public static readonly string[] AdministrativeRoles = {
        "admin", "user_admin", "system_monitor"
    };

    public static readonly string[] AllValidRoles = ProductMdmRoles.Concat(AdministrativeRoles).Concat(new[] { "user" }).ToArray();
}