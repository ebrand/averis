# Enhanced Database-Driven Logging System Implementation

## Overview
This document summarizes the implementation of a comprehensive database-driven logging system that captures both business workflow events and operational monitoring events across the commerce platform.

## Problem Solved
**Original Issue**: "Launching a product doesn't show any logs" - workflow events were not appearing in the dashboard.

**Root Cause**: Logs were being generated and sent via SignalR for real-time notifications, but not persisted for retrieval via the `/logs` endpoint.

## Solution Architecture

### Database-Driven Logging
- **Storage**: PostgreSQL table `averis_system.log_entries` for persistent log storage
- **Real-time**: SignalR notifications for live dashboard updates
- **API Integration**: HTTP endpoint `/api/logs/push` for log ingestion from all services

### Log Level Strategy
- **ERROR**: Memory pressure, timeouts, critical system failures
- **WARNING**: Business workflow events (product launches, transitions), slow operations
- **INFO**: Routine system operations (filterable)

## Key Files Modified

### 1. System API - Database Schema
**File**: `averis_system.log_entries` (PostgreSQL table)
```sql
CREATE TABLE averis_system.log_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL,
    source VARCHAR(100) NOT NULL,
    service VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    exception TEXT,
    product_id UUID,
    product_sku VARCHAR(255),
    user_id VARCHAR(100),
    correlation_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. System API - Enhanced Program.cs
**File**: `/dotnet-services/src/Commerce.Services.SystemApi.Api/Program.cs`
**Changes**:
- Updated `/api/logs/push` to store in database AND send SignalR notifications
- Updated `/logs` endpoint to read from database instead of files
- Fixed UTC timestamp handling for PostgreSQL compatibility
- Added namespace conflict resolution between Models.LogEntry and Services.LogEntry

**Key Code Sections**:
```csharp
// Database storage in /api/logs/push
var dbLogEntry = new Commerce.Services.SystemApi.Api.Models.LogEntry
{
    Timestamp = root.TryGetProperty("timestamp", out var timestampProp) 
        ? DateTime.Parse(timestampProp.GetString()!).ToUniversalTime() 
        : DateTime.UtcNow,
    Level = root.GetProperty("level").GetString() ?? "INFO",
    // ... other properties
};

dbContext.LogEntries.Add(dbLogEntry);
await dbContext.SaveChangesAsync();

// SignalR notification
var signalRLogEntry = new Commerce.Services.SystemApi.Api.Services.LogEntry { /* ... */ };
await logService.NotifyLogEntryAsync(signalRLogEntry);
```

### 3. Product MDM API - Enhanced Log Levels
**File**: `/dotnet-services/src/Commerce.Services.ProductMdm.Api/Services/RealTimeLogService.cs`
**Changes**:
- Product workflow transitions: INFO → WARNING
- Product launches: INFO → WARNING
- Added memory monitoring methods
- Added timeout detection methods
- Added resource warning methods

**Key Methods Added**:
```csharp
public async Task StreamMemoryPressureAsync(long memoryUsageMB, long thresholdMB)
{
    var message = $"High memory usage detected: {memoryUsageMB}MB (threshold: {thresholdMB}MB)";
    await StreamLogAsync("ERROR", "ProductMdm.Memory", message);
}

public async Task StreamTimeoutAsync(string operation, int timeoutMs)
{
    var message = $"Operation timeout: {operation} exceeded {timeoutMs}ms timeout";
    await StreamLogAsync("ERROR", "ProductMdm.Timeout", message);
}
```

### 4. System Monitoring Service
**File**: `/dotnet-services/src/Commerce.Services.ProductMdm.Api/Services/SystemMonitoringService.cs`
**New File**: Background service for continuous system monitoring
- Memory usage monitoring (500MB threshold)
- Performance degradation detection
- Timeout simulation and detection
- Resource warning alerts

**Key Features**:
```csharp
private async Task CheckMemoryUsage()
{
    using var process = Process.GetCurrentProcess();
    var memoryUsageMB = process.WorkingSet64 / 1024 / 1024;

    if (memoryUsageMB > MemoryThresholdMB)
    {
        await _logService.StreamMemoryPressureAsync(memoryUsageMB, MemoryThresholdMB);
    }
}
```

### 5. Enhanced Interface
**File**: `/dotnet-services/src/Commerce.Services.ProductMdm.Api/Services/IRealTimeLogService.cs`
**Added Methods**:
- `StreamMemoryPressureAsync()` - Memory monitoring
- `StreamTimeoutAsync()` - Timeout detection  
- `StreamResourceWarningAsync()` - General resource warnings

### 6. Service Registration
**File**: `/dotnet-services/src/Commerce.Services.ProductMdm.Api/Program.cs`
**Added**:
```csharp
// Register System Monitoring background service
builder.Services.AddHostedService<SystemMonitoringService>();
```

## Event Types Captured

### Business Events (WARNING Level)
- Product workflow transitions: `ProductMdm.Workflow`
- Product launches: `ProductMdm.Launch` 
- Business rule violations: `ProductMdm.BusinessEvents`

### Operational Events
- **ERROR Level**:
  - Memory pressure: `ProductMdm.Memory`
  - Operation timeouts: `ProductMdm.Timeout`
  - System failures: `ProductMdm.Error`

- **WARNING Level**:
  - Slow operations: `ProductMdm.Performance`
  - Resource warnings: `ProductMdm.Resources`

## Usage Examples

### Dashboard Filtering
```bash
# Show only business events
curl -s http://localhost:6012/logs | jq '.logs[] | select(.level == "WARNING" or .level == "ERROR")'

# Show only operational issues
curl -s http://localhost:6012/logs | jq '.logs[] | select(.source | test("Performance|Memory|Timeout|Resources"))'

# Filter out routine INFO logs
curl -s http://localhost:6012/logs | jq '.logs[] | select(.level != "INFO")'
```

### Manual Event Injection
```bash
# Simulate memory pressure
curl -X POST "http://localhost:6012/api/logs/push" -H "Content-Type: application/json" -d '{
  "timestamp": "2025-09-13T02:01:17.000Z",
  "level": "ERROR", 
  "source": "ProductMdm.Memory",
  "service": "Product MDM API",
  "message": "High memory usage detected: 750MB (threshold: 500MB)"
}'
```

## Benefits Achieved

### 1. Complete Visibility
- **Before**: Business events invisible, only routine logs
- **After**: Both business workflows AND operational health monitored

### 2. Effective Filtering  
- **Before**: All events at INFO level, hard to distinguish
- **After**: Clear log level hierarchy enables focused monitoring

### 3. Persistent + Real-time
- **Before**: SignalR only, no persistence across restarts
- **After**: Database storage + SignalR notifications

### 4. Operational Intelligence
- **Before**: No system health monitoring
- **After**: Memory, performance, and timeout monitoring

## Performance Impact
- **Database**: Indexed table for fast queries
- **Real-time**: Fire-and-forget HTTP calls, non-blocking
- **Background**: 1-minute monitoring intervals
- **Filtering**: Database-level filtering reduces network traffic

## Current Status
- ✅ Database-driven storage implemented
- ✅ Business event log levels enhanced (WARNING)
- ✅ Operational monitoring added (ERROR/WARNING)
- ✅ Real-time SignalR notifications maintained
- ✅ Dashboard filtering capabilities enabled
- ✅ System health monitoring active

## Next Steps (Optional Enhancements)
1. **Alerting**: Add email/Slack notifications for ERROR level events
2. **Metrics Aggregation**: Add hourly/daily log summaries
3. **Log Retention**: Implement automatic cleanup of old logs
4. **Dashboard UI**: Enhanced filtering UI with log level buttons
5. **Health Checks**: Integration with ASP.NET Core health checks

## Testing Verification
- Product launches now appear in dashboard logs at WARNING level
- Operational events (memory, timeouts, performance) logged at appropriate levels  
- Database persistence works across API restarts
- SignalR real-time notifications still functional
- Log filtering effectively separates business from operational events

---
*Implementation completed: September 13, 2025*
*System API: http://localhost:6012/logs*
*Product MDM API: http://localhost:6001*