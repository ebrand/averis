using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Linq;
using Commerce.Services.PricingMdm.Api.Data;
using Commerce.Services.PricingMdm.Api.Models;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Service for generating multi-language content for products
/// </summary>
public class MultiLanguageContentService : IMultiLanguageContentService
{
    private readonly PricingDbContext _context;
    private readonly ILogger<MultiLanguageContentService> _logger;
    private readonly ITranslationService _translationService;

    public MultiLanguageContentService(
        PricingDbContext context,
        ILogger<MultiLanguageContentService> logger,
        ITranslationService translationService)
    {
        _context = context;
        _logger = logger;
        _translationService = translationService;
    }

    /// <summary>
    /// Generate multi-language content for a product
    /// </summary>
    public async Task<List<string>> GenerateMultiLanguageContentAsync(Guid productId, string sourceLocale, List<string> targetLocales)
    {
        _logger.LogInformation("Generating multi-language content for product {ProductId} from {SourceLocale} to {TargetCount} locales", 
            productId, sourceLocale, targetLocales.Count);

        var generatedLanguages = new List<string>();

        try
        {
            // Get the source product content
            var sourceContent = await GetProductContentAsync(productId, sourceLocale);
            if (sourceContent == null)
            {
                throw new InvalidOperationException($"Source content not found for product {productId} in locale {sourceLocale}");
            }

            // Generate content for each target locale
            foreach (var targetLocale in targetLocales)
            {
                try
                {
                    await GenerateContentForLocaleAsync(productId, sourceContent, sourceLocale, targetLocale);
                    generatedLanguages.Add(targetLocale);
                    
                    _logger.LogDebug("Generated content for locale {TargetLocale}", targetLocale);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate content for locale {TargetLocale}", targetLocale);
                    // Continue with other locales
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully generated content for {GeneratedCount} out of {RequestedCount} locales", 
                generatedLanguages.Count, targetLocales.Count);

            return generatedLanguages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating multi-language content for product {ProductId}", productId);
            throw;
        }
    }

    private async Task<ProductContent?> GetProductContentAsync(Guid productId, string localeCode)
    {
        // First try to get existing content in the source locale
        var existingContent = await _context.ProductContents
            .Include(pc => pc.Locale)
            .FirstOrDefaultAsync(pc => pc.ProductId == productId && pc.Locale.Code == localeCode);

        if (existingContent != null)
        {
            return existingContent;
        }

        // If no existing content and this is for English content, get it from the Product Staging API
        if (localeCode.StartsWith("en_"))
        {
            try
            {
                using var httpClient = new HttpClient();
                var productResponse = await httpClient.GetAsync($"http://localhost:6002/api/products/{productId}");
                if (!productResponse.IsSuccessStatusCode)
                {
                    return null;
                }
                
                var productJson = await productResponse.Content.ReadAsStringAsync();
                var productData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(productJson);
                
                if (!productData.TryGetProperty("name", out var nameElement) ||
                    !productData.TryGetProperty("description", out var descElement))
                {
                    return null;
                }

                var productName = nameElement.GetString() ?? "Unnamed Product";
                var productDescription = descElement.GetString() ?? "No description available";
                
                // Get longDescription if available, otherwise use description
                var longDescription = productDescription;
                if (productData.TryGetProperty("longDescription", out var longDescElement))
                {
                    longDescription = longDescElement.GetString() ?? productDescription;
                }

                // Create virtual content from product data without requiring a locale record
                return new ProductContent
                {
                    ProductId = productId,
                    LocaleId = Guid.Empty, // Virtual locale ID since we don't store English locales
                    Locale = null, // No locale entity needed for English source content
                    Name = productName,
                    Description = longDescription,
                    ShortDescription = productDescription.Length > 100 
                        ? productDescription.Substring(0, 100) + "..." 
                        : productDescription,
                    Keywords = ExtractKeywords(productName, longDescription).Split(',', StringSplitOptions.RemoveEmptyEntries).Select(k => k.Trim()).ToArray(),
                    MetaTitle = productName,
                    MetaDescription = longDescription.Length > 160 
                        ? longDescription.Substring(0, 160) + "..." 
                        : longDescription
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch English product content from Product Staging API for product {ProductId}", productId);
                return null;
            }
        }

        // For non-English locales, return null if no existing content
        return null;
    }

    private async Task GenerateContentForLocaleAsync(Guid productId, ProductContent sourceContent, string sourceLocale, string targetLocale)
    {
        // Get target locale information
        var targetLocaleEntity = await _context.Locales.FirstOrDefaultAsync(l => l.Code == targetLocale);
        if (targetLocaleEntity == null)
        {
            throw new InvalidOperationException($"Target locale {targetLocale} not found");
        }

        // Check if content already exists for target locale
        var existingContent = await _context.ProductContents
            .FirstOrDefaultAsync(pc => pc.ProductId == productId && pc.LocaleId == targetLocaleEntity.Id);

        var isNewContent = existingContent == null;
        var targetContent = existingContent ?? new ProductContent
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            LocaleId = targetLocaleEntity.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Translate content fields
        var sourceLanguage = GetLanguageFromLocale(sourceLocale);
        var targetLanguage = GetLanguageFromLocale(targetLocale);

        if (sourceLanguage != targetLanguage)
        {
            // Translate name
            targetContent.Name = await _translationService.TranslateAsync(
                sourceContent.Name, sourceLanguage, targetLanguage);

            // Translate description
            targetContent.Description = await _translationService.TranslateAsync(
                sourceContent.Description, sourceLanguage, targetLanguage);

            // Translate short description
            targetContent.ShortDescription = await _translationService.TranslateAsync(
                sourceContent.ShortDescription, sourceLanguage, targetLanguage);

            // Translate meta title
            targetContent.MetaTitle = await _translationService.TranslateAsync(
                sourceContent.MetaTitle, sourceLanguage, targetLanguage);

            // Translate meta description
            targetContent.MetaDescription = await _translationService.TranslateAsync(
                sourceContent.MetaDescription, sourceLanguage, targetLanguage);

            // Translate keywords (keeping them as individual translations)
            var translatedKeywords = new List<string>();
            if (sourceContent.Keywords != null && sourceContent.Keywords.Length > 0)
            {
                foreach (var keyword in sourceContent.Keywords)
                {
                    var translatedKeyword = await _translationService.TranslateAsync(
                        keyword.Trim(), sourceLanguage, targetLanguage);
                    translatedKeywords.Add(translatedKeyword);
                }
            }
            targetContent.Keywords = translatedKeywords.ToArray();
        }
        else
        {
            // Same language, copy content
            targetContent.Name = sourceContent.Name;
            targetContent.Description = sourceContent.Description;
            targetContent.ShortDescription = sourceContent.ShortDescription;
            targetContent.MetaTitle = sourceContent.MetaTitle;
            targetContent.MetaDescription = sourceContent.MetaDescription;
            targetContent.Keywords = sourceContent.Keywords;
        }

        // Apply locale-specific formatting
        ApplyLocaleSpecificFormatting(targetContent, targetLocale);

        targetContent.UpdatedAt = DateTime.UtcNow;

        if (isNewContent)
        {
            _context.ProductContents.Add(targetContent);
        }
    }

    private string GetLanguageFromLocale(string locale)
    {
        // Extract language code from locale (e.g., "en_US" -> "en")
        return locale.Split('_')[0].ToLower();
    }

    private string ExtractKeywords(string name, string description)
    {
        var keywords = new HashSet<string>();
        
        // Extract words from name
        var nameWords = name.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Select(w => w.Trim().ToLower());
        
        foreach (var word in nameWords)
        {
            keywords.Add(word);
        }

        // Extract significant words from description
        var descWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 4 && !IsStopWord(w))
            .Take(5) // Limit to 5 additional keywords
            .Select(w => w.Trim().ToLower());

        foreach (var word in descWords)
        {
            keywords.Add(word);
        }

        return string.Join(", ", keywords);
    }

    private bool IsStopWord(string word)
    {
        var stopWords = new HashSet<string> 
        { 
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "this", "that", "these", "those", "is", "are", "was", "were", "be", "been",
            "have", "has", "had", "will", "would", "could", "should", "may", "might"
        };
        
        return stopWords.Contains(word.ToLower());
    }

    private void ApplyLocaleSpecificFormatting(ProductContent content, string locale)
    {
        // Apply locale-specific formatting rules
        switch (locale.ToLower())
        {
            case var l when l.StartsWith("de_"):
                // German: Capitalize nouns, formal tone
                content.Name = CapitalizeGermanNouns(content.Name);
                break;
            
            case var l when l.StartsWith("fr_"):
                // French: Ensure proper accents and formal language
                content.Name = content.Name; // Would apply French-specific rules
                break;
            
            case var l when l.StartsWith("es_"):
                // Spanish: Ensure proper accents and formal/informal based on region
                content.Name = content.Name; // Would apply Spanish-specific rules
                break;
            
            case var l when l.StartsWith("ja_"):
                // Japanese: Ensure proper honorifics and formal language
                content.Name = content.Name; // Would apply Japanese-specific rules
                break;
            
            case var l when l.StartsWith("zh_"):
                // Chinese: Ensure proper traditional/simplified based on region
                content.Name = content.Name; // Would apply Chinese-specific rules
                break;
        }

        // Ensure meta descriptions are appropriate length for locale
        if (content.MetaDescription.Length > 160)
        {
            content.MetaDescription = content.MetaDescription.Substring(0, 157) + "...";
        }

        // Ensure meta titles are appropriate length
        if (content.MetaTitle.Length > 60)
        {
            content.MetaTitle = content.MetaTitle.Substring(0, 57) + "...";
        }
    }

    private string CapitalizeGermanNouns(string text)
    {
        // Simplified German noun capitalization
        // In a real implementation, this would use proper German linguistic rules
        return text; // Placeholder
    }
}

/// <summary>
/// Translation service interface
/// </summary>
public interface ITranslationService
{
    Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage);
    Task<Dictionary<string, string>> TranslateBatchAsync(List<string> texts, string sourceLanguage, string targetLanguage);
}

/// <summary>
/// Mock translation service
/// In production, this would integrate with Google Translate, Azure Translator, or similar service
/// </summary>
public class MockTranslationService : ITranslationService
{
    private readonly ILogger<MockTranslationService> _logger;
    private readonly Dictionary<string, Dictionary<string, string>> _translations;

    public MockTranslationService(ILogger<MockTranslationService> logger)
    {
        _logger = logger;
        
        // Mock translations for common product terms
        _translations = new Dictionary<string, Dictionary<string, string>>
        {
            ["en"] = new Dictionary<string, string>
            {
                ["es"] = "Spanish translation",
                ["fr"] = "French translation", 
                ["de"] = "German translation",
                ["it"] = "Italian translation",
                ["pt"] = "Portuguese translation",
                ["ru"] = "Russian translation",
                ["ja"] = "Japanese translation",
                ["ko"] = "Korean translation",
                ["zh"] = "Chinese translation"
            }
        };
    }

    public async Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage)
    {
        if (string.IsNullOrEmpty(text) || sourceLanguage == targetLanguage)
        {
            return text;
        }

        await Task.Delay(50); // Simulate API call

        _logger.LogDebug("Translating text from {SourceLang} to {TargetLang}: {Text}", 
            sourceLanguage, targetLanguage, text.Length > 50 ? text.Substring(0, 50) + "..." : text);

        // For demo purposes, append language indicator to original text
        return $"{text} [{targetLanguage.ToUpper()}]";
    }

    public async Task<Dictionary<string, string>> TranslateBatchAsync(List<string> texts, string sourceLanguage, string targetLanguage)
    {
        var results = new Dictionary<string, string>();
        
        foreach (var text in texts)
        {
            results[text] = await TranslateAsync(text, sourceLanguage, targetLanguage);
        }
        
        return results;
    }
}

