using System;
using System.Collections.Generic;

namespace Commerce.Services.Shared.Models.DTOs;

/// <summary>
/// Comprehensive health check result for microservices
/// </summary>
public class ServiceHealthResult
{
    public string Status { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public DatabaseHealthInfo? Database { get; set; }
    public NatsHealthInfo? Nats { get; set; }
    public CacheHealthInfo? Cache { get; set; }
    public StatisticsInfo? Stats { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Database connectivity health information
/// </summary>
public class DatabaseHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public int? RecordCount { get; set; }
    public string? Schema { get; set; }
}

/// <summary>
/// NATS messaging service health information
/// </summary>
public class NatsHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public bool? ConnectionEstablished { get; set; }
    public string? Server { get; set; }
}

/// <summary>
/// Cache-specific health information
/// </summary>
public class CacheHealthInfo
{
    public string Status { get; set; } = string.Empty;
    public DateTime? LastSync { get; set; }
    public bool IsHealthy { get; set; }
    public List<string> Issues { get; set; } = new();
}

/// <summary>
/// Service-specific statistics information
/// </summary>
public class StatisticsInfo
{
    public int ActiveProducts { get; set; }
    public int TotalProducts { get; set; }
    public int DraftProducts { get; set; }
    public int PendingProducts { get; set; }
    public int CachedProducts { get; set; }
    public int TotalProductTypes { get; set; }
    public int TotalCatalogs { get; set; }
    public int ActiveCatalogs { get; set; }
    public Dictionary<string, int> ProductsByType { get; set; } = new();
    public Dictionary<string, int> ProductsByStatus { get; set; } = new();
}