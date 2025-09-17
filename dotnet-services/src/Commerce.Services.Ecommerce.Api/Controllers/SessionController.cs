using Microsoft.AspNetCore.Mvc;
using Commerce.Services.Ecommerce.Api.Services;
using Commerce.Services.Ecommerce.Api.Models;

namespace Commerce.Services.Ecommerce.Api.Controllers;

/// <summary>
/// Controller for session management and locale-aware catalog assignment
/// Handles automatic geographic targeting and user preference management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SessionController : ControllerBase
{
    private readonly ILocaleService _localeService;
    private readonly ILogger<SessionController> _logger;

    public SessionController(ILocaleService localeService, ILogger<SessionController> logger)
    {
        _localeService = localeService;
        _logger = logger;
    }

    /// <summary>
    /// Initialize a new user session with automatic catalog and locale assignment
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeSession([FromBody] SessionInitializationRequest request)
    {
        try
        {
            // Extract client IP if not provided
            if (string.IsNullOrEmpty(request.IpAddress))
            {
                request.IpAddress = GetClientIpAddress();
            }

            // Extract Accept-Language if not provided
            if (string.IsNullOrEmpty(request.AcceptLanguage))
            {
                request.AcceptLanguage = Request.Headers.AcceptLanguage.FirstOrDefault();
            }

            // Extract User-Agent if not provided
            if (string.IsNullOrEmpty(request.UserAgent))
            {
                request.UserAgent = Request.Headers.UserAgent.FirstOrDefault();
            }

            var sessionContext = await _localeService.InitializeSessionAsync(request);

            return Ok(new
            {
                success = true,
                data = new
                {
                    sessionId = sessionContext.SessionId,
                    assignedCatalog = sessionContext.AssignedCatalog,
                    locale = sessionContext.Locale,
                    assignmentMethod = sessionContext.AssignmentMethod,
                    preferences = sessionContext.Preferences
                },
                message = "Session initialized successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing session");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to initialize session",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get default catalog assignment for geographic and user criteria
    /// </summary>
    [HttpPost("catalog-assignment")]
    public async Task<IActionResult> GetCatalogAssignment([FromBody] CatalogAssignmentRequest request)
    {
        try
        {
            // Use client IP if not provided
            if (string.IsNullOrEmpty(request.IpAddress))
            {
                request.IpAddress = GetClientIpAddress();
            }

            var assignment = await _localeService.GetDefaultCatalogAsync(request);

            if (!assignment.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Catalog assignment failed",
                    message = assignment.Error
                });
            }

            return Ok(new
            {
                success = true,
                data = assignment,
                message = "Catalog assigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting catalog assignment");
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to assign catalog",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get available locales for a specific region
    /// </summary>
    [HttpGet("locales/{regionCode}")]
    public async Task<IActionResult> GetAvailableLocales(string regionCode)
    {
        try
        {
            var locales = await _localeService.GetAvailableLocalesAsync(regionCode);

            return Ok(new
            {
                success = true,
                data = locales,
                region = regionCode,
                count = locales.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available locales for region: {RegionCode}", regionCode);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to get available locales",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update session preferences (catalog and/or locale)
    /// </summary>
    [HttpPut("preferences/{sessionId}")]
    public async Task<IActionResult> UpdatePreferences(
        Guid sessionId,
        [FromBody] UpdatePreferencesRequest request)
    {
        try
        {
            var updatedSession = await _localeService.UpdateSessionPreferencesAsync(
                sessionId, 
                request.CatalogCode, 
                request.LocaleCode);

            return Ok(new
            {
                success = true,
                data = updatedSession,
                message = "Preferences updated successfully"
            });
        }
        catch (NotImplementedException)
        {
            return StatusCode(501, new
            {
                success = false,
                error = "Session storage not implemented",
                message = "Session preference updates require persistent storage implementation"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating session preferences for {SessionId}", sessionId);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to update preferences",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get client IP address from request headers or connection
    /// </summary>
    private string GetClientIpAddress()
    {
        // Check various headers for the real IP address
        var headers = new[]
        {
            "CF-Connecting-IP", // Cloudflare
            "True-Client-IP",   // Cloudflare Enterprise
            "X-Forwarded-For",  // Standard forwarded header
            "X-Real-IP",        // Nginx
            "X-Forwarded",
            "Forwarded-For",
            "Forwarded"
        };

        foreach (var header in headers)
        {
            if (Request.Headers.TryGetValue(header, out var value))
            {
                var ip = value.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(ip) && ip != "unknown")
                {
                    return ip;
                }
            }
        }

        // Fallback to connection remote IP
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}

/// <summary>
/// Request model for updating session preferences
/// </summary>
public class UpdatePreferencesRequest
{
    public string? CatalogCode { get; set; }
    public string? LocaleCode { get; set; }
}