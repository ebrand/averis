using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository interface for Customer User data access operations
/// Provides abstraction layer for database operations on User entities in customer_mdm schema
/// </summary>
public interface ICustomerUserRepository
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
    /// <returns>Tuple of users and total count</returns>
    Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(
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
    /// <returns>User entity or null if not found</returns>
    Task<User?> GetUserByIdAsync(int id);

    /// <summary>
    /// Get user by email address
    /// </summary>
    /// <param name="email">Email address</param>
    /// <returns>User entity or null if not found</returns>
    Task<User?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Get user by Stytch user ID
    /// </summary>
    /// <param name="stytchUserId">Stytch user ID</param>
    /// <returns>User entity or null if not found</returns>
    Task<User?> GetUserByStytchUserIdAsync(string stytchUserId);

    /// <summary>
    /// Create a new user
    /// </summary>
    /// <param name="user">User to create</param>
    /// <returns>Created user with ID populated</returns>
    Task<User> CreateUserAsync(User user);

    /// <summary>
    /// Update an existing user
    /// </summary>
    /// <param name="user">User to update</param>
    /// <returns>Updated user or null if not found</returns>
    Task<User?> UpdateUserAsync(User user);

    /// <summary>
    /// Soft delete a user (set status to inactive)
    /// </summary>
    /// <param name="id">User ID to delete</param>
    /// <returns>True if user was deleted, false if not found</returns>
    Task<bool> DeleteUserAsync(int id);

    /// <summary>
    /// Activate a user (set status to active)
    /// </summary>
    /// <param name="id">User ID to activate</param>
    /// <returns>True if user was activated, false if not found</returns>
    Task<bool> ActivateUserAsync(int id);

    /// <summary>
    /// Update user's last login timestamp
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="lastLogin">Last login timestamp</param>
    /// <returns>True if updated, false if user not found</returns>
    Task<bool> UpdateLastLoginAsync(int id, DateTime lastLogin);

    /// <summary>
    /// Check if email already exists (for unique validation)
    /// </summary>
    /// <param name="email">Email to check</param>
    /// <param name="excludeUserId">User ID to exclude from check (for updates)</param>
    /// <returns>True if email exists</returns>
    Task<bool> EmailExistsAsync(string email, int? excludeUserId = null);

    /// <summary>
    /// Check if Stytch user ID already exists
    /// </summary>
    /// <param name="stytchUserId">Stytch user ID to check</param>
    /// <param name="excludeUserId">User ID to exclude from check</param>
    /// <returns>True if Stytch user ID exists</returns>
    Task<bool> StytchUserIdExistsAsync(string stytchUserId, int? excludeUserId = null);

    /// <summary>
    /// Get users by role
    /// </summary>
    /// <param name="role">Role to filter by</param>
    /// <param name="includeInactive">Include inactive users</param>
    /// <returns>List of users with the role</returns>
    Task<IEnumerable<User>> GetUsersByRoleAsync(string role, bool includeInactive = false);

    /// <summary>
    /// Get user analytics/summary data
    /// </summary>
    /// <returns>User analytics data</returns>
    Task<CustomerUserAnalytics> GetUserAnalyticsAsync();
}

/// <summary>
/// Customer user analytics data structure
/// </summary>
public class CustomerUserAnalytics
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
    public int UsersWithRecentActivity { get; set; }
}