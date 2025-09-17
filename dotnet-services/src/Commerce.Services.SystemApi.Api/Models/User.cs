using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Commerce.Services.SystemApi.Api.Models;

/// <summary>
/// User entity representing system users in the averis_system schema
/// </summary>
[Table("users", Schema = "averis_system")]
public class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("stytch_user_id")]
    [MaxLength(255)]
    public string StytchUserId { get; set; } = string.Empty;

    [Column("first_name")]
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public string? LastName { get; set; }

    [Required]
    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("roles", TypeName = "jsonb")]
    public string RolesJson { get; set; } = "[]";

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "active";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_login")]
    public DateTime? LastLoginAt { get; set; }

    [Column("preferences", TypeName = "jsonb")]
    public string PreferencesJson { get; set; } = "{}";

    [Column("created_by")]
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [Column("updated_by")]
    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    // Helper property to handle roles as array
    [NotMapped]
    public string[] Roles
    {
        get
        {
            try
            {
                if (string.IsNullOrEmpty(RolesJson)) return Array.Empty<string>();
                return System.Text.Json.JsonSerializer.Deserialize<string[]>(RolesJson) ?? Array.Empty<string>();
            }
            catch
            {
                return Array.Empty<string>();
            }
        }
        set
        {
            RolesJson = System.Text.Json.JsonSerializer.Serialize(value ?? Array.Empty<string>());
        }
    }
}