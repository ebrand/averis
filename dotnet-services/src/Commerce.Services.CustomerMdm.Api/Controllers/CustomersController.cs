using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Models.Entities;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Infrastructure.Logging;
using Commerce.Services.CustomerMdm.Api.Services;
using System.Text.Json;

namespace Commerce.Services.CustomerMdm.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly CustomerDbContext _context;
        private readonly ILogger<CustomersController> _logger;
        private readonly ICustomerMessageService _customerMessageService;
        private readonly ICustomerRealTimeLogService _realTimeLogService;

        public CustomersController(
            CustomerDbContext context, 
            ILogger<CustomersController> logger,
            ICustomerMessageService customerMessageService,
            ICustomerRealTimeLogService realTimeLogService)
        {
            _context = context;
            _logger = logger;
            _customerMessageService = customerMessageService;
            _realTimeLogService = realTimeLogService;
        }

        /// <summary>
        /// Get all customers with optional pagination and filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? disclosureLevel = null)
        {
            try
            {
                _logger.LogInformation("Getting customers - Page: {Page}, PageSize: {PageSize}, Search: {Search}, Status: {Status}, DisclosureLevel: {DisclosureLevel}", 
                    page, pageSize, search, status, disclosureLevel);

                // Build query starting with all customers
                var query = _context.Customers.AsQueryable();

                // Apply search filter if provided
                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(c =>
                        (c.FirstName != null && c.FirstName.ToLower().Contains(searchLower)) ||
                        (c.LastName != null && c.LastName.ToLower().Contains(searchLower)) ||
                        (c.Email != null && c.Email.ToLower().Contains(searchLower)) ||
                        (c.CompanyName != null && c.CompanyName.ToLower().Contains(searchLower))
                    );
                }

                // Apply status filter if provided
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(c => c.Status != null && c.Status.ToLower() == status.ToLower());
                }

                // Apply disclosure level filter if provided
                if (!string.IsNullOrEmpty(disclosureLevel))
                {
                    query = query.Where(c => c.DisclosureLevel != null && c.DisclosureLevel.ToLower() == disclosureLevel.ToLower());
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination and ordering (by created date since LastActivity is computed)
                var customers = await query
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Convert to DTOs
                var customerDtos = customers.Select(c => new CustomerDto
                {
                    Id = c.Id,
                    DisclosureLevel = c.DisclosureLevel ?? "cold",
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    Email = c.Email,
                    Phone = c.Phone,
                    CompanyName = c.CompanyName,
                    StytchUserId = c.StytchUserId,
                    CustomerNumber = c.CustomerNumber,
                    EmailVerified = c.EmailVerified,
                    CustomerSegment = c.CustomerSegment,
                    LifetimeValue = c.LifetimeValue,
                    Status = c.Status ?? "active",
                    LastActivity = c.LastActivity,
                    CreatedAt = c.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = c.UpdatedAt ?? DateTime.MinValue
                }).ToList();

                var result = new
                {
                    data = customerDtos,
                    pagination = new
                    {
                        page = page,
                        limit = pageSize,
                        total = totalCount,
                        pages = (int)Math.Ceiling((double)totalCount / pageSize)
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customers");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
        {
            try
            {
                _logger.LogInformation("Getting customer {CustomerId}", id);

                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                {
                    _logger.LogWarning("Customer not found: {CustomerId}", id);
                    return NotFound(new { error = "Customer not found", customerId = id });
                }

                var customerDto = new CustomerDto
                {
                    Id = customer.Id,
                    DisclosureLevel = customer.DisclosureLevel ?? "cold",
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Email = customer.Email,
                    Phone = customer.Phone,
                    CompanyName = customer.CompanyName,
                    StytchUserId = customer.StytchUserId,
                    CustomerNumber = customer.CustomerNumber,
                    EmailVerified = customer.EmailVerified,
                    CustomerSegment = customer.CustomerSegment,
                    LifetimeValue = customer.LifetimeValue,
                    Status = customer.Status ?? "active",
                    LastActivity = customer.LastActivity,
                    CreatedAt = customer.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = customer.UpdatedAt ?? DateTime.MinValue
                };

                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer {CustomerId}", id);
                return BadRequest(new { error = ex.Message });
            }
        }

        /*
        // Temporarily commented out other methods while fixing schema mismatch
        
        /// <summary>
        /// Get customer by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
        {
            try
            {
                _logger.LogInformation("Getting customer {CustomerId}", id);

                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                {
                    _logger.LogWarning("Customer not found: {CustomerId}", id);
                    return NotFound(new { error = "Customer not found", customerId = id });
                }

                var customerDto = new CustomerDto
                {
                    Id = customer.Id,
                    DisclosureLevel = customer.DisclosureLevel,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Email = customer.Email,
                    Phone = customer.Phone,
                    CompanyName = customer.CompanyName,
                    StytchUserId = customer.StytchUserId,
                    CustomerNumber = customer.CustomerNumber,
                    EmailVerified = customer.EmailVerified,
                    CustomerSegment = customer.CustomerSegment,
                    LifetimeValue = customer.LifetimeValue,
                    Status = customer.Status,
                    LastActivity = customer.LastActivity,
                    CreatedAt = customer.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = customer.UpdatedAt ?? DateTime.MinValue
                };

                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer {CustomerId}", id);
                await _realTimeLogService.StreamErrorAsync("GetCustomer", ex.Message, ex);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new customer
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CustomerDto customerDto)
        {
            try
            {
                _logger.LogInformation("Creating new customer: {Email}", customerDto.Email);

                // Create new customer entity
                var customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    DisclosureLevel = customerDto.DisclosureLevel ?? "cold",
                    FirstName = customerDto.FirstName,
                    LastName = customerDto.LastName,
                    Email = customerDto.Email,
                    Phone = customerDto.Phone,
                    CompanyName = customerDto.CompanyName,
                    StytchUserId = customerDto.StytchUserId,
                    CustomerNumber = customerDto.CustomerNumber,
                    Status = customerDto.Status ?? "active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CustomerData = JsonDocument.Parse("{}"),
                    Preferences = JsonDocument.Parse("{}")
                };

                // Add to database
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                // Log structured business event
                _logger.LogCustomerRegistration(customer.Id.ToString(), customer.Email ?? "unknown");

                // Stream real-time log event
                await _realTimeLogService.StreamCustomerCreatedAsync(customer.Id.ToString(), customer.Email ?? "unknown");

                // Publish NATS message for staging synchronization
                await _customerMessageService.PublishCustomerCreatedAsync(customer);

                // Convert to DTO for response
                var responseDto = new CustomerDto
                {
                    Id = customer.Id,
                    DisclosureLevel = customer.DisclosureLevel,
                    VisitorFlag = customer.VisitorFlag ?? false,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Email = customer.Email,
                    Phone = customer.Phone,
                    StytchUserId = customer.StytchUserId,
                    EmailVerified = customer.EmailVerified ?? false,
                    CustomerSegment = customer.CustomerSegment,
                    LifetimeValue = customer.LifetimeValue ?? 0m,
                    AcquisitionChannel = customer.AcquisitionChannel,
                    MarketingConsent = customer.MarketingConsent ?? false,
                    DataProcessingConsent = customer.DataProcessingConsent ?? false,
                    ConsentDate = customer.ConsentDate,
                    Status = customer.Status,
                    FirstPurchaseDate = customer.FirstPurchaseDate ?? DateTime.MinValue,
                    LastActivity = customer.LastActivity ?? DateTime.MinValue,
                    CreatedAt = customer.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = customer.UpdatedAt ?? DateTime.MinValue
                };

                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer");
                await _realTimeLogService.StreamErrorAsync("CreateCustomer", ex.Message, ex);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing customer
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<CustomerDto>> UpdateCustomer(Guid id, [FromBody] CustomerDto customerDto)
        {
            try
            {
                _logger.LogInformation("Updating customer {CustomerId}", id);

                var existingCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existingCustomer == null)
                {
                    _logger.LogWarning("Customer not found for update: {CustomerId}", id);
                    return NotFound(new { error = "Customer not found", customerId = id });
                }

                // Update properties
                existingCustomer.DisclosureLevel = customerDto.DisclosureLevel ?? existingCustomer.DisclosureLevel;
                existingCustomer.VisitorFlag = customerDto.VisitorFlag;
                existingCustomer.FirstName = customerDto.FirstName;
                existingCustomer.LastName = customerDto.LastName;
                existingCustomer.Email = customerDto.Email;
                existingCustomer.Phone = customerDto.Phone;
                existingCustomer.StytchUserId = customerDto.StytchUserId ?? existingCustomer.StytchUserId;
                existingCustomer.EmailVerified = customerDto.EmailVerified;
                existingCustomer.CustomerSegment = customerDto.CustomerSegment;
                existingCustomer.LifetimeValue = customerDto.LifetimeValue;
                existingCustomer.AcquisitionChannel = customerDto.AcquisitionChannel ?? existingCustomer.AcquisitionChannel;
                existingCustomer.MarketingConsent = customerDto.MarketingConsent;
                existingCustomer.DataProcessingConsent = customerDto.DataProcessingConsent;
                existingCustomer.ConsentDate = customerDto.ConsentDate ?? existingCustomer.ConsentDate;
                existingCustomer.Status = customerDto.Status ?? existingCustomer.Status;
                existingCustomer.FirstPurchaseDate = customerDto.FirstPurchaseDate ?? existingCustomer.FirstPurchaseDate;
                existingCustomer.LastActivity = DateTime.UtcNow;
                existingCustomer.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Stream real-time log event
                await _realTimeLogService.StreamCustomerUpdatedAsync(existingCustomer.Id.ToString(), existingCustomer.Email ?? "unknown");

                // Publish NATS message for staging synchronization
                await _customerMessageService.PublishCustomerUpdatedAsync(existingCustomer);

                // Convert to DTO for response
                var responseDto = new CustomerDto
                {
                    Id = existingCustomer.Id,
                    DisclosureLevel = existingCustomer.DisclosureLevel,
                    VisitorFlag = existingCustomer.VisitorFlag ?? false,
                    FirstName = existingCustomer.FirstName,
                    LastName = existingCustomer.LastName,
                    Email = existingCustomer.Email,
                    Phone = existingCustomer.Phone,
                    StytchUserId = existingCustomer.StytchUserId,
                    EmailVerified = existingCustomer.EmailVerified ?? false,
                    CustomerSegment = existingCustomer.CustomerSegment,
                    LifetimeValue = existingCustomer.LifetimeValue ?? 0m,
                    AcquisitionChannel = existingCustomer.AcquisitionChannel,
                    MarketingConsent = existingCustomer.MarketingConsent ?? false,
                    DataProcessingConsent = existingCustomer.DataProcessingConsent ?? false,
                    ConsentDate = existingCustomer.ConsentDate,
                    Status = existingCustomer.Status,
                    FirstPurchaseDate = existingCustomer.FirstPurchaseDate ?? DateTime.MinValue,
                    LastActivity = existingCustomer.LastActivity ?? DateTime.MinValue,
                    CreatedAt = existingCustomer.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = existingCustomer.UpdatedAt ?? DateTime.MinValue
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer {CustomerId}", id);
                await _realTimeLogService.StreamErrorAsync("UpdateCustomer", ex.Message, ex);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a customer (soft delete by setting status to 'deleted')
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCustomer(Guid id)
        {
            try
            {
                _logger.LogInformation("Deleting customer {CustomerId}", id);

                var existingCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existingCustomer == null)
                {
                    _logger.LogWarning("Customer not found for deletion: {CustomerId}", id);
                    return NotFound(new { error = "Customer not found", customerId = id });
                }

                // Soft delete by updating status
                existingCustomer.Status = "deleted";
                existingCustomer.LastActivity = DateTime.UtcNow;
                existingCustomer.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Stream real-time log event
                await _realTimeLogService.StreamCustomerDeletedAsync(existingCustomer.Id.ToString(), existingCustomer.Email ?? "unknown");

                // Publish NATS message for staging synchronization
                await _customerMessageService.PublishCustomerDeletedAsync(existingCustomer.Id, existingCustomer.Email ?? "unknown");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting customer {CustomerId}", id);
                await _realTimeLogService.StreamErrorAsync("DeleteCustomer", ex.Message, ex);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Sync a specific customer to staging by publishing a NATS message
        /// </summary>
        [HttpPost("{id}/sync")]
        public async Task<ActionResult> SyncCustomer(Guid id)
        {
            try
            {
                _logger.LogInformation("Syncing customer {CustomerId} to staging", id);

                var existingCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existingCustomer == null)
                {
                    _logger.LogWarning("Customer {CustomerId} not found for sync", id);
                    return NotFound(new { message = "Customer not found" });
                }

                // Log the sync action
                await _realTimeLogService.StreamLogAsync("INFO", "CustomerMdm.Sync", 
                    $"Manual sync requested for customer {existingCustomer.Id} ({existingCustomer.Email})");

                // Publish NATS message for staging synchronization
                await _customerMessageService.PublishCustomerUpdatedAsync(existingCustomer);

                _logger.LogInformation("Successfully triggered sync for customer {CustomerId} ({CustomerEmail})", 
                    existingCustomer.Id, existingCustomer.Email);

                return Ok(new { 
                    message = "Customer sync initiated successfully",
                    customerId = existingCustomer.Id,
                    customerEmail = existingCustomer.Email 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing customer {CustomerId}", id);
                await _realTimeLogService.StreamErrorAsync("SyncCustomer", ex.Message, ex);
                return BadRequest(new { error = ex.Message });
            }
        }
        */
    }
}