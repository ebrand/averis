using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.Shared.Models.Entities;

/// <summary>
/// User entity representing users in the system with role-based access control
/// Maps to the customer_mdm.users table in PostgreSQL (schema configured in DbContext)
/// </summary>
public class User
{
    /// <summary>
    /// Primary key - auto-incrementing integer ID
    /// </summary>
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>
    /// External authentication provider ID (Stytch/OAuth)
    /// </summary>
    [Column("stytch_user_id")]
    [MaxLength(255)]
    public string? StytchUserId { get; set; }

    /// <summary>
    /// User's first name
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// User's last name
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// User's email address (unique)
    /// </summary>
    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Array of user roles stored as JSONB in PostgreSQL
    /// </summary>
    [Required]
    [Column("roles", TypeName = "jsonb")]
    public List<string> Roles { get; set; } = new() { "user" };

    /// <summary>
    /// User account status
    /// </summary>
    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "active";

    /// <summary>
    /// Last login timestamp
    /// </summary>
    [Column("last_login")]
    public DateTime? LastLogin { get; set; }

    /// <summary>
    /// User preferences stored as JSONB
    /// </summary>
    [Column("preferences", TypeName = "jsonb")]
    public string PreferencesJson { get; set; } = "{}";

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last update timestamp
    /// </summary>
    [Required]
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who created this user record
    /// </summary>
    [MaxLength(100)]
    [Column("created_by")]
    public string? CreatedBy { get; set; }

    /// <summary>
    /// Who last updated this user record
    /// </summary>
    [MaxLength(100)]
    [Column("updated_by")]
    public string? UpdatedBy { get; set; }

    // Computed properties for business logic

    /// <summary>
    /// Full display name
    /// </summary>
    [NotMapped]
    public string DisplayName => $"{FirstName} {LastName}".Trim();

    /// <summary>
    /// Check if user is active
    /// </summary>
    [NotMapped]
    public bool IsActive => Status == "active";

    /// <summary>
    /// Check if user is an administrator
    /// </summary>
    [NotMapped]
    public bool IsAdmin => Roles.Contains("admin");

    /// <summary>
    /// Check if user has a specific role
    /// </summary>
    /// <param name="role">Role to check</param>
    /// <returns>True if user has the role</returns>
    public bool HasRole(string role)
    {
        return Roles.Contains(role, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Check if user has any of the specified roles
    /// </summary>
    /// <param name="roles">Roles to check</param>
    /// <returns>True if user has any of the roles</returns>
    public bool HasAnyRole(params string[] roles)
    {
        return roles.Any(role => HasRole(role));
    }

    /// <summary>
    /// Check if user has all of the specified roles
    /// </summary>
    /// <param name="roles">Roles to check</param>
    /// <returns>True if user has all of the roles</returns>
    public bool HasAllRoles(params string[] roles)
    {
        return roles.All(role => HasRole(role));
    }

    /// <summary>
    /// Get all Product MDM related roles
    /// </summary>
    /// <returns>List of Product MDM roles</returns>
    [NotMapped]
    public IEnumerable<string> ProductMdmRoles => Roles.Where(r => 
        r.StartsWith("product_", StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Check if user can approve product changes in any area
    /// </summary>
    [NotMapped]
    public bool CanApproveProducts => Roles.Any(r => 
        r.EndsWith("_approve", StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Check if user can launch products
    /// </summary>
    [NotMapped]
    public bool CanLaunchProducts => HasAnyRole("product_launch", "admin");

    /// <summary>
    /// Validate user data
    /// </summary>
    /// <returns>List of validation errors</returns>
    public List<string> Validate()
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(FirstName))
            errors.Add("First name is required");

        if (string.IsNullOrWhiteSpace(LastName))
            errors.Add("Last name is required");

        if (string.IsNullOrWhiteSpace(Email))
            errors.Add("Email is required");
        else if (!IsValidEmail(Email))
            errors.Add("Email format is invalid");

        if (Roles == null || !Roles.Any())
            errors.Add("At least one role is required");

        var validStatuses = new[] { "active", "inactive", "pending", "suspended" };
        if (!validStatuses.Contains(Status))
            errors.Add($"Status must be one of: {string.Join(", ", validStatuses)}");

        return errors;
    }

    /// <summary>
    /// Validate email format
    /// </summary>
    /// <param name="email">Email to validate</param>
    /// <returns>True if valid email format</returns>
    private static bool IsValidEmail(string email)
    {
        return System.Text.RegularExpressions.Regex.IsMatch(email,
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
    }
}