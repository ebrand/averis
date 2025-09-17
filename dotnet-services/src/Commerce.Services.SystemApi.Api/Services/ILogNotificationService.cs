namespace Commerce.Services.SystemApi.Api.Services;

public interface ILogNotificationService
{
    Task NotifyLogEntryAsync(LogEntry logEntry);
}

public class LogEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public Dictionary<string, object>? Properties { get; set; }
}