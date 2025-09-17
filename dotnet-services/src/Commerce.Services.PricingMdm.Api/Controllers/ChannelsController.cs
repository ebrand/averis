using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// API Controller for Sales Channels (Market Segments)
/// Provides sales channel data for catalog creation forms
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ChannelsController : ControllerBase
{
    private readonly PricingDbContext _context;
    private readonly ILogger<ChannelsController> _logger;

    public ChannelsController(PricingDbContext context, ILogger<ChannelsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active sales channels (market segments)
    /// </summary>
    /// <returns>List of sales channels with id, name, and code</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    public async Task<ActionResult<IEnumerable<object>>> GetChannels()
    {
        try
        {
            _logger.LogInformation("Getting all active sales channels");

            var channels = await _context.MarketSegments
                .Where(ms => ms.IsActive)
                .OrderBy(ms => ms.Name)
                .Select(ms => new 
                {
                    id = ms.Id,
                    name = ms.Name,
                    code = ms.Code,
                    description = ms.Description
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} active sales channels", channels.Count);
            return Ok(channels);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales channels");
            return StatusCode(500, new { error = "Failed to retrieve sales channels", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a specific sales channel by ID
    /// </summary>
    /// <param name="id">Sales channel ID</param>
    /// <returns>Sales channel details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<object>> GetChannel(Guid id)
    {
        try
        {
            _logger.LogInformation("Getting sales channel {ChannelId}", id);

            var channel = await _context.MarketSegments
                .Where(ms => ms.Id == id && ms.IsActive)
                .Select(ms => new 
                {
                    id = ms.Id,
                    name = ms.Name,
                    code = ms.Code,
                    description = ms.Description,
                    createdAt = ms.CreatedAt,
                    updatedAt = ms.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (channel == null)
            {
                _logger.LogWarning("Sales channel {ChannelId} not found", id);
                return NotFound(new { error = "Sales channel not found", channelId = id });
            }

            return Ok(channel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales channel {ChannelId}", id);
            return StatusCode(500, new { error = "Failed to retrieve sales channel", message = ex.Message });
        }
    }
}