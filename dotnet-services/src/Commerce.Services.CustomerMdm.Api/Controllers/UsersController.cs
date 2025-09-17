using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Data.Services;
using System.ComponentModel.DataAnnotations;

namespace Commerce.Services.UserMdm.Api.Controllers;

/// <summary>
/// User MDM API Controller - Centralized user management for all commerce applications
/// Provides RESTful endpoints for customer management in the customer_mdm schema
/// </summary>
[ApiController]
[Route("api/users")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly ICustomerUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ICustomerUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get users with filtering, sorting, and pagination
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="limit">Items per page (default: 20)</param>
    /// <param name="search">Search term for name or email</param>
    /// <param name="status">Filter by status (active, inactive, pending, suspended)</param>
    /// <param name="role">Filter by role</param>
    /// <param name="stytch_user_id">Filter by Stytch user ID</param>
    /// <param name="includeInactive">Include inactive users (default: true)</param>
    /// <param name="sortBy">Field to sort by (default: lastName)</param>
    /// <param name="sortOrder">Sort order: ASC or DESC (default: ASC)</param>
    /// <returns>Paginated list of users</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedUserResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? role = null,
        [FromQuery] string? stytch_user_id = null,
        [FromQuery] bool includeInactive = true,
        [FromQuery] string sortBy = "lastName",
        [FromQuery] string sortOrder = "ASC")
    {
        try
        {
            _logger.LogInformation("Getting users from customer_mdm - Page: {Page}, Limit: {Limit}, Search: {Search}",
                page, limit, search);

            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20; // Cap at 100 items per page

            var result = await _userService.GetUsersAsync(
                page, limit, search, status, role, stytch_user_id, includeInactive, sortBy, sortOrder);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users from customer_mdm");
            return BadRequest(new { error = "Failed to fetch users" });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        try
        {
            _logger.LogInformation("Getting user by ID from customer_mdm: {UserId}", id);

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId} from customer_mdm", id);
            return BadRequest(new { error = "Failed to fetch user" });
        }
    }

    /// <summary>
    /// Get user by email address
    /// </summary>
    /// <param name="email">Email address</param>
    /// <returns>User details</returns>
    [HttpGet("by-email/{email}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserByEmail(string email)
    {
        try
        {
            _logger.LogInformation("Getting user by email from customer_mdm: {Email}", email);

            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email {Email} from customer_mdm", email);
            return BadRequest(new { error = "Failed to fetch user" });
        }
    }

    /// <summary>
    /// Get user by Stytch user ID
    /// </summary>
    /// <param name="stytchUserId">Stytch user ID</param>
    /// <returns>User details</returns>
    [HttpGet("by-stytch/{stytchUserId}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserByStytchUserId(string stytchUserId)
    {
        try
        {
            _logger.LogInformation("Getting user by Stytch user ID from customer_mdm: {StytchUserId}", stytchUserId);

            var user = await _userService.GetUserByStytchUserIdAsync(stytchUserId);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by Stytch user ID {StytchUserId} from customer_mdm", stytchUserId);
            return BadRequest(new { error = "Failed to fetch user" });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    /// <param name="request">User creation data</param>
    /// <returns>Created user</returns>
    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            _logger.LogInformation("Creating user in customer_mdm: {Email}", request.Email);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // TODO: Extract user from authentication context
            var createdByUser = GetCurrentUser();

            var user = await _userService.CreateUserAsync(request, createdByUser);

            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.Id },
                user);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already in use"))
        {
            _logger.LogWarning("Duplicate user data attempted in customer_mdm: {Email}", request.Email);
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("validation failed"))
        {
            _logger.LogWarning("User validation failed in customer_mdm: {Error}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user in customer_mdm");
            return BadRequest(new { error = "Failed to create user" });
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">User update data</param>
    /// <returns>Updated user</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            _logger.LogInformation("Updating user in customer_mdm: {UserId}", id);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // TODO: Extract user from authentication context
            var updatedByUser = GetCurrentUser();

            var updatedUser = await _userService.UpdateUserAsync(id, request, updatedByUser);
            if (updatedUser == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(updatedUser);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already in use"))
        {
            _logger.LogWarning("Duplicate user data attempted during update in customer_mdm: {Email}", request.Email);
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("validation failed"))
        {
            _logger.LogWarning("User validation failed in customer_mdm: {Error}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId} in customer_mdm", id);
            return BadRequest(new { error = "Failed to update user" });
        }
    }

    /// <summary>
    /// Delete a user (soft delete - sets status to inactive)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success confirmation</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            _logger.LogInformation("Deleting user in customer_mdm: {UserId}", id);

            var success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new { message = "User deleted successfully", id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId} in customer_mdm", id);
            return BadRequest(new { error = "Failed to delete user" });
        }
    }

    /// <summary>
    /// Activate a user (set status to active)
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>Success confirmation</returns>
    [HttpPut("{id:int}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ActivateUser(int id)
    {
        try
        {
            _logger.LogInformation("Activating user in customer_mdm: {UserId}", id);

            var success = await _userService.ActivateUserAsync(id);
            if (!success)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new { message = "User activated successfully", id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user {UserId} in customer_mdm", id);
            return BadRequest(new { error = "Failed to activate user" });
        }
    }

    /// <summary>
    /// Update user's last login timestamp
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Last login update data</param>
    /// <returns>Success confirmation</returns>
    [HttpPut("{id:int}/last-login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> UpdateLastLogin(int id, [FromBody] UpdateLastLoginRequest request)
    {
        try
        {
            _logger.LogInformation("Updating last login for user in customer_mdm: {UserId}", id);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _userService.UpdateLastLoginAsync(id, request);
            if (!success)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new { message = "Last login updated successfully", id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last login for user {UserId} in customer_mdm", id);
            return BadRequest(new { error = "Failed to update last login" });
        }
    }

    /// <summary>
    /// Get users by role
    /// </summary>
    /// <param name="role">Role to filter by</param>
    /// <param name="includeInactive">Include inactive users</param>
    /// <returns>List of users with the specified role</returns>
    [HttpGet("by-role/{role}")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersByRole(
        string role, 
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            _logger.LogInformation("Getting users by role from customer_mdm: {Role}", role);

            var users = await _userService.GetUsersByRoleAsync(role, includeInactive);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users by role {Role} from customer_mdm", role);
            return BadRequest(new { error = "Failed to fetch users by role" });
        }
    }

    /// <summary>
    /// Get user analytics summary
    /// </summary>
    /// <returns>User analytics data</returns>
    [HttpGet("analytics/summary")]
    [ProducesResponseType(typeof(UserAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserAnalyticsDto>> GetUserAnalytics()
    {
        try
        {
            _logger.LogInformation("Getting user analytics from customer_mdm");
            var analytics = await _userService.GetUserAnalyticsAsync();
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user analytics from customer_mdm");
            return BadRequest(new { error = "Failed to fetch user analytics" });
        }
    }

    /// <summary>
    /// Get available roles and their descriptions
    /// </summary>
    /// <returns>Available roles information</returns>
    [HttpGet("roles/available")]
    [ProducesResponseType(typeof(AvailableRolesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AvailableRolesResponse>> GetAvailableRoles()
    {
        try
        {
            _logger.LogInformation("Getting available roles from customer_mdm");
            var roles = await _userService.GetAvailableRolesAsync();
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available roles from customer_mdm");
            return BadRequest(new { error = "Failed to fetch available roles" });
        }
    }

    /// <summary>
    /// Health check endpoint for User MDM API
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetHealth()
    {
        return Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            service = "user-mdm-api",
            schema = "customer_mdm"
        });
    }

    // TODO: Implement authentication and extract user information
    private string GetCurrentUser()
    {
        // Placeholder - extract from authentication context when implemented
        return "system";
    }
}