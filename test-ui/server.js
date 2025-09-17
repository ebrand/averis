import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3008

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

// Test configuration
const API_PATH = path.join(__dirname, '../product-mdm/api')
const CONFIG_PATH = path.join(__dirname, '../config')

// Available test suites
const TEST_SUITES = {
  'unit': {
    name: 'Unit Tests',
    description: 'Test individual components and models',
    command: 'test:unit',
    icon: '🧪',
    color: 'blue',
    files: ['tests/unit/User.test.js']
  },
  'integration': {
    name: 'Integration Tests', 
    description: 'Test API endpoints with database',
    command: 'test:integration',
    icon: '🔗',
    color: 'green',
    files: ['tests/integration/users.test.js', 'tests/integration/products.test.js']
  },
  'coverage': {
    name: 'Coverage Report',
    description: 'Run all tests with coverage analysis',
    command: 'test:coverage',
    icon: '📊',
    color: 'purple',
    files: ['All test files']
  },
  'config': {
    name: 'Configuration Validation',
    description: 'Validate system configuration consistency',
    command: 'validate',
    icon: '⚙️',
    color: 'yellow',
    files: ['config/scripts/validate-dev-config.js'],
    path: CONFIG_PATH
  }
}

// Individual test cases (parsed from test files)
const TEST_CASES = {
  'user-profile-update': {
    name: 'User Profile Update (Fixed Issue)',
    description: 'Tests the profile persistence functionality we fixed',
    suite: 'integration',
    file: 'tests/integration/users.test.js',
    pattern: 'Profile Update'
  },
  'database-schema': {
    name: 'Database Schema Compatibility',
    description: 'Validates database column compatibility',
    suite: 'unit',
    file: 'tests/unit/User.test.js', 
    pattern: 'Schema Compatibility'
  },
  'user-crud': {
    name: 'User CRUD Operations',
    description: 'Complete user management functionality',
    suite: 'integration',
    file: 'tests/integration/users.test.js',
    pattern: 'Users API'
  },
  'product-crud': {
    name: 'Product CRUD Operations',
    description: 'Complete product management functionality',
    suite: 'integration',
    file: 'tests/integration/products.test.js',
    pattern: 'Products API'
  }
}

// GET /api/test-suites - List available test suites
app.get('/api/test-suites', (req, res) => {
  res.json({
    suites: Object.keys(TEST_SUITES).map(key => ({
      id: key,
      ...TEST_SUITES[key],
      estimated_duration: getEstimatedDuration(key)
    }))
  })
})

// GET /api/test-cases - List individual test cases
app.get('/api/test-cases', (req, res) => {
  res.json({
    cases: Object.keys(TEST_CASES).map(key => ({
      id: key,
      ...TEST_CASES[key]
    }))
  })
})

// POST /api/run-suite/:id - Run a test suite
app.post('/api/run-suite/:id', async (req, res) => {
  const suiteId = req.params.id
  const suite = TEST_SUITES[suiteId]
  
  if (!suite) {
    return res.status(404).json({ error: 'Test suite not found' })
  }

  try {
    const result = await runTestSuite(suiteId, suite)
    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      error: 'Test execution failed',
      details: error.message 
    })
  }
})

// POST /api/run-case/:id - Run a specific test case
app.post('/api/run-case/:id', async (req, res) => {
  const caseId = req.params.id
  const testCase = TEST_CASES[caseId]
  
  if (!testCase) {
    return res.status(404).json({ error: 'Test case not found' })
  }

  try {
    const result = await runTestCase(caseId, testCase)
    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      error: 'Test execution failed',
      details: error.message 
    })
  }
})

// GET /api/system-status - Check system status
app.get('/api/system-status', async (req, res) => {
  const status = await checkSystemStatus()
  res.json(status)
})

// Helper function to run test suite
async function runTestSuite(suiteId, suite) {
  return new Promise((resolve, reject) => {
    const workingDir = suite.path || API_PATH
    const command = suite.command === 'validate' ? 'node' : 'npm'
    const args = suite.command === 'validate' 
      ? ['validate-dev-config.js']
      : ['run', suite.command]

    console.log(`Running test suite: ${suiteId}`)
    console.log(`Command: ${command} ${args.join(' ')}`)
    console.log(`Working directory: ${workingDir}`)

    const startTime = Date.now()
    let stdout = ''
    let stderr = ''

    const child = spawn(command, args, {
      cwd: workingDir,
      env: { ...process.env, NODE_ENV: 'test' },
      shell: true
    })

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      const duration = Date.now() - startTime
      const success = code === 0

      resolve({
        suite_id: suiteId,
        name: suite.name,
        success,
        exit_code: code,
        duration_ms: duration,
        output: stdout,
        error_output: stderr,
        summary: parseTestOutput(stdout, stderr),
        timestamp: new Date().toISOString()
      })
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to start process: ${error.message}`))
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('Test execution timed out after 5 minutes'))
    }, 5 * 60 * 1000)
  })
}

// Helper function to run specific test case
async function runTestCase(caseId, testCase) {
  return new Promise((resolve, reject) => {
    const args = ['run', 'test', '--', '--testNamePattern', testCase.pattern]
    
    console.log(`Running test case: ${caseId}`)
    console.log(`Command: npm ${args.join(' ')}`)

    const startTime = Date.now()
    let stdout = ''
    let stderr = ''

    const child = spawn('npm', args, {
      cwd: API_PATH,
      env: { ...process.env, NODE_ENV: 'test' },
      shell: true
    })

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      const duration = Date.now() - startTime
      const success = code === 0

      resolve({
        case_id: caseId,
        name: testCase.name,
        success,
        exit_code: code,
        duration_ms: duration,
        output: stdout,
        error_output: stderr,
        summary: parseTestOutput(stdout, stderr),
        timestamp: new Date().toISOString()
      })
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to start process: ${error.message}`))
    })

    // Timeout after 2 minutes for individual test cases
    setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('Test execution timed out after 2 minutes'))
    }, 2 * 60 * 1000)
  })
}

// Helper function to parse test output
function parseTestOutput(stdout, stderr) {
  const summary = {
    tests_run: 0,
    tests_passed: 0,
    tests_failed: 0,
    coverage: null,
    errors: []
  }

  try {
    // Parse Jest output
    const jestSummaryMatch = stdout.match(/Tests:\\s+(\\d+) failed, (\\d+) passed, (\\d+) total/i)
    if (jestSummaryMatch) {
      summary.tests_failed = parseInt(jestSummaryMatch[1])
      summary.tests_passed = parseInt(jestSummaryMatch[2])
      summary.tests_run = parseInt(jestSummaryMatch[3])
    }

    // Parse coverage information
    const coverageMatch = stdout.match(/All files\\s+\\|\\s+([\\d.]+)\\s+\\|/i)
    if (coverageMatch) {
      summary.coverage = parseFloat(coverageMatch[1])
    }

    // Extract error messages
    const errorLines = stderr.split('\\n')
      .filter(line => line.includes('Error:') || line.includes('FAIL'))
      .slice(0, 5) // Limit to first 5 errors

    summary.errors = errorLines

  } catch (error) {
    console.warn('Failed to parse test output:', error)
  }

  return summary
}

// Helper function to check system status
async function checkSystemStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    api_server: await checkApiServer(),
    database: await checkDatabase(),
    node_version: process.version,
    npm_available: await checkCommand('npm'),
    jest_available: await checkJest()
  }

  return status
}

async function checkApiServer() {
  try {
    const response = await fetch('http://localhost:6001/health')
    return {
      status: response.ok ? 'running' : 'error',
      port: 6001,
      response_time: response.ok ? 'OK' : 'Failed'
    }
  } catch (error) {
    return {
      status: 'not_running',
      port: 6001,
      error: error.message
    }
  }
}

async function checkDatabase() {
  return new Promise((resolve) => {
    const { spawn } = require('child_process')
    const child = spawn('pg_isready', ['-h', 'localhost', '-p', '5432'])
    
    child.on('close', (code) => {
      resolve({
        status: code === 0 ? 'connected' : 'disconnected',
        host: 'localhost',
        port: 5432
      })
    })

    child.on('error', () => {
      resolve({
        status: 'unknown',
        error: 'pg_isready command not available'
      })
    })
  })
}

async function checkCommand(command) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process')
    const child = spawn(command, ['--version'])
    
    child.on('close', (code) => {
      resolve(code === 0)
    })

    child.on('error', () => {
      resolve(false)
    })
  })
}

async function checkJest() {
  try {
    await fs.access(path.join(API_PATH, 'node_modules', 'jest'))
    return true
  } catch {
    return false
  }
}

function getEstimatedDuration(suiteId) {
  const estimates = {
    'unit': '10-30 seconds',
    'integration': '30-60 seconds', 
    'coverage': '60-120 seconds',
    'config': '5-10 seconds'
  }
  return estimates[suiteId] || '30-60 seconds'
}

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🧪 Test UI Server running on http://localhost:${PORT}`)
  console.log(`📁 API Path: ${API_PATH}`)
  console.log(`⚙️  Config Path: ${CONFIG_PATH}`)
})