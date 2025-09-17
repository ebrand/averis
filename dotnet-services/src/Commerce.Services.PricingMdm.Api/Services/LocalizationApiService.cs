using System.Text;
using System.Text.Json;

namespace Commerce.Services.PricingMdm.Api.Services;

/// <summary>
/// HTTP client service for communicating with the dedicated Localization API
/// </summary>
public class LocalizationApiService : ILocalizationApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LocalizationApiService> _logger;
    private readonly string _localizationApiBaseUrl;

    public LocalizationApiService(HttpClient httpClient, ILogger<LocalizationApiService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        // Get the Localization API URL from configuration
        _localizationApiBaseUrl = configuration.GetValue<string>("LocalizationApiUrl") ?? "http://api.localhost/localization";
        
        // Configure the HTTP client
        _httpClient.BaseAddress = new Uri(_localizationApiBaseUrl);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "PricingMdm-API/1.0");
    }

    /// <summary>
    /// Creates a localization workflow job using the dedicated Localization API
    /// </summary>
    public async Task<LocalizationWorkflowResponse> CreateLocalizationWorkflowAsync(CreateLocalizationWorkflowRequest request)
    {
        try
        {
            _logger.LogInformation("Creating localization workflow: {JobName} for catalog {CatalogId}", 
                request.JobName, request.CatalogId);

            var jsonContent = JsonSerializer.Serialize(request, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync("/api/localization/workflows", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var workflow = JsonSerializer.Deserialize<LocalizationWorkflowResponse>(responseContent, 
                    new JsonSerializerOptions 
                    { 
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                    });
                
                if (workflow != null)
                {
                    _logger.LogInformation("Successfully created localization workflow {WorkflowId}", workflow.Id);
                    return workflow;
                }
            }
            
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to create localization workflow. Status: {StatusCode}, Response: {Response}", 
                response.StatusCode, errorContent);
            
            throw new InvalidOperationException($"Failed to create localization workflow: {response.StatusCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating localization workflow for catalog {CatalogId}", request.CatalogId);
            throw;
        }
    }

    /// <summary>
    /// Gets the status of a localization workflow job
    /// </summary>
    public async Task<LocalizationWorkflowStatusResponse> GetWorkflowStatusAsync(Guid workflowId)
    {
        try
        {
            _logger.LogDebug("Getting workflow status for {WorkflowId}", workflowId);
            
            var response = await _httpClient.GetAsync($"/api/localization/workflows/{workflowId}");
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var status = JsonSerializer.Deserialize<LocalizationWorkflowStatusResponse>(responseContent,
                    new JsonSerializerOptions 
                    { 
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                    });
                
                if (status != null)
                {
                    return status;
                }
            }
            
            _logger.LogWarning("Failed to get workflow status for {WorkflowId}. Status: {StatusCode}", 
                workflowId, response.StatusCode);
            
            // Return a default status if the request fails
            return new LocalizationWorkflowStatusResponse
            {
                Id = workflowId,
                Status = "unknown",
                ProgressPercentage = 0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow status for {WorkflowId}", workflowId);
            
            return new LocalizationWorkflowStatusResponse
            {
                Id = workflowId,
                Status = "error",
                ProgressPercentage = 0,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Gets all workflow jobs for monitoring
    /// </summary>
    public async Task<List<LocalizationWorkflowResponse>> GetWorkflowJobsAsync()
    {
        try
        {
            _logger.LogDebug("Getting all localization workflow jobs");
            
            var response = await _httpClient.GetAsync("/api/localization/workflows");
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var workflows = JsonSerializer.Deserialize<List<LocalizationWorkflowResponse>>(responseContent,
                    new JsonSerializerOptions 
                    { 
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                    });
                
                return workflows ?? new List<LocalizationWorkflowResponse>();
            }
            
            _logger.LogWarning("Failed to get workflow jobs. Status: {StatusCode}", response.StatusCode);
            return new List<LocalizationWorkflowResponse>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting workflow jobs");
            return new List<LocalizationWorkflowResponse>();
        }
    }
}