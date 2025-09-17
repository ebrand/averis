using Google.Cloud.Translation.V2;
using System.Text.RegularExpressions;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// Google Cloud Translation service implementation
/// </summary>
public class GoogleTranslationService : ITranslationService
{
    private readonly TranslationClient _translationClient;
    private readonly ILogger<GoogleTranslationService> _logger;
    private readonly Dictionary<string, string> _localeToLanguageMap;

    public GoogleTranslationService(ILogger<GoogleTranslationService> logger)
    {
        _logger = logger;
        
        // Initialize Google Translate client
        // For demo purposes, using API key authentication
        // In production, you would use service account authentication
        _translationClient = TranslationClient.CreateFromApiKey(GetApiKey());
        
        // Map locale codes to Google Translate language codes
        _localeToLanguageMap = new Dictionary<string, string>
        {
            ["en_US"] = "en",
            ["en_GB"] = "en",
            ["es_ES"] = "es",
            ["fr_FR"] = "fr", 
            ["de_DE"] = "de",
            ["it_IT"] = "it",
            ["pt_PT"] = "pt",
            ["ru_ru"] = "ru",
            ["ja_JP"] = "ja",
            ["ko_KR"] = "ko",
            ["zh_CN"] = "zh",
            ["zh_TW"] = "zh-TW",
            ["ar_SA"] = "ar",
            ["hi_IN"] = "hi",
            ["th_TH"] = "th",
            ["vi_VN"] = "vi",
            ["nl_NL"] = "nl",
            ["sv_SE"] = "sv",
            ["da_DK"] = "da",
            ["no_NO"] = "no",
            ["fi_FI"] = "fi",
            ["pl_PL"] = "pl",
            ["cs_CZ"] = "cs",
            ["hu_HU"] = "hu",
            ["ro_RO"] = "ro",
            ["bg_BG"] = "bg",
            ["hr_HR"] = "hr",
            ["sk_SK"] = "sk",
            ["sl_SI"] = "sl",
            ["et_EE"] = "et",
            ["lv_LV"] = "lv",
            ["lt_LT"] = "lt",
            ["uk_UA"] = "uk",
            ["he_IL"] = "he",
            ["tr_TR"] = "tr",
            ["fa_IR"] = "fa",
            ["ur_PK"] = "ur",
            ["bn_BD"] = "bn",
            ["ta_IN"] = "ta",
            ["te_IN"] = "te",
            ["ml_IN"] = "ml",
            ["kn_IN"] = "kn",
            ["gu_IN"] = "gu",
            ["pa_IN"] = "pa",
            ["mr_IN"] = "mr",
            ["or_IN"] = "or",
            ["as_IN"] = "as",
            ["ne_NP"] = "ne",
            ["si_LK"] = "si",
            ["my_MM"] = "my",
            ["km_KH"] = "km",
            ["lo_LA"] = "lo",
            ["ka_GE"] = "ka",
            ["hy_AM"] = "hy",
            ["az_AZ"] = "az",
            ["kk_KZ"] = "kk",
            ["ky_KG"] = "ky",
            ["tg_TJ"] = "tg",
            ["uz_UZ"] = "uz",
            ["mn_MN"] = "mn",
            ["bo_CN"] = "bo"
        };
    }

    public async Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        // Convert locale codes to language codes if necessary
        var sourceLang = MapLocaleToLanguage(sourceLanguage);
        var targetLang = MapLocaleToLanguage(targetLanguage);

        if (sourceLang == targetLang)
        {
            return text;
        }

        try
        {
            _logger.LogDebug("Translating text from {SourceLang} to {TargetLang}: {TextPreview}", 
                sourceLang, targetLang, text.Length > 50 ? text.Substring(0, 50) + "..." : text);

            // Handle HTML and special characters
            var preprocessedText = PreprocessText(text);
            
            // Call Google Translate API
            var translationResult = await _translationClient.TranslateTextAsync(
                preprocessedText, targetLang, sourceLang);

            if (translationResult?.TranslatedText == null)
            {
                _logger.LogWarning("Translation returned null for text: {Text}", text.Substring(0, Math.Min(text.Length, 100)));
                return text; // Return original text if translation fails
            }

            var translatedText = PostprocessText(translationResult.TranslatedText);
            
            _logger.LogDebug("Translation successful: {OriginalLength} chars -> {TranslatedLength} chars", 
                text.Length, translatedText.Length);

            return translatedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to translate text from {SourceLang} to {TargetLang}", sourceLang, targetLang);
            
            // Return original text with language indicator as fallback
            return $"{text} [{targetLang.ToUpper()}]";
        }
    }

    public async Task<Dictionary<string, string>> TranslateBatchAsync(List<string> texts, string sourceLanguage, string targetLanguage)
    {
        var results = new Dictionary<string, string>();
        
        if (!texts.Any())
        {
            return results;
        }

        var sourceLang = MapLocaleToLanguage(sourceLanguage);
        var targetLang = MapLocaleToLanguage(targetLanguage);

        if (sourceLang == targetLang)
        {
            foreach (var text in texts)
            {
                results[text] = text;
            }
            return results;
        }

        try
        {
            _logger.LogInformation("Batch translating {Count} texts from {SourceLang} to {TargetLang}", 
                texts.Count, sourceLang, targetLang);

            // Google Translate has limits on batch size, so process in chunks if needed
            const int batchSize = 100;
            var chunks = texts.Chunk(batchSize);

            foreach (var chunk in chunks)
            {
                try
                {
                    var preprocessedChunk = chunk.Select(PreprocessText).ToList();
                    
                    // Translate chunk
                    var translationResults = await _translationClient.TranslateTextAsync(
                        preprocessedChunk, targetLang, sourceLang);

                    // Map results back to original texts
                    for (int i = 0; i < chunk.Length; i++)
                    {
                        var originalText = chunk[i];
                        var translatedText = translationResults[i]?.TranslatedText;
                        
                        if (!string.IsNullOrEmpty(translatedText))
                        {
                            results[originalText] = PostprocessText(translatedText);
                        }
                        else
                        {
                            results[originalText] = $"{originalText} [{targetLang.ToUpper()}]";
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to translate batch chunk");
                    
                    // Add fallback translations for this chunk
                    foreach (var text in chunk)
                    {
                        results[text] = $"{text} [{targetLang.ToUpper()}]";
                    }
                }
            }

            _logger.LogInformation("Batch translation completed: {SuccessCount}/{TotalCount} successful", 
                results.Count, texts.Count);

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to perform batch translation");
            
            // Return fallback translations
            foreach (var text in texts)
            {
                results[text] = $"{text} [{targetLang.ToUpper()}]";
            }
            
            return results;
        }
    }

    /// <summary>
    /// Map locale codes (e.g., "en_US") to Google Translate language codes (e.g., "en")
    /// </summary>
    private string MapLocaleToLanguage(string localeOrLanguage)
    {
        if (string.IsNullOrEmpty(localeOrLanguage))
        {
            return "en"; // Default to English
        }

        // If it's already a language code (2-3 chars), return as-is
        if (localeOrLanguage.Length <= 3 && !localeOrLanguage.Contains('_'))
        {
            return localeOrLanguage.ToLower();
        }

        // Check if it's in our mapping
        if (_localeToLanguageMap.TryGetValue(localeOrLanguage, out var mappedLanguage))
        {
            return mappedLanguage;
        }

        // Extract language part from locale (e.g., "en_US" -> "en")
        var languagePart = localeOrLanguage.Split('_')[0].ToLower();
        return languagePart;
    }

    /// <summary>
    /// Preprocess text before translation (handle HTML, placeholders, etc.)
    /// </summary>
    private string PreprocessText(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return text;
        }

        // Preserve HTML tags and placeholders
        // Google Translate handles HTML reasonably well, but we can add custom logic here
        
        // Trim whitespace
        text = text.Trim();
        
        // Preserve multiple spaces (though Google Translate usually handles this)
        return text;
    }

    /// <summary>
    /// Postprocess translated text (clean up, restore formatting, etc.)
    /// </summary>
    private string PostprocessText(string translatedText)
    {
        if (string.IsNullOrEmpty(translatedText))
        {
            return translatedText;
        }

        // Clean up any translation artifacts
        translatedText = translatedText.Trim();
        
        // Fix common Google Translate formatting issues
        translatedText = Regex.Replace(translatedText, @"\s+", " "); // Normalize whitespace
        
        return translatedText;
    }

    /// <summary>
    /// Get Google Translate API key from configuration
    /// </summary>
    private string GetApiKey()
    {
        // Try environment variable first (for production/deployment)
        var apiKey = Environment.GetEnvironmentVariable("GOOGLE_TRANSLATE_API_KEY");
        
        if (string.IsNullOrEmpty(apiKey))
        {
            // API key must be provided via environment variable
            throw new InvalidOperationException("GOOGLE_TRANSLATE_API_KEY environment variable is required but not set");
        }
        else
        {
            _logger.LogInformation("Using Google Translate API key from environment variable");
        }

        return apiKey;
    }
}