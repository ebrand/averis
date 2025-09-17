using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.CustomerStaging.Api.Data;

namespace Commerce.Services.CustomerStaging.Api.Controllers;

/// <summary>
/// Customer Staging API Controller - Provides access to staged customer data for analytics and comparison
/// </summary>
[ApiController]
[Route("api/customers")]
[Produces("application/json")]
public class CustomersController : ControllerBase
{
    private readonly CustomerStagingDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(CustomerStagingDbContext context, ILogger<CustomersController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get staged customers available for analytics and comparison
    /// Reads from the customer staging database
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="limit">Items per page (default: 20)</param>
    /// <param name="search">Search term</param>
    /// <param name="disclosureLevel">Filter by disclosure level</param>
    /// <param name="status">Filter by status (default: active)</param>
    /// <returns>Paginated list of staged customers</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> GetStagedCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? disclosureLevel = null,
        [FromQuery] string? status = null)
    {
        try
        {
            _logger.LogInformation("Getting staged customers - Page: {Page}, Limit: {Limit}, Search: {Search}, DisclosureLevel: {DisclosureLevel}, Status: {Status}", 
                page, limit, search, disclosureLevel, status);

            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            // Build query starting with all customers from staging database
            var query = _context.Customers.AsQueryable();

            // Apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status != null && c.Status.ToLower() == status.ToLower());
            }

            // Apply disclosure level filter if provided
            if (!string.IsNullOrEmpty(disclosureLevel))
            {
                query = query.Where(c => c.DisclosureLevel != null && c.DisclosureLevel.ToLower() == disclosureLevel.ToLower());
            }

            // Apply search filter if provided
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(c =>
                    c.FirstName != null && c.FirstName.ToLower().Contains(searchLower) ||
                    c.LastName != null && c.LastName.ToLower().Contains(searchLower) ||
                    c.Email != null && c.Email.ToLower().Contains(searchLower) ||
                    c.CustomerSegment != null && c.CustomerSegment.ToLower().Contains(searchLower)
                );
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and ordering
            var customers = await query
                .OrderByDescending(c => c.LastActivity)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // Convert to DTOs
            var customerDtos = customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                DisclosureLevel = c.DisclosureLevel ?? "cold",
                VisitorFlag = c.VisitorFlag ?? true,
                FirstName = c.FirstName ?? "",
                LastName = c.LastName ?? "",
                Email = c.Email,
                Phone = c.Phone,
                StytchUserId = c.StytchUserId,
                EmailVerified = c.EmailVerified ?? false,
                CustomerSegment = c.CustomerSegment,
                LifetimeValue = c.LifetimeValue ?? 0.00m,
                AcquisitionChannel = c.AcquisitionChannel,
                MarketingConsent = c.MarketingConsent ?? false,
                DataProcessingConsent = c.DataProcessingConsent ?? false,
                ConsentDate = c.ConsentDate,
                Status = c.Status ?? "active",
                FirstPurchaseDate = c.FirstPurchaseDate,
                LastActivity = c.LastActivity ?? DateTime.UtcNow,
                CreatedAt = c.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = c.UpdatedAt ?? DateTime.UtcNow
            }).ToList();

            var response = new
            {
                customers = customerDtos,
                pagination = new
                {
                    page = page,
                    limit = limit,
                    total = totalCount,
                    pages = (int)Math.Ceiling((double)totalCount / limit),
                    hasNext = page * limit < totalCount,
                    hasPrev = page > 1
                },
                source = "customer-staging-api",
                schema = "averis_customer_staging",
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staged customers");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific staged customer by ID
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <returns>Customer details from staging database</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerDto>> GetStagedCustomer(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting staged customer by ID: {CustomerId}", id);

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                return NotFound(new { error = "Customer not found in staging", customerId = id });
            }

            var customerDto = new CustomerDto
            {
                Id = customer.Id,
                DisclosureLevel = customer.DisclosureLevel ?? "cold",
                VisitorFlag = customer.VisitorFlag ?? true,
                FirstName = customer.FirstName ?? "",
                LastName = customer.LastName ?? "",
                Email = customer.Email,
                Phone = customer.Phone,
                StytchUserId = customer.StytchUserId,
                EmailVerified = customer.EmailVerified ?? false,
                CustomerSegment = customer.CustomerSegment,
                LifetimeValue = customer.LifetimeValue ?? 0.00m,
                AcquisitionChannel = customer.AcquisitionChannel,
                MarketingConsent = customer.MarketingConsent ?? false,
                DataProcessingConsent = customer.DataProcessingConsent ?? false,
                ConsentDate = customer.ConsentDate,
                Status = customer.Status ?? "active",
                FirstPurchaseDate = customer.FirstPurchaseDate,
                LastActivity = customer.LastActivity ?? DateTime.UtcNow,
                CreatedAt = customer.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = customer.UpdatedAt ?? DateTime.UtcNow
            };

            return Ok(customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staged customer {CustomerId}", id);
            return BadRequest(new { error = "Failed to fetch staged customer" });
        }
    }

    /// <summary>
    /// Get staging environment statistics and analytics
    /// </summary>
    /// <returns>Statistics about staged customers with breakdown by disclosure level, status, etc.</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetStagingStats()
    {
        try
        {
            _logger.LogInformation("Getting customer staging statistics");

            var allCustomers = await _context.Customers.ToListAsync();
            
            var stats = new
            {
                totalCustomers = allCustomers.Count,
                customersByStatus = allCustomers.GroupBy(c => c.Status ?? "unknown")
                    .ToDictionary(g => g.Key, g => g.Count()),
                customersByDisclosureLevel = allCustomers.GroupBy(c => c.DisclosureLevel ?? "cold")
                    .ToDictionary(g => g.Key, g => g.Count()),
                customersBySegment = allCustomers.Where(c => !string.IsNullOrEmpty(c.CustomerSegment))
                    .GroupBy(c => c.CustomerSegment)
                    .ToDictionary(g => g.Key!, g => g.Count()),
                averageLifetimeValue = allCustomers.Any() ? allCustomers.Average(c => c.LifetimeValue ?? 0.00m) : 0,
                highValueCustomers = allCustomers.Count(c => (c.LifetimeValue ?? 0.00m) >= 10000),
                verifiedEmailCustomers = allCustomers.Count(c => c.EmailVerified == true),
                marketingConsentCustomers = allCustomers.Count(c => c.MarketingConsent == true),
                recentlyActive = allCustomers.Count(c => c.LastActivity != null && c.LastActivity >= DateTime.UtcNow.AddDays(-30)),
                lastUpdated = DateTime.UtcNow.ToString("O"),
                service = "customer-staging-api",
                schema = "averis_customer_staging"
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staging statistics");
            return BadRequest(new { error = "Failed to fetch staging statistics" });
        }
    }

    /// <summary>
    /// Compare data between staging and production (Customer MDM) for analytics
    /// </summary>
    /// <returns>Data comparison analytics between staging and production</returns>
    [HttpGet("comparison")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetDataComparison()
    {
        try
        {
            _logger.LogInformation("Getting staging vs production data comparison");

            // Get staging data
            var stagingCustomers = await _context.Customers.ToListAsync();
            
            // Prepare comparison analytics
            var comparison = new
            {
                stagingEnvironment = new
                {
                    totalCustomers = stagingCustomers.Count,
                    activeCustomers = stagingCustomers.Count(c => c.Status == "active"),
                    disclosureLevelBreakdown = stagingCustomers.GroupBy(c => c.DisclosureLevel ?? "cold")
                        .ToDictionary(g => g.Key, g => g.Count()),
                    averageLifetimeValue = stagingCustomers.Any() ? stagingCustomers.Average(c => c.LifetimeValue ?? 0.00m) : 0,
                    lastSyncTime = stagingCustomers.Any() ? stagingCustomers.Max(c => c.UpdatedAt) : (DateTime?)null
                },
                // Note: Production comparison would require calling the Customer MDM API
                // For now, we'll provide staging-only analytics
                comparisonMetrics = new
                {
                    totalRecordsInStaging = stagingCustomers.Count,
                    recentUpdates = stagingCustomers.Count(c => c.UpdatedAt >= DateTime.UtcNow.AddHours(-24)),
                    dataFreshness = stagingCustomers.Any() ? (TimeSpan?)(DateTime.UtcNow - stagingCustomers.Max(c => c.UpdatedAt)) : null,
                    uniqueEmails = stagingCustomers.Where(c => !string.IsNullOrEmpty(c.Email)).Select(c => c.Email).Distinct().Count(),
                    duplicateEmails = stagingCustomers.Where(c => !string.IsNullOrEmpty(c.Email))
                        .GroupBy(c => c.Email)
                        .Where(g => g.Count() > 1)
                        .Count()
                },
                timestamp = DateTime.UtcNow.ToString("O"),
                source = "customer-staging-api"
            };

            return Ok(comparison);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data comparison analytics");
            return BadRequest(new { error = "Failed to generate comparison analytics" });
        }
    }

    /// <summary>
    /// Health check endpoint for Customer Staging API
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
            service = "customer-staging-api",
            schema = "averis_customer_staging",
            description = "Customer Staging API for analytics and data comparison"
        });
    }
}