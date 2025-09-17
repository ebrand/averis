import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { discoverTests, checkTestFreshness } from './test-discovery.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3008

app.use(cors())
app.use(express.json())

// Cache for discovered tests (refreshed every 5 minutes)
let testCache = { suites: [], cases: [], lastRefresh: 0 }
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Auto-discover tests on startup
refreshTestCache()

// Mock data for testing the UI
const TEST_SUITES = [
  {
    id: 'unit',
    name: 'Unit Tests',
    description: 'Test individual components and models',
    icon: '🧪',
    color: 'blue',
    files: ['tests/unit/User.test.js'],
    estimated_duration: '10-30 seconds'
  },
  {
    id: 'integration',
    name: 'Integration Tests', 
    description: 'Test API endpoints with database',
    icon: '🔗',
    color: 'green',
    files: ['tests/integration/users.test.js', 'tests/integration/products.test.js'],
    estimated_duration: '30-60 seconds'
  },
  {
    id: 'coverage',
    name: 'Coverage Report',
    description: 'Run all tests with coverage analysis',
    icon: '📊',
    color: 'purple',
    files: ['All test files'],
    estimated_duration: '60-120 seconds'
  },
  {
    id: 'config',
    name: 'Configuration Validation',
    description: 'Validate system configuration consistency',
    icon: '⚙️',
    color: 'yellow',
    files: ['config/scripts/validate-dev-config.js'],
    estimated_duration: '5-10 seconds'
  }
]

const TEST_CASES = [
  {
    id: 'user-profile-update',
    name: 'User Profile Update (Fixed Issue)',
    description: 'Tests the profile persistence functionality we fixed',
    suite: 'integration',
    file: 'tests/integration/users.test.js'
  },
  {
    id: 'database-schema',
    name: 'Database Schema Compatibility',
    description: 'Validates database column compatibility',
    suite: 'unit',
    file: 'tests/unit/User.test.js'
  },
  {
    id: 'user-crud',
    name: 'User CRUD Operations',
    description: 'Complete user management functionality',
    suite: 'integration',
    file: 'tests/integration/users.test.js'
  },
  {
    id: 'product-crud',
    name: 'Product CRUD Operations',
    description: 'Complete product management functionality',
    suite: 'integration',
    file: 'tests/integration/products.test.js'
  }
]

// Helper function to refresh test cache
async function refreshTestCache() {
  try {
    console.log('🔄 Refreshing test cache...')
    const discovered = await discoverTests()
    
    // Use discovered tests if available, fallback to static data
    testCache = {
      suites: discovered.suites.length > 0 ? discovered.suites : TEST_SUITES,
      cases: discovered.cases.length > 0 ? discovered.cases : TEST_CASES,
      lastRefresh: Date.now(),
      discoveryInfo: discovered
    }
    
    console.log(`✅ Test cache refreshed: ${testCache.suites.length} suites, ${testCache.cases.length} cases`)
  } catch (error) {
    console.error('❌ Failed to refresh test cache:', error)
    // Keep using existing cache or fallback to static data
    if (!testCache.suites.length) {
      testCache.suites = TEST_SUITES
      testCache.cases = TEST_CASES
    }
  }
}

// API Routes
app.get('/api/test-suites', async (req, res) => {
  // Refresh cache if it's older than CACHE_DURATION
  if (Date.now() - testCache.lastRefresh > CACHE_DURATION) {
    await refreshTestCache()
  }
  
  res.json({ 
    suites: testCache.suites,
    cache_info: {
      last_refresh: new Date(testCache.lastRefresh).toISOString(),
      auto_discovered: testCache.discoveryInfo?.suites?.some(s => s.auto_discovered) || false
    }
  })
})

app.get('/api/test-cases', async (req, res) => {
  // Refresh cache if it's older than CACHE_DURATION
  if (Date.now() - testCache.lastRefresh > CACHE_DURATION) {
    await refreshTestCache()
  }
  
  res.json({ 
    cases: testCache.cases,
    cache_info: {
      last_refresh: new Date(testCache.lastRefresh).toISOString(),
      auto_discovered: testCache.discoveryInfo?.cases?.some(c => c.auto_discovered) || false
    }
  })
})

app.get('/api/system-status', async (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    api_server: { status: 'running', port: 6001 },
    database: { status: 'connected', host: 'localhost', port: 5432 },
    node_version: process.version,
    npm_available: true,
    jest_available: true,
    test_cache: {
      last_refresh: new Date(testCache.lastRefresh).toISOString(),
      suites_count: testCache.suites?.length || 0,
      cases_count: testCache.cases?.length || 0,
      auto_discovered: testCache.discoveryInfo?.suites?.some(s => s.auto_discovered) || false
    }
  })
})

// New endpoint for test freshness monitoring
app.get('/api/test-freshness', async (req, res) => {
  try {
    const freshness = await checkTestFreshness()
    res.json(freshness)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check test freshness',
      message: error.message
    })
  }
})

// Manual test discovery refresh endpoint
app.post('/api/refresh-tests', async (req, res) => {
  try {
    await refreshTestCache()
    res.json({
      success: true,
      message: 'Test cache refreshed successfully',
      suites_count: testCache.suites?.length || 0,
      cases_count: testCache.cases?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh test cache',
      message: error.message
    })
  }
})

app.post('/api/run-suite/:id', async (req, res) => {
  const suiteId = req.params.id
  
  // Find suite in either discovered or static data
  let suite = testCache.suites.find(s => s.id === suiteId)
  if (!suite) {
    suite = TEST_SUITES.find(s => s.id === suiteId)
  }
  
  if (!suite) {
    return res.status(404).json({ error: 'Test suite not found' })
  }

  // Execute real test
  const startTime = Date.now()
  
  try {
    const result = await executeTest(suite)
    const duration = Date.now() - startTime
    
    res.json({
      suite_id: suiteId,
      name: suite.name,
      success: result.success,
      exit_code: result.exitCode,
      duration_ms: duration,
      output: result.stdout,
      error_output: result.stderr,
      summary: result.summary || {
        tests_run: 0,
        tests_passed: 0,
        tests_failed: 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = Date.now() - startTime
    res.json({
      suite_id: suiteId,
      name: suite.name,
      success: false,
      exit_code: 1,
      duration_ms: duration,
      output: '',
      error_output: error.message,
      summary: {
        tests_run: 0,
        tests_passed: 0,
        tests_failed: 1
      },
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/run-case/:id', async (req, res) => {
  const caseId = req.params.id
  
  // Find test case in either discovered or static data
  let testCase = testCache.cases.find(c => c.id === caseId)
  if (!testCase) {
    testCase = TEST_CASES.find(c => c.id === caseId)
  }
  
  if (!testCase) {
    return res.status(404).json({ error: 'Test case not found' })
  }

  // Execute real individual test
  const startTime = Date.now()
  
  try {
    const result = await executeIndividualTest(testCase)
    const duration = Date.now() - startTime
    
    res.json({
      case_id: caseId,
      name: testCase.name,
      success: result.success,
      exit_code: result.exitCode,
      duration_ms: duration,
      output: result.stdout,
      error_output: result.stderr,
      summary: result.summary || {
        tests_run: 1,
        tests_passed: result.success ? 1 : 0,
        tests_failed: result.success ? 0 : 1
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = Date.now() - startTime
    res.json({
      case_id: caseId,
      name: testCase.name,
      success: false,
      exit_code: 1,
      duration_ms: duration,
      output: '',
      error_output: error.message,
      summary: {
        tests_run: 1,
        tests_passed: 0,
        tests_failed: 1
      },
      timestamp: new Date().toISOString()
    })
  }
})

// Test execution functions
async function executeTest(suite) {
  return new Promise((resolve, reject) => {
    const productMdmApiPath = path.join(__dirname, '../product-mdm/api')
    
    // Determine the command to run based on suite
    let command, args
    if (suite.command && suite.script_command) {
      // Use discovered command
      command = 'npm'
      args = ['run', suite.command]
    } else {
      // Fallback for static suites
      command = 'npm'
      args = ['run', `test:${suite.id}`]
    }
    
    console.log(`🧪 Executing test suite: ${suite.name}`)
    console.log(`📁 Working directory: ${productMdmApiPath}`)
    console.log(`⚡ Command: ${command} ${args.join(' ')}`)
    
    const testProcess = spawn(command, args, {
      cwd: productMdmApiPath,
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--experimental-vm-modules',
        TEST_DB_NAME: 'commerce_db_test',
        TEST_DB_SCHEMA: 'product_mdm_test',
        NODE_ENV: 'test',
        DB_SCHEMA: 'product_mdm_test'
      }
    })
    
    let stdout = ''
    let stderr = ''
    
    testProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    testProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    testProcess.on('close', (code) => {
      console.log(`✅ Test completed with exit code: ${code}`)
      
      // Parse test results from output
      const summary = parseTestOutput(stdout + stderr)
      
      resolve({
        success: code === 0,
        exitCode: code,
        stdout: stdout,
        stderr: stderr,
        summary: summary
      })
    })
    
    testProcess.on('error', (error) => {
      console.error(`❌ Test execution error:`, error)
      reject(error)
    })
  })
}

async function executeIndividualTest(testCase) {
  return new Promise((resolve, reject) => {
    const productMdmApiPath = path.join(__dirname, '../product-mdm/api')
    
    // For individual test cases, we need to run jest with specific test name or file
    const command = 'npx'
    const args = [
      'jest',
      '--testNamePattern=' + testCase.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      testCase.file || ''
    ].filter(Boolean)
    
    console.log(`🧪 Executing individual test: ${testCase.name}`)
    console.log(`📁 Working directory: ${productMdmApiPath}`)
    console.log(`⚡ Command: ${command} ${args.join(' ')}`)
    
    const testProcess = spawn(command, args, {
      cwd: productMdmApiPath,
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--experimental-vm-modules',
        TEST_DB_NAME: 'commerce_db_test',
        TEST_DB_SCHEMA: 'product_mdm_test',
        NODE_ENV: 'test',
        DB_SCHEMA: 'product_mdm_test'
      }
    })
    
    let stdout = ''
    let stderr = ''
    
    testProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    testProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    testProcess.on('close', (code) => {
      console.log(`✅ Individual test completed with exit code: ${code}`)
      
      // Parse test results from output
      const summary = parseTestOutput(stdout + stderr)
      
      resolve({
        success: code === 0,
        exitCode: code,
        stdout: stdout,
        stderr: stderr,
        summary: summary
      })
    })
    
    testProcess.on('error', (error) => {
      console.error(`❌ Individual test execution error:`, error)
      reject(error)
    })
  })
}

function parseTestOutput(output) {
  const summary = {
    tests_run: 0,
    tests_passed: 0,
    tests_failed: 0,
    coverage: null
  }
  
  // Parse Jest output for test counts
  const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/)
  if (testSummaryMatch) {
    summary.tests_passed = parseInt(testSummaryMatch[1])
    summary.tests_run = parseInt(testSummaryMatch[2])
    summary.tests_failed = summary.tests_run - summary.tests_passed
  }
  
  // Try alternative format
  const altMatch = output.match(/(\d+)\s+passed,\s+(\d+)\s+total/)
  if (altMatch && !testSummaryMatch) {
    summary.tests_passed = parseInt(altMatch[1])
    summary.tests_run = parseInt(altMatch[2])
    summary.tests_failed = summary.tests_run - summary.tests_passed
  }
  
  // Parse coverage if present
  const coverageMatch = output.match(/All files[\s\S]*?([\d.]+)%/)
  if (coverageMatch) {
    summary.coverage = parseFloat(coverageMatch[1])
  }
  
  return summary
}

app.listen(PORT, () => {
  console.log(`🧪 Simple Test UI Server running on http://localhost:${PORT}`)
  console.log('✅ Ready to serve test UI requests!')
  console.log('🔗 Tests will execute in: ../product-mdm/api')
})