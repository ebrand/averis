using Commerce.Services.Shared.Models.DTOs;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service interface for Customer User business logic operations
/// Provides high-level operations with validation and mapping for customer_mdm schema
/// </summary>
public interface ICustomerUserService
{
    /// <summary>
    /// Get users with filtering, pagination, and sorting
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="limit">Items per page</param>
    /// <param name="search">Search term (name, email)</param>
    /// <param name="status">Filter by status</param>
    /// <param name="role">Filter by role</param>
    /// <param name="stytchUserId">Filter by Stytch user ID</param>
    /// <param name="includeInactive">Include inactive users</param>
    /// <param name="sortBy">Field to sort by</param>
    /// <param name="sortOrder">Sort order (ASC/DESC)</param>
    /// <returns>Paginated user response</returns>
    Task<PagedUserResponse> GetUsersAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? status = null,
        string? role = null,
        string? stytchUserId = null,
        bool includeInactive = true,
        string sortBy = "lastName",
        string sortOrder = "ASC");

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User DTO or null if not found</returns>
    Task<UserDto?> GetUserByIdAsync(int id);

    /// <summary>
    /// Get user by email address
    /// </summary>
    /// <param name="email">Email address</param>
    /// <returns>User DTO or null if not found</returns>
    Task<UserDto?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Get user by Stytch user ID
    /// </summary>
    /// <param name="stytchUserId">Stytch user ID</param>
    /// <returns>User DTO or null if not found</returns>
    Task<UserDto?> GetUserByStytchUserIdAsync(string stytchUserId);

    /// <summary>
    /// Create a new user with validation
    /// </summary>
    /// <param name="request">User creation request</param>
    /// <param name="createdByUser">User creating this record</param>
    /// <returns>Created user DTO</returns>
    /// <exception cref="InvalidOperationException">Thrown for validation errors</exception>
    Task<UserDto> CreateUserAsync(CreateUserRequest request, string? createdByUser = null);

    /// <summary>
    /// Update an existing user with validation
    /// </summary>
    /// <param name="id">User ID to update</param>
    /// <param name="request">User update request</param>
    /// <param name="updatedByUser">User making this update</param>
    /// <returns>Updated user DTO or null if not found</returns>
    /// <exception cref="InvalidOperationException">Thrown for validation errors</exception>
    Task<UserDto?> UpdateUserAsync(int id, UpdateUserRequest request, string? updatedByUser = null);

    /// <summary>
    /// Delete a user (soft delete)
    /// </summary>
    /// <param name="id">User ID to delete</param>
    /// <returns>True if user was deleted, false if not found</returns>
    Task<bool> DeleteUserAsync(int id);

    /// <summary>
    /// Activate a user
    /// </summary>
    /// <param name="id">User ID to activate</param>
    /// <returns>True if user was activated, false if not found</returns>
    Task<bool> ActivateUserAsync(int id);

    /// <summary>
    /// Update user's last login timestamp
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Last login update request</param>
    /// <returns>True if updated, false if user not found</returns>
    Task<bool> UpdateLastLoginAsync(int id, UpdateLastLoginRequest request);

    /// <summary>
    /// Get users by role
    /// </summary>
    /// <param name="role">Role to filter by</param>
    /// <param name="includeInactive">Include inactive users</param>
    /// <returns>List of user DTOs</returns>
    Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role, bool includeInactive = false);

    /// <summary>
    /// Get user analytics/summary data
    /// </summary>
    /// <returns>User analytics DTO</returns>
    Task<UserAnalyticsDto> GetUserAnalyticsAsync();

    /// <summary>
    /// Get available roles and their descriptions
    /// </summary>
    /// <returns>Available roles response</returns>
    Task<AvailableRolesResponse> GetAvailableRolesAsync();

    /// <summary>
    /// Validate user data (business rules)
    /// </summary>
    /// <param name="request">User data to validate</param>
    /// <param name="userId">User ID for updates (null for creates)</param>
    /// <returns>Tuple of validation result and errors</returns>
    Task<(bool IsValid, List<string> Errors)> ValidateUserAsync(CreateUserRequest request, int? userId = null);
}