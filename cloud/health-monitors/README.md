# Infrastructure Health Monitors

This directory contains health monitoring services for the core infrastructure components of the Averis Commerce Platform.

## Overview

The health monitors provide HTTP endpoints that can be called by the dashboard to check the status, uptime, and health of:

- **NATS Message Streaming** - Message queue health monitoring
- **PostgreSQL Database** - Database connectivity and schema monitoring

## Services

### NATS Health Monitor
- **Port**: 8090 (configurable via `NATS_HEALTH_PORT`)
- **Service**: Monitors NATS message streaming server
- **Endpoints**:
  - `GET /health` - Full health check with connection status, uptime, and server info
  - `GET /status` - Quick status check
  - `GET /info` - Service information

### PostgreSQL Health Monitor  
- **Port**: 8091 (configurable via `POSTGRES_HEALTH_PORT`)
- **Service**: Monitors PostgreSQL database connectivity and schemas
- **Endpoints**:
  - `GET /health` - Full health check with database stats, schema info, and connection pool status
  - `GET /health/schemas` - Detailed schema health information
  - `GET /status` - Quick status check
  - `GET /info` - Service information

## Usage

### Quick Start
```bash
# Start both monitors
./start-health-monitors.sh
```

### Individual Services
```bash
# NATS monitor only
npm run nats

# PostgreSQL monitor only  
npm run postgres

# Both in development mode
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NATS_URL` | `nats://localhost:4222` | NATS server connection URL |
| `NATS_HEALTH_PORT` | `8090` | Port for NATS health monitor |
| `POSTGRES_HEALTH_PORT` | `8091` | Port for PostgreSQL health monitor |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `commerce_db` | Database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |

## Health Check Response Format

Both monitors return consistent JSON responses:

```json
{
  "service": "Service Name",
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "lastChecked": "2025-01-15T10:30:00.000Z",
  "details": {
    // Service-specific details
  }
}
```

### Status Codes
- **200**: Service is healthy or degraded
- **503**: Service is unhealthy

### Status Values
- **healthy**: Service is fully operational
- **degraded**: Service is running but with some issues
- **unhealthy**: Service is not operational

## Integration with Dashboard

The commerce dashboard automatically polls these endpoints every 30 seconds to display infrastructure status on the Services page.

Update the dashboard's `ServicesPage.jsx` to include these health endpoints:

```javascript
{
  id: 'nats-streaming',
  name: 'NATS Message Streaming',
  category: 'Infrastructure',
  type: 'Queue',
  url: 'nats://localhost:4222',
  healthUrl: 'http://localhost:8090/health',
  description: 'High-performance message streaming for product events',
  version: 'v2.10.0'
},
{
  id: 'postgresql-main',
  name: 'PostgreSQL Database',
  category: 'Infrastructure', 
  type: 'Database',
  url: 'postgresql://localhost:5432/commerce_db',
  healthUrl: 'http://localhost:8091/health',
  description: 'Main PostgreSQL database (all schemas)',
  version: 'PostgreSQL 16'
}
```

## Monitoring Features

### NATS Monitor
- Connection status and reconnection attempts
- Message publishing tests
- Server information and client details
- Connection error tracking

### PostgreSQL Monitor
- Database connectivity and response time
- Active connection count
- Database size and statistics
- Schema-level health monitoring
- Connection pool monitoring

## Development

```bash
# Install dependencies
npm install

# Run individual monitors for development
node nats-health.js
node postgres-health.js

# Test endpoints
curl http://localhost:8090/health
curl http://localhost:8091/health
```

## Logs

Both monitors log to the console with structured output:
- ✅ Success messages for healthy checks
- ❌ Error messages for failed checks  
- 🔍 Startup and configuration information
- 🛑 Shutdown messages