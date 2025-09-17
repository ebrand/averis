using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.SystemApi.Api.Data;

namespace Commerce.Services.SystemApi.Api.Controllers;

/// <summary>
/// Controller for managing users in the Averis system
/// This provides a system-wide view of users across all platform modules
/// </summary>
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;
    private readonly SystemDbContext _context;

    public UsersController(ILogger<UsersController> logger, SystemDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get users with filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<UserListResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] bool include_inactive = false)
    {
        try
        {
            // Validate parameters
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            // Build query from database
            var query = _context.Users.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(u => 
                    (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(searchLower)) ||
                    u.Email.ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.RolesJson.Contains($"\"{role}\""));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(u => u.Status.ToLower() == status.ToLower());
            }

            if (!include_inactive)
            {
                query = query.Where(u => u.Status.ToLower() == "active");
            }

            var totalCount = await query.CountAsync();
            var dbUsers = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // Transform to UserDto format
            var users = dbUsers.Select(u => new UserDto
            {
                Id = new Guid($"{u.Id:00000000}-0000-0000-0000-000000000000"), // Convert int ID to predictable Guid
                StytchUserId = u.StytchUserId,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Status = u.Status,
                Roles = u.Roles, // This uses the helper property to deserialize JSONB
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                LastLoginAt = u.LastLoginAt
            }).ToList();

            var response = new UserListResponse
            {
                Users = users,
                Page = page,
                Limit = limit,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)limit),
                HasNextPage = (page * limit) < totalCount,
                HasPreviousPage = page > 1
            };

            _logger.LogInformation("Retrieved {Count} users (page {Page}, limit {Limit})", users.Count, page, limit);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user analytics/summary
    /// </summary>
    [HttpGet("analytics/summary")]
    public async Task<ActionResult<UserAnalyticsResponse>> GetUserAnalytics()
    {
        try
        {
            // Get analytics from real database
            var allUsers = await _context.Users.ToListAsync();
            
            var analytics = new UserAnalyticsResponse
            {
                TotalUsers = allUsers.Count,
                ActiveUsers = allUsers.Count(u => u.Status.ToLower() == "active"),
                InactiveUsers = allUsers.Count(u => u.Status.ToLower() == "inactive"),
                PendingUsers = allUsers.Count(u => u.Status.ToLower() == "pending"),
                SuspendedUsers = allUsers.Count(u => u.Status.ToLower() == "suspended"),
                UsersByRole = new Dictionary<string, int>
                {
                    ["admin"] = allUsers.Count(u => u.Roles.Contains("admin")),
                    ["user_admin"] = allUsers.Count(u => u.Roles.Contains("user_admin")),
                    ["product_marketing"] = allUsers.Count(u => u.Roles.Contains("product_marketing")),
                    ["product_legal"] = allUsers.Count(u => u.Roles.Contains("product_legal")),
                    ["product_finance"] = allUsers.Count(u => u.Roles.Contains("product_finance")),
                    ["product_salesops"] = allUsers.Count(u => u.Roles.Contains("product_salesops")),
                    ["product_contracts"] = allUsers.Count(u => u.Roles.Contains("product_contracts"))
                },
                UsersWithRecentActivity = allUsers.Count(u => u.LastLoginAt.HasValue && u.LastLoginAt.Value > DateTime.UtcNow.AddDays(-30)),
                LastUpdated = DateTime.UtcNow
            };

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user analytics");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Update user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            // Find user by converted ID (since UI sends GUID but DB uses int)
            var intId = ConvertGuidToIntId(id);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == intId);
            
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Update user properties
            if (request.FirstName != null)
                user.FirstName = request.FirstName;
            if (request.LastName != null)
                user.LastName = request.LastName;
            if (request.Email != null)
                user.Email = request.Email;
            if (request.Status != null)
                user.Status = request.Status;
            if (request.Roles != null)
                user.Roles = request.Roles; // This uses the helper property to serialize to JSONB
            
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return updated user in expected format
            var updatedUserDto = new UserDto
            {
                Id = id, // Keep the original GUID for consistency
                StytchUserId = user.StytchUserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Status = user.Status,
                Roles = user.Roles,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt
            };

            _logger.LogInformation("Updated user {UserId}", id);
            return Ok(updatedUserDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete user (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<object>> DeleteUser(Guid id, [FromBody] DeleteUserRequest? request = null)
    {
        try
        {
            // TODO: Implement real database soft delete functionality
            _logger.LogInformation("User delete not implemented yet for user {UserId}", id);
            return StatusCode(501, new { error = "User delete functionality not implemented yet" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Activate user
    /// </summary>
    [HttpPut("{id}/activate")]
    public async Task<ActionResult<UserDto>> ActivateUser(Guid id, [FromBody] ActivateUserRequest? request = null)
    {
        try
        {
            // Find user by converted ID
            var intId = ConvertGuidToIntId(id);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == intId);
            
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Activate user
            user.Status = "active";
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return updated user
            var updatedUserDto = new UserDto
            {
                Id = id,
                StytchUserId = user.StytchUserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Status = user.Status,
                Roles = user.Roles,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt
            };

            _logger.LogInformation("Activated user {UserId}", id);
            return Ok(updatedUserDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user {UserId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Update user's last login timestamp
    /// </summary>
    [HttpPut("{id}/last-login")]
    public async Task<ActionResult<object>> UpdateLastLogin(Guid id)
    {
        try
        {
            // Find user by converted ID
            var intId = ConvertGuidToIntId(id);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == intId);
            
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            // Update last login timestamp
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated last login for user {UserId}", id);
            return Ok(new { message = "Last login updated successfully", lastLoginAt = user.LastLoginAt });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last login for user {UserId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Convert GUID back to int ID for database operations
    /// </summary>
    private int ConvertGuidToIntId(Guid guid)
    {
        // Extract the integer from the predictable GUID format we used
        // Format was: "{u.Id:00000000}-0000-0000-0000-000000000000"
        var guidString = guid.ToString();
        var intPart = guidString.Substring(0, 8);
        return int.Parse(intPart);
    }

}

#region DTOs

public class UserListResponse
{
    public List<UserDto> Users { get; set; } = new();
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class UserAnalyticsResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int PendingUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public Dictionary<string, int> UsersByRole { get; set; } = new();
    public int UsersWithRecentActivity { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string StytchUserId { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public string[] Roles { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Status { get; set; }
    public string[]? Roles { get; set; }
}

public class DeleteUserRequest
{
    public Guid? UpdatedBy { get; set; }
}

public class ActivateUserRequest
{
    public Guid? UpdatedBy { get; set; }
}

#endregion