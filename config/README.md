# Commerce Context Configuration Management

This directory contains centralized configuration files for the entire Commerce Context project. The configuration system serves as the **single source of truth** for all service dependencies, ports, database schemas, and environment-specific settings.

## Purpose

This configuration system prevents integration issues by:
- ✅ Centralizing all port assignments and service URLs
- ✅ Documenting actual database schemas with known limitations
- ✅ Mapping service dependencies and startup order
- ✅ Providing validation rules for common integration points
- ✅ Recording known issues and their prevention strategies

## Structure

```
config/
├── README.md                    # This file
├── environments/
│   ├── development.yml         # Development environment config
│   ├── staging.yml             # Staging environment config (future)
│   └── production.yml          # Production environment config (future)
└── scripts/                    # Configuration validation scripts (future)
    ├── validate-dev-config.js
    └── health-check.js
```

## Configuration File Format

The YAML configuration files contain the following sections:

### 1. Database Configuration
- Connection details for PostgreSQL
- Schema ownership mapping
- Actual table column definitions
- **Important**: Documents missing columns (like `created_by`, `updated_by`)

### 2. Service Configuration
- Port assignments
- Environment variables
- API endpoints
- Dependencies
- Message queue topics

### 3. Infrastructure Services
- Database (PostgreSQL)
- Message Broker (RabbitMQ)
- Health check commands

### 4. Port Allocation Map
Complete mapping of which service runs on which port to prevent conflicts.

### 5. Dependency Graph
Service startup order based on dependencies.

### 6. Validation Rules
Rules that can be programmatically validated to catch integration issues.

### 7. Known Issues & Prevention
Documentation of common problems and how to prevent them.

## Using the Configuration

### For New Development
1. **Check port availability** in the `ports` section before starting new services
2. **Verify API endpoints** match what's documented in the service configuration
3. **Validate database schema** matches the column definitions before writing queries

### For Troubleshooting
1. **Check service dependencies** in the `dependency_graph`
2. **Review known issues** section for common problems
3. **Validate URLs and ports** match the configuration

### For New Team Members
This configuration file serves as comprehensive documentation of:
- How all services connect to each other
- What ports are used for what purposes
- Database schema limitations and gotchas
- The proper startup sequence for local development

## Key Benefits

### Integration Issue Prevention
The recent user profile persistence issue could have been prevented by referencing this configuration:
- Port mismatch: `product-mdm-ui.environment.VITE_API_BASE_URL` should be `http://localhost:6001/api`
- Database schema: `averis_product.users` table missing `created_by` and `updated_by` columns is clearly documented

### Configuration Drift Prevention
All environment-specific settings are version controlled and centralized, preventing:
- Services using inconsistent port configurations
- API calls going to the wrong endpoints
- Database queries using non-existent columns

### Onboarding Acceleration
New developers can understand the entire system architecture by reading this single configuration file.

## Validation (Future Enhancement)

Scripts can be created to validate:
```bash
# Validate all services are configured correctly
npm run validate:config

# Check health of all running services  
npm run health:check

# Start services in proper dependency order
npm run start:all
```

## Maintenance

When making changes to the system:
1. **Update this configuration first** before changing actual service configurations
2. **Review impact** on dependent services
3. **Update validation rules** if adding new integration points
4. **Document new known issues** and their prevention strategies

This configuration system transforms integration complexity from a runtime problem into a development-time validation issue.