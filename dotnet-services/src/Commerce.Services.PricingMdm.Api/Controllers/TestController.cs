using Microsoft.AspNetCore.Mvc;
using Commerce.Services.PricingMdm.Api.Services;

namespace Commerce.Services.PricingMdm.Api.Controllers;

/// <summary>
/// Test controller for demonstrating Google Translate functionality
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly ITranslationService _translationService;
    private readonly ILogger<TestController> _logger;

    public TestController(
        ITranslationService translationService,
        ILogger<TestController> logger)
    {
        _translationService = translationService;
        _logger = logger;
    }

    /// <summary>
    /// Test single text translation
    /// </summary>
    [HttpPost("translate")]
    public async Task<ActionResult<TranslationTestResponse>> TestTranslate([FromBody] TranslationTestRequest request)
    {
        try
        {
            _logger.LogInformation("Testing translation from {SourceLang} to {TargetLang}: {Text}", 
                request.SourceLanguage, request.TargetLanguage, 
                request.Text.Length > 50 ? request.Text.Substring(0, 50) + "..." : request.Text);

            var translatedText = await _translationService.TranslateAsync(
                request.Text, 
                request.SourceLanguage, 
                request.TargetLanguage);

            return Ok(new TranslationTestResponse
            {
                OriginalText = request.Text,
                TranslatedText = translatedText,
                SourceLanguage = request.SourceLanguage,
                TargetLanguage = request.TargetLanguage,
                Success = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing translation");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Test batch text translation
    /// </summary>
    [HttpPost("translate-batch")]
    public async Task<ActionResult<BatchTranslationTestResponse>> TestBatchTranslate([FromBody] BatchTranslationTestRequest request)
    {
        try
        {
            _logger.LogInformation("Testing batch translation from {SourceLang} to {TargetLang}: {Count} texts", 
                request.SourceLanguage, request.TargetLanguage, request.Texts.Count);

            var translations = await _translationService.TranslateBatchAsync(
                request.Texts, 
                request.SourceLanguage, 
                request.TargetLanguage);

            return Ok(new BatchTranslationTestResponse
            {
                Translations = translations,
                SourceLanguage = request.SourceLanguage,
                TargetLanguage = request.TargetLanguage,
                Success = true,
                Count = translations.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing batch translation");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get translation service status and capabilities
    /// </summary>
    [HttpGet("translation-status")]
    public async Task<ActionResult<TranslationStatusResponse>> GetTranslationStatus()
    {
        try
        {
            // Test a simple translation to verify the service is working
            var testResult = await _translationService.TranslateAsync("Hello", "en", "es");
            
            return Ok(new TranslationStatusResponse
            {
                IsWorking = !string.IsNullOrEmpty(testResult),
                ServiceType = _translationService.GetType().Name,
                TestTranslation = testResult,
                SupportedLanguages = GetSupportedLanguages(),
                HasApiKey = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GOOGLE_TRANSLATE_API_KEY"))
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking translation service status");
            return Ok(new TranslationStatusResponse
            {
                IsWorking = false,
                ServiceType = _translationService.GetType().Name,
                Error = ex.Message,
                SupportedLanguages = GetSupportedLanguages(),
                HasApiKey = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GOOGLE_TRANSLATE_API_KEY"))
            });
        }
    }

    /// <summary>
    /// Test localization workflow simulation
    /// </summary>
    [HttpPost("simulate-localization")]
    public async Task<ActionResult<LocalizationSimulationResponse>> SimulateLocalization([FromBody] LocalizationSimulationRequest request)
    {
        try
        {
            _logger.LogInformation("Simulating localization workflow for product: {ProductName}", request.ProductName);

            var results = new List<LocalizedContent>();

            foreach (var targetLanguage in request.TargetLanguages)
            {
                var localizedContent = new LocalizedContent
                {
                    Language = targetLanguage,
                    Name = await _translationService.TranslateAsync(request.ProductName, request.SourceLanguage, targetLanguage),
                    Description = await _translationService.TranslateAsync(request.ProductDescription, request.SourceLanguage, targetLanguage),
                    ShortDescription = await _translationService.TranslateAsync(request.ProductShortDescription, request.SourceLanguage, targetLanguage)
                };

                // Simulate processing time
                await Task.Delay(100);

                results.Add(localizedContent);
            }

            return Ok(new LocalizationSimulationResponse
            {
                OriginalProduct = new LocalizedContent
                {
                    Language = request.SourceLanguage,
                    Name = request.ProductName,
                    Description = request.ProductDescription,
                    ShortDescription = request.ProductShortDescription
                },
                LocalizedVersions = results,
                Success = true,
                ProcessingTimeMs = results.Count * 100
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating localization");
            return BadRequest(new { error = ex.Message });
        }
    }

    private List<LanguageInfo> GetSupportedLanguages()
    {
        return new List<LanguageInfo>
        {
            new() { Code = "en", Name = "English" },
            new() { Code = "es", Name = "Spanish" },
            new() { Code = "fr", Name = "French" },
            new() { Code = "de", Name = "German" },
            new() { Code = "it", Name = "Italian" },
            new() { Code = "pt", Name = "Portuguese" },
            new() { Code = "ru", Name = "Russian" },
            new() { Code = "ja", Name = "Japanese" },
            new() { Code = "ko", Name = "Korean" },
            new() { Code = "zh", Name = "Chinese" },
            new() { Code = "ar", Name = "Arabic" },
            new() { Code = "hi", Name = "Hindi" },
            new() { Code = "th", Name = "Thai" },
            new() { Code = "vi", Name = "Vietnamese" },
            new() { Code = "nl", Name = "Dutch" },
            new() { Code = "sv", Name = "Swedish" },
            new() { Code = "da", Name = "Danish" },
            new() { Code = "no", Name = "Norwegian" },
            new() { Code = "fi", Name = "Finnish" },
            new() { Code = "pl", Name = "Polish" }
        };
    }
}

#region DTOs

public class TranslationTestRequest
{
    public string Text { get; set; } = string.Empty;
    public string SourceLanguage { get; set; } = "en";
    public string TargetLanguage { get; set; } = "es";
}

public class TranslationTestResponse
{
    public string OriginalText { get; set; } = string.Empty;
    public string TranslatedText { get; set; } = string.Empty;
    public string SourceLanguage { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;
    public bool Success { get; set; }
}

public class BatchTranslationTestRequest
{
    public List<string> Texts { get; set; } = new();
    public string SourceLanguage { get; set; } = "en";
    public string TargetLanguage { get; set; } = "es";
}

public class BatchTranslationTestResponse
{
    public Dictionary<string, string> Translations { get; set; } = new();
    public string SourceLanguage { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;
    public bool Success { get; set; }
    public int Count { get; set; }
}

public class TranslationStatusResponse
{
    public bool IsWorking { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string? TestTranslation { get; set; }
    public string? Error { get; set; }
    public List<LanguageInfo> SupportedLanguages { get; set; } = new();
    public bool HasApiKey { get; set; }
}

public class LanguageInfo
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class LocalizationSimulationRequest
{
    public string ProductName { get; set; } = string.Empty;
    public string ProductDescription { get; set; } = string.Empty;
    public string ProductShortDescription { get; set; } = string.Empty;
    public string SourceLanguage { get; set; } = "en";
    public List<string> TargetLanguages { get; set; } = new();
}

public class LocalizationSimulationResponse
{
    public LocalizedContent OriginalProduct { get; set; } = new();
    public List<LocalizedContent> LocalizedVersions { get; set; } = new();
    public bool Success { get; set; }
    public int ProcessingTimeMs { get; set; }
}

public class LocalizedContent
{
    public string Language { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
}

#endregion