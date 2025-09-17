using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Currencies
/// Provides currency data for catalog creation forms
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CurrenciesController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<CurrenciesController> _logger;

    public CurrenciesController(PricingDbContext context, ILogger<CurrenciesController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active currencies
    /// </summary>
    /// <returns>List of currencies with id, code, name, symbol, and decimal places</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetCurrencies()
    {
        try
        {
            _logger.LogInformation("Getting all active currencies");

            var currencies = await _context.Currencies
                .Where(c => c.IsActive)
                .OrderBy(c => c.Code)
                .Select(c => new 
                {
                    id = c.Id,
                    code = c.Code,
                    name = c.Name,
                    symbol = c.Symbol,
                    decimalPlaces = c.DecimalPlaces
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} active currencies", currencies.Count);
            return Ok(currencies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting currencies");
            return StatusCode(500, new { error = "Failed to retrieve currencies", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific currency by ID
    /// </summary>
    /// <param name="id">Currency ID</param>
    /// <returns>Currency details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetCurrency(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting currency {CurrencyId}", id);

            var currency = await _context.Currencies
                .Where(c => c.Id == id && c.IsActive)
                .Select(c => new 
                {
                    id = c.Id,
                    code = c.Code,
                    name = c.Name,
                    symbol = c.Symbol,
                    decimalPlaces = c.DecimalPlaces,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (currency == null)
            {
                _logger.LogWarning("Currency {CurrencyId} not found", id);
                return NotFound(new { error = "Currency not found", currencyId = id });
            }

            return Ok(currency);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting currency {CurrencyId}", id);
            return StatusCode(500, new { error = "Failed to retrieve currency", message = ex.Message });
        }
    }
}