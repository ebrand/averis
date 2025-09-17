# How to Use the validate-dev-config.js Script

The validation script helps prevent integration issues by automatically checking that your actual service configurations match the centralized configuration defined in `development.yml`.

## Quick Start

### 1. Navigate to the Scripts Directory
```bash
cd config/scripts
```

### 2. Run the Validation
```bash
npm run validate
```

## What the Script Validates

### ✅ **Service Configurations**
- Checks that `.env` files contain the correct API URLs
- Validates that UI services point to the right API endpoints
- Ensures environment variables match the YAML configuration

### ✅ **Database Schema Constraints**
- Verifies that API models don't reference non-existent database columns
- Checks for the specific issues we encountered (missing `created_by`, `updated_by`)
- Validates that code matches actual database schema

### ✅ **Port Configuration**
- Detects port conflicts between services
- Ensures each service runs on its assigned port
- Validates that service dependencies use correct ports

### ✅ **Service Dependencies**
- Checks that UI applications point to the correct API services
- Validates API base URLs match actual running services
- Ensures inter-service communication is properly configured

## Usage Scenarios

### 🔧 **During Development**
Run validation after making configuration changes:
```bash
# After modifying .env files
npm run validate

# After changing API ports
npm run validate

# Before committing configuration changes
npm run validate
```

### 🐛 **When Troubleshooting Integration Issues**
If you're experiencing issues like:
- UI can't reach API
- Database column errors
- Service connection failures

Run validation to identify configuration mismatches:
```bash
npm run validate
```

### 👥 **For New Team Members**
First time setting up the project:
```bash
cd config/scripts
npm install        # Install dependencies
npm run validate   # Check your setup
```

### 🚀 **Before Deployment**
Validate configuration consistency before deploying:
```bash
npm run validate   # Ensure all configs match
```

## Understanding the Output

### ✅ **Success Output**
```
🎉 All validations passed! Configuration is consistent.
```
This means:
- All service configurations match the YAML
- No port conflicts exist
- Database schema constraints are respected
- Service dependencies are correctly configured

### ❌ **Failure Output**
```
❌ Product MDM UI Environment: Missing API Base URL = VITE_API_BASE_URL=http://localhost:6001/api
❌ Port Conflict: Port 6001 used by multiple services
❌ User Model: Should not include updated_by field (column doesn't exist in database)
```

Each error tells you:
- **What's wrong**: The specific configuration mismatch
- **Where to fix it**: The file or service that needs updating
- **How to fix it**: The expected value from the YAML configuration

## Common Issues Caught by Validation

### 1. **API Port Mismatches** (The issue we just fixed!)
**Error**: `Missing API Base URL = VITE_API_BASE_URL=http://localhost:6001/api`

**Cause**: UI `.env` file has wrong API URL (like `/api` instead of `http://localhost:6001/api`)

**Fix**: Update the `.env` file to match the YAML configuration

### 2. **Database Schema Violations**
**Error**: `Should not include updated_by field (column doesn't exist in database)`

**Cause**: API code trying to use database columns that don't exist

**Fix**: Remove references to non-existent columns or add columns to database

### 3. **Port Conflicts**
**Error**: `Port 6001 used by multiple services`

**Cause**: Two services configured to use the same port

**Fix**: Update one service to use a different port (update both YAML and service config)

### 4. **Dependency Mismatches**
**Error**: `Dependency Mismatch: product-mdm-ui should point to http://localhost:6001/api`

**Cause**: UI service pointing to wrong API service

**Fix**: Update UI environment configuration to point to correct API

## Integration with Development Workflow

### Pre-commit Hook
Add to your git pre-commit hooks:
```bash
#!/bin/bash
cd config/scripts && npm run validate
if [ $? -ne 0 ]; then
  echo "❌ Configuration validation failed. Please fix before committing."
  exit 1
fi
```

### IDE Integration
Add as a VS Code task in `.vscode/tasks.json`:
```json
{
  "label": "Validate Configuration",
  "type": "shell",
  "command": "npm",
  "args": ["run", "validate"],
  "options": {
    "cwd": "${workspaceFolder}/config/scripts"
  },
  "group": "test",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared"
  }
}
```

### Makefile Integration
Add to your project Makefile:
```makefile
validate-config:
	cd config/scripts && npm run validate

dev: validate-config
	./start.sh
```

## Extending the Validation

The script can be extended to validate additional aspects:

### Adding New Validations
Edit `validate-dev-config.js` to add checks for:
- RabbitMQ queue configuration
- Database connectivity
- Service health endpoints
- SSL certificate validation

### Adding New Services
When adding a new service:
1. Add it to `development.yml`
2. Add validation rules to the script
3. Run validation to ensure consistency

## Troubleshooting the Validation Script

### Missing Dependencies
```bash
❌ Missing dependency: Please install js-yaml
Run: npm install js-yaml
```
**Fix**: `cd config/scripts && npm install`

### File Not Found Errors
```bash
❌ Product MDM UI Environment: File not found at /path/to/.env
```
**Fix**: Check that the path in `development.yml` is correct

### Permission Errors
```bash
❌ Error reading file - EACCES: permission denied
```
**Fix**: `chmod +x config/scripts/validate-dev-config.js`

## Benefits

This validation script transforms integration issues from **runtime surprises** into **development-time validations**:

- ✅ **Catch issues early** before they cause downtime
- ✅ **Faster debugging** with specific error messages
- ✅ **Consistent environments** across team members
- ✅ **Documented expectations** via automated checks
- ✅ **Reduced onboarding time** for new developers

The same integration issue that took us significant debugging time to resolve would now be caught in seconds by running `npm run validate`!