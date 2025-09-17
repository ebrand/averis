using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.Shared.Data.Repositories;

/// <summary>
/// Repository implementation for Customer User data access operations
/// Handles all database interactions for User entities in customer_mdm schema with PostgreSQL
/// </summary>
public class CustomerUserRepository : ICustomerUserRepository
{
    private readonly CustomerMdmDbContext _context;
    private readonly ILogger<CustomerUserRepository> _logger;

    public CustomerUserRepository(CustomerMdmDbContext context, ILogger<CustomerUserRepository> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(
        int page = 1,
        int limit = 20,
        string? search = null,
        string? status = null,
        string? role = null,
        string? stytchUserId = null,
        bool includeInactive = true,
        string sortBy = "lastName",
        string sortOrder = "ASC")
    {
        _logger.LogInformation("Getting users from customer_mdm - Page: {Page}, Limit: {Limit}, Search: {Search}",
            page, limit, search);

        var query = _context.Users.AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u => 
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(u => u.Status == status);
        }
        else if (!includeInactive)
        {
            query = query.Where(u => u.Status == "active");
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Roles.Contains(role));
        }

        if (!string.IsNullOrWhiteSpace(stytchUserId))
        {
            query = query.Where(u => u.StytchUserId == stytchUserId);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "firstname" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.FirstName)
                : query.OrderBy(u => u.FirstName),
            "lastname" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.LastName)
                : query.OrderBy(u => u.LastName),
            "email" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),
            "status" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.Status)
                : query.OrderBy(u => u.Status),
            "createdat" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt),
            "lastlogin" => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.LastLogin)
                : query.OrderBy(u => u.LastLogin),
            _ => sortOrder.ToUpper() == "DESC" 
                ? query.OrderByDescending(u => u.LastName)
                : query.OrderBy(u => u.LastName)
        };

        // Apply pagination
        var users = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} users out of {Total} total from customer_mdm",
            users.Count, totalCount);

        return (users, totalCount);
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        _logger.LogInformation("Getting user by ID from customer_mdm: {UserId}", id);

        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        _logger.LogInformation("Getting user by email from customer_mdm: {Email}", email);

        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetUserByStytchUserIdAsync(string stytchUserId)
    {
        _logger.LogInformation("Getting user by Stytch user ID from customer_mdm: {StytchUserId}", stytchUserId);

        return await _context.Users
            .FirstOrDefaultAsync(u => u.StytchUserId == stytchUserId);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        _logger.LogInformation("Creating user in customer_mdm: {Email}", user.Email);

        // Ensure timestamps are set
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created user with ID: {UserId} in customer_mdm", user.Id);
        return user;
    }

    public async Task<User?> UpdateUserAsync(User user)
    {
        _logger.LogInformation("Updating user in customer_mdm: {UserId}", user.Id);

        var existingUser = await _context.Users.FindAsync(user.Id);
        if (existingUser == null)
        {
            _logger.LogWarning("User not found for update in customer_mdm: {UserId}", user.Id);
            return null;
        }

        // Update properties
        existingUser.FirstName = user.FirstName;
        existingUser.LastName = user.LastName;
        existingUser.Email = user.Email;
        existingUser.StytchUserId = user.StytchUserId;
        existingUser.Roles = user.Roles;
        existingUser.Status = user.Status;
        existingUser.PreferencesJson = user.PreferencesJson;
        existingUser.UpdatedBy = user.UpdatedBy;
        // UpdatedAt is automatically set in SaveChanges override

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user: {UserId} in customer_mdm", user.Id);
        return existingUser;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        _logger.LogInformation("Soft deleting user in customer_mdm: {UserId}", id);

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("User not found for deletion in customer_mdm: {UserId}", id);
            return false;
        }

        // Soft delete by setting status to inactive
        user.Status = "inactive";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Soft deleted user: {UserId} in customer_mdm", id);
        return true;
    }

    public async Task<bool> ActivateUserAsync(int id)
    {
        _logger.LogInformation("Activating user in customer_mdm: {UserId}", id);

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("User not found for activation in customer_mdm: {UserId}", id);
            return false;
        }

        user.Status = "active";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Activated user: {UserId} in customer_mdm", id);
        return true;
    }

    public async Task<bool> UpdateLastLoginAsync(int id, DateTime lastLogin)
    {
        _logger.LogInformation("Updating last login for user in customer_mdm: {UserId}", id);

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("User not found for last login update in customer_mdm: {UserId}", id);
            return false;
        }

        user.LastLogin = lastLogin;
        await _context.SaveChangesAsync();

        _logger.LogDebug("Updated last login for user: {UserId} in customer_mdm", id);
        return true;
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null)
    {
        var query = _context.Users.Where(u => u.Email.ToLower() == email.ToLower());

        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<bool> StytchUserIdExistsAsync(string stytchUserId, int? excludeUserId = null)
    {
        var query = _context.Users.Where(u => u.StytchUserId == stytchUserId);

        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<IEnumerable<User>> GetUsersByRoleAsync(string role, bool includeInactive = false)
    {
        _logger.LogInformation("Getting users by role from customer_mdm: {Role}", role);

        var query = _context.Users.Where(u => u.Roles.Contains(role));

        if (!includeInactive)
        {
            query = query.Where(u => u.Status == "active");
        }

        return await query.ToListAsync();
    }

    public async Task<CustomerUserAnalytics> GetUserAnalyticsAsync()
    {
        _logger.LogInformation("Getting user analytics from customer_mdm");

        var users = await _context.Users.ToListAsync();
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var analytics = new CustomerUserAnalytics
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.Status == "active"),
            InactiveUsers = users.Count(u => u.Status == "inactive"),
            PendingUsers = users.Count(u => u.Status == "pending"),
            SuspendedUsers = users.Count(u => u.Status == "suspended"),
            LastUserCreated = users.Any() ? users.Max(u => u.CreatedAt) : null,
            LastUserLogin = users.Where(u => u.LastLogin.HasValue).Any() 
                ? users.Where(u => u.LastLogin.HasValue).Max(u => u.LastLogin) 
                : null,
            UsersWithRecentActivity = users.Count(u => u.LastLogin.HasValue && u.LastLogin.Value >= thirtyDaysAgo)
        };

        // Status breakdown
        analytics.UsersByStatus = users
            .GroupBy(u => u.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        // Role breakdown - flatten all roles across all users
        var allRoles = users.SelectMany(u => u.Roles).ToList();
        analytics.UsersByRole = allRoles
            .GroupBy(r => r)
            .ToDictionary(g => g.Key, g => g.Count());

        _logger.LogInformation("Generated analytics for {TotalUsers} users from customer_mdm", analytics.TotalUsers);
        return analytics;
    }
}