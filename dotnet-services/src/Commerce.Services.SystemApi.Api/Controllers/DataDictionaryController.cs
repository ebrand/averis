using Microsoft.AspNetCore.Mvc;

namespace Commerce.Services.SystemApi.Api.Controllers;

/// <summary>
/// Controller for managing data dictionary metadata for the Averis platform
/// </summary>
[ApiController]
[Route("api/data-dictionary")]
public class DataDictionaryController : ControllerBase
{
    private readonly ILogger<DataDictionaryController> _logger;

    public DataDictionaryController(ILogger<DataDictionaryController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get data dictionary entries for all schemas
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<DataDictionaryResponse>> GetDataDictionary([FromQuery] string? schema = null)
    {
        try
        {
            // For now, return a static data dictionary that matches the expected structure
            // In a real implementation, this would come from a database or configuration
            var dataDictionary = GetStaticDataDictionary();

            if (!string.IsNullOrEmpty(schema))
            {
                dataDictionary = dataDictionary.Where(d => d.Schemas.Contains(schema, StringComparer.OrdinalIgnoreCase)).ToList();
            }

            var response = new DataDictionaryResponse
            {
                DataDictionary = dataDictionary,
                TotalCount = dataDictionary.Count,
                Schema = schema,
                LastUpdated = DateTime.UtcNow
            };

            _logger.LogInformation("Retrieved {Count} data dictionary entries for schema: {Schema}", dataDictionary.Count, schema ?? "all");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving data dictionary");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get data dictionary categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<DataDictionaryCategoriesResponse>> GetCategories()
    {
        try
        {
            var categories = new[]
            {
                "Core Product Information",
                "Product Classification", 
                "Pricing & Financial",
                "License & Permissions",
                "Sales & Marketing",
                "Operations & Fulfillment",
                "Contract Management",
                "System & Audit"
            };

            var response = new DataDictionaryCategoriesResponse
            {
                Categories = categories.ToList(),
                LastUpdated = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving data dictionary categories");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private List<DataDictionaryEntry> GetStaticDataDictionary()
    {
        return new List<DataDictionaryEntry>
        {
            // Core Product Information
            new DataDictionaryEntry
            {
                Id = 1,
                ColumnName = "id",
                DisplayName = "Product ID",
                DataType = "UUID",
                RequiredForActive = true,
                MaintenanceRole = "system",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Unique identifier for the product",
                Category = "Core Product Information",
                IsSystemField = true,
                IsEditable = false,
                SortOrder = 1
            },
            new DataDictionaryEntry
            {
                Id = 2,
                ColumnName = "sku",
                DisplayName = "SKU",
                DataType = "string",
                RequiredForActive = true,
                MaintenanceRole = "product_marketing",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Stock Keeping Unit - unique product identifier",
                Category = "Core Product Information",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 2
            },
            new DataDictionaryEntry
            {
                Id = 3,
                ColumnName = "name",
                DisplayName = "Product Name",
                DataType = "string",
                RequiredForActive = true,
                MaintenanceRole = "product_marketing",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Display name for the product",
                Category = "Core Product Information",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 3
            },
            new DataDictionaryEntry
            {
                Id = 4,
                ColumnName = "description",
                DisplayName = "Description",
                DataType = "text",
                RequiredForActive = true,
                MaintenanceRole = "product_marketing",
                Schemas = new[] { "ProductMDM", "Ecommerce" },
                Description = "Product description for marketing and sales",
                Category = "Core Product Information",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 4
            },
            // Pricing & Financial
            new DataDictionaryEntry
            {
                Id = 5,
                ColumnName = "base_price",
                DisplayName = "Base Price",
                DataType = "decimal",
                RequiredForActive = true,
                MaintenanceRole = "product_finance",
                Schemas = new[] { "ProductMDM", "PricingMDM" },
                Description = "Base pricing for the product before any discounts",
                Category = "Pricing & Financial",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 5
            },
            new DataDictionaryEntry
            {
                Id = 6,
                ColumnName = "cost_price",
                DisplayName = "Cost Price",
                DataType = "decimal",
                RequiredForActive = false,
                MaintenanceRole = "product_finance",
                Schemas = new[] { "ProductMDM" },
                Description = "Internal cost of the product",
                Category = "Pricing & Financial",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 6
            },
            // License & Permissions
            new DataDictionaryEntry
            {
                Id = 7,
                ColumnName = "license_required_flag",
                DisplayName = "License Required",
                DataType = "boolean",
                RequiredForActive = true,
                MaintenanceRole = "product_legal",
                Schemas = new[] { "ProductMDM", "Ecommerce" },
                Description = "Whether the product requires a license to use",
                Category = "License & Permissions",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 7
            },
            // Sales & Marketing
            new DataDictionaryEntry
            {
                Id = 8,
                ColumnName = "web_display_flag",
                DisplayName = "Web Display",
                DataType = "boolean",
                RequiredForActive = true,
                MaintenanceRole = "product_salesops",
                Schemas = new[] { "ProductMDM", "Ecommerce" },
                Description = "Whether the product should be displayed on the website",
                Category = "Sales & Marketing",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 8
            },
            // Operations & Fulfillment
            new DataDictionaryEntry
            {
                Id = 9,
                ColumnName = "can_be_fulfilled_flag",
                DisplayName = "Can Be Fulfilled",
                DataType = "boolean",
                RequiredForActive = true,
                MaintenanceRole = "product_salesops",
                Schemas = new[] { "ProductMDM" },
                Description = "Whether the product can be fulfilled through standard processes",
                Category = "Operations & Fulfillment",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 9
            },
            // Contract Management
            new DataDictionaryEntry
            {
                Id = 10,
                ColumnName = "contract_item_flag",
                DisplayName = "Contract Item",
                DataType = "boolean",
                RequiredForActive = false,
                MaintenanceRole = "product_contracts",
                Schemas = new[] { "ProductMDM" },
                Description = "Whether the product is typically sold as part of a contract",
                Category = "Contract Management",
                IsSystemField = false,
                IsEditable = true,
                SortOrder = 10
            },
            // System & Audit
            new DataDictionaryEntry
            {
                Id = 11,
                ColumnName = "status",
                DisplayName = "Status",
                DataType = "enum",
                RequiredForActive = true,
                MaintenanceRole = "system",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Current status of the product (draft, active, inactive)",
                Category = "System & Audit",
                IsSystemField = true,
                IsEditable = false,
                SortOrder = 11
            },
            new DataDictionaryEntry
            {
                Id = 12,
                ColumnName = "created_at",
                DisplayName = "Created At",
                DataType = "timestamp",
                RequiredForActive = true,
                MaintenanceRole = "system",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Timestamp when the product was created",
                Category = "System & Audit",
                IsSystemField = true,
                IsEditable = false,
                SortOrder = 12
            },
            new DataDictionaryEntry
            {
                Id = 13,
                ColumnName = "updated_at",
                DisplayName = "Updated At",
                DataType = "timestamp",
                RequiredForActive = true,
                MaintenanceRole = "system",
                Schemas = new[] { "ProductMDM", "PricingMDM", "Ecommerce" },
                Description = "Timestamp when the product was last updated",
                Category = "System & Audit",
                IsSystemField = true,
                IsEditable = false,
                SortOrder = 13
            }
        };
    }
}

#region DTOs

public class DataDictionaryResponse
{
    public List<DataDictionaryEntry> DataDictionary { get; set; } = new();
    public int TotalCount { get; set; }
    public string? Schema { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class DataDictionaryCategoriesResponse
{
    public List<string> Categories { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class DataDictionaryEntry
{
    public int Id { get; set; }
    public string ColumnName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool RequiredForActive { get; set; }
    public string MaintenanceRole { get; set; } = string.Empty;
    public string[] Schemas { get; set; } = Array.Empty<string>();
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsSystemField { get; set; }
    public bool IsEditable { get; set; }
    public int SortOrder { get; set; }
    public int? MaxLength { get; set; }
    public int? MinLength { get; set; }
    public string? ValidationPattern { get; set; }
    public string[]? AllowedValues { get; set; }

    // Helper methods for UI compatibility
    public bool InProductMdm => Schemas.Contains("ProductMDM", StringComparer.OrdinalIgnoreCase);
    public bool InPricingMdm => Schemas.Contains("PricingMDM", StringComparer.OrdinalIgnoreCase);
    public bool InEcommerce => Schemas.Contains("Ecommerce", StringComparer.OrdinalIgnoreCase);

    public string[] GetSchemas() => Schemas;
}

#endregion