using Microsoft.Extensions.Logging;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Data.Repositories;

namespace Commerce.Services.Shared.Data.Services;

/// <summary>
/// Service implementation for User business logic operations
/// Handles validation, mapping, and coordination between repository and API layers
/// </summary>
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository userRepository, ILogger<UserService> logger)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PagedUserResponse> GetUsersAsync(
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
        _logger.LogInformation("Getting users with filters - Page: {Page}, Limit: {Limit}, Search: {Search}",
            page, limit, search);

        var (users, totalCount) = await _userRepository.GetUsersAsync(
            page, limit, search, status, role, stytchUserId, includeInactive, sortBy, sortOrder);

        var userDtos = users.Select(MapToDto).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / limit);

        return new PagedUserResponse
        {
            Users = userDtos,
            TotalCount = totalCount,
            Page = page,
            Limit = limit,
            TotalPages = totalPages,
            HasNextPage = page < totalPages,
            HasPreviousPage = page > 1
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        _logger.LogInformation("Getting user by ID: {UserId}", id);

        var user = await _userRepository.GetUserByIdAsync(id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        _logger.LogInformation("Getting user by email: {Email}", email);

        var user = await _userRepository.GetUserByEmailAsync(email);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetUserByStytchUserIdAsync(string stytchUserId)
    {
        _logger.LogInformation("Getting user by Stytch user ID: {StytchUserId}", stytchUserId);

        var user = await _userRepository.GetUserByStytchUserIdAsync(stytchUserId);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, string? createdByUser = null)
    {
        _logger.LogInformation("Creating user: {Email}", request.Email);

        // Validate the request
        var (isValid, errors) = await ValidateUserAsync(request);
        if (!isValid)
        {
            throw new InvalidOperationException($"User validation failed: {string.Join(", ", errors)}");
        }

        // Map to entity
        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim().ToLower(),
            StytchUserId = request.StytchUserId?.Trim(),
            Roles = request.Roles.Select(r => r.Trim()).ToList(),
            Status = request.Status,
            PreferencesJson = request.PreferencesJson,
            CreatedBy = createdByUser ?? "system",
            UpdatedBy = createdByUser ?? "system"
        };

        // Create in repository
        var createdUser = await _userRepository.CreateUserAsync(user);

        _logger.LogInformation("Created user with ID: {UserId}", createdUser.Id);
        return MapToDto(createdUser);
    }

    public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserRequest request, string? updatedByUser = null)
    {
        _logger.LogInformation("Updating user: {UserId}", id);

        // Check if user exists
        var existingUser = await _userRepository.GetUserByIdAsync(id);
        if (existingUser == null)
        {
            _logger.LogWarning("User not found for update: {UserId}", id);
            return null;
        }

        // Validate the request (convert to CreateUserRequest for validation)
        var createRequest = new CreateUserRequest
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            StytchUserId = request.StytchUserId,
            Roles = request.Roles,
            Status = request.Status,
            PreferencesJson = request.PreferencesJson
        };

        var (isValid, errors) = await ValidateUserAsync(createRequest, id);
        if (!isValid)
        {
            throw new InvalidOperationException($"User validation failed: {string.Join(", ", errors)}");
        }

        // Update entity properties
        existingUser.FirstName = request.FirstName.Trim();
        existingUser.LastName = request.LastName.Trim();
        existingUser.Email = request.Email.Trim().ToLower();
        existingUser.StytchUserId = request.StytchUserId?.Trim();
        existingUser.Roles = request.Roles.Select(r => r.Trim()).ToList();
        existingUser.Status = request.Status;
        existingUser.PreferencesJson = request.PreferencesJson;
        existingUser.UpdatedBy = updatedByUser ?? "system";

        // Update in repository
        var updatedUser = await _userRepository.UpdateUserAsync(existingUser);

        _logger.LogInformation("Updated user: {UserId}", id);
        return updatedUser != null ? MapToDto(updatedUser) : null;
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        _logger.LogInformation("Deleting user: {UserId}", id);

        return await _userRepository.DeleteUserAsync(id);
    }

    public async Task<bool> ActivateUserAsync(int id)
    {
        _logger.LogInformation("Activating user: {UserId}", id);

        return await _userRepository.ActivateUserAsync(id);
    }

    public async Task<bool> UpdateLastLoginAsync(int id, UpdateLastLoginRequest request)
    {
        _logger.LogInformation("Updating last login for user: {UserId}", id);

        return await _userRepository.UpdateLastLoginAsync(id, request.LastLogin);
    }

    public async Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role, bool includeInactive = false)
    {
        _logger.LogInformation("Getting users by role: {Role}", role);

        var users = await _userRepository.GetUsersByRoleAsync(role, includeInactive);
        return users.Select(MapToDto);
    }

    public async Task<UserAnalyticsDto> GetUserAnalyticsAsync()
    {
        _logger.LogInformation("Getting user analytics");

        var analytics = await _userRepository.GetUserAnalyticsAsync();

        return new UserAnalyticsDto
        {
            TotalUsers = analytics.TotalUsers,
            ActiveUsers = analytics.ActiveUsers,
            InactiveUsers = analytics.InactiveUsers,
            PendingUsers = analytics.PendingUsers,
            SuspendedUsers = analytics.SuspendedUsers,
            UsersByRole = analytics.UsersByRole,
            UsersByStatus = analytics.UsersByStatus,
            LastUserCreated = analytics.LastUserCreated,
            LastUserLogin = analytics.LastUserLogin,
            UsersWithRecentActivity = analytics.UsersWithRecentActivity
        };
    }

    public async Task<AvailableRolesResponse> GetAvailableRolesAsync()
    {
        _logger.LogInformation("Getting available roles");

        // Simulate async operation for consistency with interface
        await Task.CompletedTask;

        var roles = new List<UserRoleDto>
        {
            // Product MDM Roles
            new() { Role = "product_marketing", Description = "Product Marketing Team", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_marketing_approve", Description = "Product Marketing Approver", Category = "Product MDM", IsApprovalRole = true },
            new() { Role = "product_legal", Description = "Product Legal Team", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_legal_approve", Description = "Product Legal Approver", Category = "Product MDM", IsApprovalRole = true },
            new() { Role = "product_finance", Description = "Product Finance Team", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_finance_approve", Description = "Product Finance Approver", Category = "Product MDM", IsApprovalRole = true },
            new() { Role = "product_salesops", Description = "Product Sales Operations Team", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_salesops_approve", Description = "Product Sales Operations Approver", Category = "Product MDM", IsApprovalRole = true },
            new() { Role = "product_contracts", Description = "Product Contracts Team", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_contracts_approve", Description = "Product Contracts Approver", Category = "Product MDM", IsApprovalRole = true },
            new() { Role = "product_launch", Description = "Product Launch Authority", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_admin", Description = "Product Administrator", Category = "Product MDM", IsApprovalRole = false },
            new() { Role = "product_view", Description = "Product Read-Only Access", Category = "Product MDM", IsApprovalRole = false },

            // Administrative Roles
            new() { Role = "admin", Description = "System Administrator", Category = "Administrative", IsApprovalRole = false },
            new() { Role = "user_admin", Description = "User Administrator", Category = "Administrative", IsApprovalRole = false },
            new() { Role = "system_monitor", Description = "System Monitoring", Category = "Administrative", IsApprovalRole = false },
            new() { Role = "user", Description = "Basic User", Category = "General", IsApprovalRole = false }
        };

        var rolesByCategory = roles.GroupBy(r => r.Category)
            .ToDictionary(g => g.Key, g => g.AsEnumerable());

        return new AvailableRolesResponse
        {
            Roles = roles,
            RolesByCategory = rolesByCategory
        };
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidateUserAsync(CreateUserRequest request, int? userId = null)
    {
        var errors = new List<string>();

        // Basic field validation
        if (string.IsNullOrWhiteSpace(request.FirstName))
            errors.Add("First name is required");

        if (string.IsNullOrWhiteSpace(request.LastName))
            errors.Add("Last name is required");

        if (string.IsNullOrWhiteSpace(request.Email))
            errors.Add("Email is required");
        else if (!IsValidEmail(request.Email))
            errors.Add("Email format is invalid");

        // Role validation
        if (request.Roles == null || !request.Roles.Any())
            errors.Add("At least one role is required");
        else
        {
            foreach (var role in request.Roles)
            {
                if (!UserValidationRules.AllValidRoles.Contains(role))
                    errors.Add($"Invalid role: {role}");
            }
        }

        // Status validation
        if (!UserValidationRules.ValidStatuses.Contains(request.Status))
            errors.Add($"Invalid status. Valid values: {string.Join(", ", UserValidationRules.ValidStatuses)}");

        // Database validation - check for duplicates
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailExists = await _userRepository.EmailExistsAsync(request.Email, userId);
            if (emailExists)
                errors.Add($"Email '{request.Email}' is already in use");
        }

        if (!string.IsNullOrWhiteSpace(request.StytchUserId))
        {
            var stytchUserIdExists = await _userRepository.StytchUserIdExistsAsync(request.StytchUserId, userId);
            if (stytchUserIdExists)
                errors.Add($"Stytch user ID '{request.StytchUserId}' is already in use");
        }

        return (!errors.Any(), errors);
    }

    /// <summary>
    /// Map User entity to UserDto
    /// </summary>
    /// <param name="user">User entity</param>
    /// <returns>User DTO</returns>
    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            StytchUserId = user.StytchUserId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Roles = user.Roles,
            Status = user.Status,
            LastLogin = user.LastLogin,
            PreferencesJson = user.PreferencesJson,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            CreatedBy = user.CreatedBy,
            UpdatedBy = user.UpdatedBy,

            // Computed properties
            DisplayName = user.DisplayName,
            IsActive = user.IsActive,
            IsAdmin = user.IsAdmin,
            ProductMdmRoles = user.ProductMdmRoles,
            CanApproveProducts = user.CanApproveProducts,
            CanLaunchProducts = user.CanLaunchProducts
        };
    }

    /// <summary>
    /// Validate email format using regex
    /// </summary>
    /// <param name="email">Email to validate</param>
    /// <returns>True if valid email format</returns>
    private static bool IsValidEmail(string email)
    {
        return System.Text.RegularExpressions.Regex.IsMatch(email,
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
    }
}