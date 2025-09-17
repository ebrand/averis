using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.Shared.Data;
using Commerce.Services.Shared.Models.DTOs;
using Commerce.Services.Shared.Models.Entities;

namespace Commerce.Services.ProductMdm.Api.Controllers;

/// <summary>
/// Data Dictionary API Controller - Metadata service for product schema definitions
/// Provides form field metadata, validation rules, and display properties
/// </summary>
[ApiController]
[Route("api/data-dictionary")]
[Produces("application/json")]
public class DataDictionaryController : ControllerBase
{
    private readonly ProductMdmDbContext _context;
    private readonly ILogger<DataDictionaryController> _logger;

    public DataDictionaryController(ProductMdmDbContext context, ILogger<DataDictionaryController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all data dictionary entries with optional filtering
    /// </summary>
    /// <param name="category">Filter by category</param>
    /// <param name="maintenanceRole">Filter by maintenance role</param>
    /// <param name="schema">Filter by schema presence (ProductMDM, PricingMDM, Ecommerce)</param>
    /// <param name="search">Search term for column name, display name, or description</param>
    /// <param name="requiredOnly">Return only fields required for active validation</param>
    /// <returns>Array of data dictionary entries</returns>
    [HttpGet]
    [ProducesResponseType(typeof(DataDictionaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DataDictionaryResponse>> GetDataDictionary(
        [FromQuery] string? category = null,
        [FromQuery] string? maintenanceRole = null,
        [FromQuery] string? schema = null,
        [FromQuery] string? search = null,
        [FromQuery] bool requiredOnly = false)
    {
        try
        {
            _logger.LogInformation("Getting data dictionary entries - Category: {Category}, MaintenanceRole: {MaintenanceRole}, Schema: {Schema}, Search: {Search}, RequiredOnly: {RequiredOnly}",
                category, maintenanceRole, schema, search, requiredOnly);

            var query = _context.DataDictionary.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(category) && category != "all")
            {
                query = query.Where(d => d.Category == category);
            }

            if (!string.IsNullOrEmpty(maintenanceRole) && maintenanceRole != "all")
            {
                query = query.Where(d => d.MaintenanceRole == maintenanceRole);
            }

            if (!string.IsNullOrEmpty(schema) && schema != "all")
            {
                query = schema switch
                {
                    "ProductMDM" => query.Where(d => d.InProductMdm),
                    "PricingMDM" => query.Where(d => d.InPricingMdm),
                    "Ecommerce" => query.Where(d => d.InEcommerce),
                    _ => query
                };
            }

            if (requiredOnly)
            {
                query = query.Where(d => d.RequiredForActive);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(d => 
                    d.ColumnName.ToLower().Contains(searchLower) ||
                    d.DisplayName.ToLower().Contains(searchLower) ||
                    (d.Description != null && d.Description.ToLower().Contains(searchLower)));
            }

            // Order by sort order and column name
            query = query.OrderBy(d => d.SortOrder).ThenBy(d => d.ColumnName);

            var dataDictionaryEntries = await query.ToListAsync();

            var dataDictionaryDtos = dataDictionaryEntries.Select(MapToDto).ToList();

            var response = new DataDictionaryResponse
            {
                DataDictionary = dataDictionaryDtos,
                Source = "api"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data dictionary entries");
            return BadRequest(new { error = "Failed to fetch data dictionary" });
        }
    }

    /// <summary>
    /// Get all unique categories from data dictionary
    /// </summary>
    /// <returns>Array of category names</returns>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(CategoriesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CategoriesResponse>> GetCategories()
    {
        try
        {
            _logger.LogInformation("Getting data dictionary categories");

            var categories = await _context.DataDictionary
                .Select(d => d.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            var response = new CategoriesResponse
            {
                Categories = categories,
                Source = "api"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data dictionary categories");
            return BadRequest(new { error = "Failed to fetch categories" });
        }
    }

    /// <summary>
    /// Get validation rules for all fields
    /// </summary>
    /// <returns>Dictionary of validation rules by column name</returns>
    [HttpGet("validation-rules")]
    [ProducesResponseType(typeof(ValidationRulesResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ValidationRulesResponse>> GetValidationRules()
    {
        try
        {
            _logger.LogInformation("Getting data dictionary validation rules");

            var entries = await _context.DataDictionary
                .OrderBy(d => d.ColumnName)
                .ToListAsync();

            var validationRules = entries.ToDictionary(
                entry => entry.ColumnName,
                entry => new ValidationRule
                {
                    Required = entry.RequiredForActive,
                    MaxLength = entry.MaxLength,
                    MinLength = entry.MinLength,
                    Pattern = entry.ValidationPattern,
                    AllowedValues = entry.AllowedValues,
                    DataType = entry.DataType
                });

            var response = new ValidationRulesResponse
            {
                ValidationRules = validationRules,
                Source = "api"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data dictionary validation rules");
            return BadRequest(new { error = "Failed to fetch validation rules" });
        }
    }

    /// <summary>
    /// Get single data dictionary entry by ID
    /// </summary>
    /// <param name="id">Data dictionary entry ID</param>
    /// <returns>Data dictionary entry</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DataDictionaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DataDictionaryDto>> GetDataDictionaryEntry(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting data dictionary entry by ID: {Id}", id);

            var entry = await _context.DataDictionary.FindAsync(id);
            
            if (entry == null)
            {
                return NotFound(new { error = "Data dictionary entry not found" });
            }

            return Ok(MapToDto(entry));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data dictionary entry {Id}", id);
            return BadRequest(new { error = "Failed to fetch data dictionary entry" });
        }
    }

    /// <summary>
    /// Health check endpoint for Data Dictionary API
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
            service = "data-dictionary-api",
            description = "Metadata service for product schema definitions"
        });
    }

    private static DataDictionaryDto MapToDto(DataDictionary entry)
    {
        return new DataDictionaryDto
        {
            Id = entry.Id,
            ColumnName = entry.ColumnName,
            DisplayName = entry.DisplayName,
            DataType = entry.DataType,
            Description = entry.Description,
            Category = entry.Category,
            RequiredForActive = entry.RequiredForActive,
            MaxLength = entry.MaxLength,
            MinLength = entry.MinLength,
            ValidationPattern = entry.ValidationPattern,
            AllowedValues = entry.AllowedValues,
            MaintenanceRole = entry.MaintenanceRole,
            InProductMdm = entry.InProductMdm,
            InPricingMdm = entry.InPricingMdm,
            InEcommerce = entry.InEcommerce,
            SortOrder = entry.SortOrder,
            IsSystemField = entry.IsSystemField,
            IsEditable = entry.IsEditable,
            CreatedAt = entry.CreatedAt,
            UpdatedAt = entry.UpdatedAt,
            CreatedBy = entry.CreatedBy,
            UpdatedBy = entry.UpdatedBy,
            Schemas = entry.GetSchemas(),
            MaintenanceRoleLabel = entry.GetMaintenanceRoleLabel()
        };
    }
}