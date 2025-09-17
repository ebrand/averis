#!/usr/bin/env node

/**
 * Configuration Validation Script
 * 
 * This script validates that the actual service configurations match 
 * the centralized development.yml configuration file. It helps prevent
 * the integration issues we encountered with user profile persistence.
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml') // npm install js-yaml

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'environments', 'development.yml')
    const configFile = fs.readFileSync(configPath, 'utf8')
    return yaml.load(configFile)
  } catch (error) {
    log(`❌ Failed to load configuration: ${error.message}`, colors.red)
    process.exit(1)
  }
}

function validateFile(filePath, expectedContent, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description}: File not found at ${filePath}`, colors.red)
    return false
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for specific content patterns
    for (const [key, value] of Object.entries(expectedContent)) {
      if (typeof value === 'string' && !content.includes(value)) {
        log(`❌ ${description}: Missing ${key} = ${value}`, colors.red)
        return false
      }
    }
    
    log(`✅ ${description}: Configuration valid`, colors.green)
    return true
  } catch (error) {
    log(`❌ ${description}: Error reading file - ${error.message}`, colors.red)
    return false
  }
}

async function validateServiceConfigurations(config) {
  log('\n=== Validating Service Configurations ===', colors.blue)
  
  let allValid = true
  
  // Validate Product MDM UI configuration
  const productMdmUiEnv = path.join(config.services['product-mdm-ui'].path, '.env')
  const uiValid = validateFile(productMdmUiEnv, {
    'API Base URL': `VITE_API_BASE_URL=${config.services['product-mdm-ui'].environment.VITE_API_BASE_URL}`,
    'Force API Usage': 'VITE_FORCE_API_USAGE=true'
  }, 'Product MDM UI Environment')
  
  allValid = allValid && uiValid
  
  // Validate API Client configuration
  const apiClientPath = path.join(config.services['product-mdm-ui'].path, 'src', 'services', 'apiClient.js')
  const apiClientValid = validateFile(apiClientPath, {
    'API Base URL': `http://localhost:${config.services['product-mdm-api'].port}/api`
  }, 'Product MDM API Client')
  
  allValid = allValid && apiClientValid
  
  return allValid
}

async function validateDatabaseSchema(config) {
  log('\n=== Validating Database Schema Constraints ===', colors.blue)
  
  let allValid = true
  
  // Check User model for problematic fields
  const userModelPath = path.join(config.services['product-mdm-api'].path, 'src', 'models', 'User.js')
  
  if (fs.existsSync(userModelPath)) {
    const userModelContent = fs.readFileSync(userModelPath, 'utf8')
    
    // Check that toDatabaseFormat() doesn't include created_by or updated_by
    const missingColumns = config.database.schemas.product_mdm.tables.users.missing_columns
    
    for (const column of missingColumns) {
      if (userModelContent.includes(`${column}:`)) {
        log(`❌ User Model: Should not include ${column} field (column doesn't exist in database)`, colors.red)
        allValid = false
      }
    }
    
    if (allValid) {
      log('✅ User Model: No references to non-existent database columns', colors.green)
    }
  } else {
    log('❌ User Model: File not found', colors.red)
    allValid = false
  }
  
  return allValid
}

async function validatePortConfiguration(config) {
  log('\n=== Validating Port Configuration ===', colors.blue)
  
  let allValid = true
  const usedPorts = new Set()
  const duplicatePorts = new Set()
  
  // Check for port conflicts
  for (const [serviceName, service] of Object.entries(config.services)) {
    if (service.port) {
      if (usedPorts.has(service.port)) {
        duplicatePorts.add(service.port)
        log(`❌ Port Conflict: Port ${service.port} used by multiple services`, colors.red)
        allValid = false
      } else {
        usedPorts.add(service.port)
      }
    }
  }
  
  // Validate specific port mappings match expected configuration
  const expectedMappings = {
    'product-mdm-api': 6001,
    'product-mdm-ui': 3001,
    'pricing-mdm-api': 6002,
    'ecommerce-api': 6003
  }
  
  for (const [serviceName, expectedPort] of Object.entries(expectedMappings)) {
    const actualPort = config.services[serviceName]?.port
    if (actualPort !== expectedPort) {
      log(`❌ Port Mismatch: ${serviceName} should be on port ${expectedPort}, configured for ${actualPort}`, colors.red)
      allValid = false
    }
  }
  
  if (allValid && duplicatePorts.size === 0) {
    log('✅ Port Configuration: All ports are unique and correctly assigned', colors.green)
  }
  
  return allValid
}

async function validateServiceDependencies(config) {
  log('\n=== Validating Service Dependencies ===', colors.blue)
  
  let allValid = true
  
  // Check that UI services point to the correct API services
  const uiToApiMappings = {
    'product-mdm-ui': {
      expectedApiUrl: `http://localhost:${config.services['product-mdm-api'].port}/api`,
      configKey: 'VITE_API_BASE_URL'
    }
  }
  
  for (const [uiService, mapping] of Object.entries(uiToApiMappings)) {
    const actualUrl = config.services[uiService]?.environment[mapping.configKey]
    if (actualUrl !== mapping.expectedApiUrl) {
      log(`❌ Dependency Mismatch: ${uiService} should point to ${mapping.expectedApiUrl}, configured for ${actualUrl}`, colors.red)
      allValid = false
    }
  }
  
  if (allValid) {
    log('✅ Service Dependencies: All UI services correctly point to their APIs', colors.green)
  }
  
  return allValid
}

async function main() {
  log('🔍 Commerce Context Configuration Validation', colors.blue)
  log('============================================\n', colors.blue)
  
  const config = await loadConfig()
  log(`✅ Loaded configuration for environment: ${config.environment}`, colors.green)
  
  let overallValid = true
  
  // Run all validations
  overallValid &= await validateServiceConfigurations(config)
  overallValid &= await validateDatabaseSchema(config)
  overallValid &= await validatePortConfiguration(config)
  overallValid &= await validateServiceDependencies(config)
  
  // Final result
  log('\n=== Validation Summary ===', colors.blue)
  if (overallValid) {
    log('🎉 All validations passed! Configuration is consistent.', colors.green)
    process.exit(0)
  } else {
    log('❌ Configuration validation failed. Please fix the issues above.', colors.red)
    log('\n💡 Tip: The configuration file at config/environments/development.yml', colors.yellow)
    log('    serves as the source of truth. Update service configurations to match.', colors.yellow)
    process.exit(1)
  }
}

// Handle cases where js-yaml is not installed
try {
  main()
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('js-yaml')) {
    log('❌ Missing dependency: Please install js-yaml', colors.red)
    log('   Run: npm install js-yaml', colors.yellow)
    process.exit(1)
  } else {
    log(`❌ Unexpected error: ${error.message}`, colors.red)
    process.exit(1)
  }
}