import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the API directory containing test files
const API_PATH = path.join(__dirname, '../product-mdm/api')

/**
 * Dynamically discover test suites and cases from the filesystem
 */
export async function discoverTests() {
  const discovery = {
    suites: [],
    cases: [],
    lastScanned: new Date().toISOString(),
    totalTestFiles: 0,
    errors: []
  }

  try {
    // Discover test suites by scanning directories
    const testSuites = await discoverTestSuites()
    discovery.suites = testSuites

    // Discover individual test cases by parsing test files
    const testCases = await discoverTestCases()
    discovery.cases = testCases

    // Count total test files
    discovery.totalTestFiles = await countTestFiles()

    console.log(`📊 Test Discovery Complete:`)
    console.log(`   - ${discovery.suites.length} test suites found`)
    console.log(`   - ${discovery.cases.length} individual test cases found`)
    console.log(`   - ${discovery.totalTestFiles} total test files`)

  } catch (error) {
    discovery.errors.push({
      type: 'discovery_error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
    console.error('Test discovery failed:', error)
  }

  return discovery
}

/**
 * Discover test suites by examining package.json and test directories
 */
async function discoverTestSuites() {
  const suites = []

  try {
    // Read package.json to find test scripts
    const packageJsonPath = path.join(API_PATH, 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    
    const testScripts = Object.keys(packageJson.scripts || {})
      .filter(script => script.startsWith('test'))

    // Map common test script patterns to suite configurations
    for (const script of testScripts) {
      const suite = await createSuiteFromScript(script, packageJson.scripts[script])
      if (suite) {
        suites.push(suite)
      }
    }

    // Add configuration validation suite if config directory exists
    const configPath = path.join(__dirname, '../config')
    try {
      await fs.access(configPath)
      suites.push({
        id: 'config',
        name: 'Configuration Validation',
        description: 'Validate system configuration consistency',
        command: 'validate',
        icon: '⚙️',
        color: 'yellow',
        files: ['config/scripts/validate-dev-config.js'],
        estimated_duration: '5-10 seconds',
        path: configPath,
        auto_discovered: true,
        last_updated: new Date().toISOString()
      })
    } catch {
      // Config directory doesn't exist, skip
    }

  } catch (error) {
    console.warn('Could not discover test suites from package.json:', error.message)
  }

  return suites
}

/**
 * Create a test suite configuration from a package.json script
 */
async function createSuiteFromScript(scriptName, scriptCommand) {
  const suiteConfigs = {
    'test': {
      id: 'all',
      name: 'All Tests',
      description: 'Run complete test suite',
      icon: '🎯',
      color: 'blue',
      estimated_duration: '60-120 seconds'
    },
    'test:unit': {
      id: 'unit',
      name: 'Unit Tests',
      description: 'Test individual components and models',
      icon: '🧪',
      color: 'blue',
      estimated_duration: '10-30 seconds'
    },
    'test:integration': {
      id: 'integration',
      name: 'Integration Tests',
      description: 'Test API endpoints with database',
      icon: '🔗',
      color: 'green',
      estimated_duration: '30-60 seconds'
    },
    'test:coverage': {
      id: 'coverage',
      name: 'Coverage Report',
      description: 'Run all tests with coverage analysis',
      icon: '📊',
      color: 'purple',
      estimated_duration: '60-120 seconds'
    }
  }

  const config = suiteConfigs[scriptName]
  if (!config) return null

  // Find test files for this suite
  const testFiles = await findTestFiles(scriptName)

  return {
    ...config,
    command: scriptName,
    files: testFiles,
    script_command: scriptCommand,
    auto_discovered: true,
    last_updated: new Date().toISOString()
  }
}

/**
 * Discover individual test cases by parsing test files
 */
async function discoverTestCases() {
  const cases = []

  try {
    const testFiles = await findAllTestFiles()
    
    for (const testFile of testFiles) {
      const fileCases = await parseTestFile(testFile)
      cases.push(...fileCases)
    }

  } catch (error) {
    console.warn('Could not discover test cases:', error.message)
  }

  return cases
}

/**
 * Parse a test file to extract individual test cases
 */
async function parseTestFile(filePath) {
  const cases = []

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const fileName = path.basename(filePath)
    const relativePath = path.relative(API_PATH, filePath)

    // Extract describe blocks (test suites within files)
    const describeMatches = content.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/g) || []
    
    // Extract test/it blocks (individual tests)
    const testMatches = content.match(/(test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g) || []

    // Create test cases from matches
    for (const testMatch of testMatches) {
      const testNameMatch = testMatch.match(/['"`]([^'"`]+)['"`]/)
      if (testNameMatch) {
        const testName = testNameMatch[1]
        
        cases.push({
          id: generateTestCaseId(fileName, testName),
          name: testName,
          description: `Test from ${fileName}`,
          suite: determineSuite(filePath),
          file: relativePath,
          pattern: testName,
          auto_discovered: true,
          last_updated: new Date().toISOString()
        })
      }
    }

  } catch (error) {
    console.warn(`Could not parse test file ${filePath}:`, error.message)
  }

  return cases
}

/**
 * Find test files for a specific test suite
 */
async function findTestFiles(suiteType) {
  const testDirs = [
    path.join(API_PATH, 'tests'),
    path.join(API_PATH, 'test'),
    path.join(API_PATH, '__tests__')
  ]

  const patterns = {
    'test:unit': ['unit', 'spec'],
    'test:integration': ['integration', 'e2e'],
    'test:coverage': ['**/*.test.js', '**/*.spec.js'],
    'test': ['**/*.test.js', '**/*.spec.js']
  }

  const files = []
  
  for (const testDir of testDirs) {
    try {
      await fs.access(testDir)
      const dirFiles = await scanDirectory(testDir, patterns[suiteType] || ['**/*.test.js'])
      files.push(...dirFiles.map(f => path.relative(API_PATH, f)))
    } catch {
      // Directory doesn't exist, continue
    }
  }

  return files
}

/**
 * Find all test files in the project
 */
async function findAllTestFiles() {
  const testFiles = []
  const testDirs = [
    path.join(API_PATH, 'tests'),
    path.join(API_PATH, 'test'),
    path.join(API_PATH, '__tests__')
  ]

  for (const testDir of testDirs) {
    try {
      await fs.access(testDir)
      const files = await scanDirectory(testDir, ['**/*.test.js', '**/*.spec.js'])
      testFiles.push(...files)
    } catch {
      // Directory doesn't exist, continue
    }
  }

  return testFiles
}

/**
 * Recursively scan directory for files matching patterns
 */
async function scanDirectory(dir, patterns = ['**/*.test.js']) {
  const files = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const subFiles = await scanDirectory(fullPath, patterns)
        files.push(...subFiles)
      } else if (entry.isFile() && isTestFile(entry.name)) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.warn(`Could not scan directory ${dir}:`, error.message)
  }

  return files
}

/**
 * Check if a file is a test file
 */
function isTestFile(filename) {
  return filename.includes('.test.') || 
         filename.includes('.spec.') ||
         filename.includes('test') && filename.endsWith('.js')
}

/**
 * Count total test files
 */
async function countTestFiles() {
  const testFiles = await findAllTestFiles()
  return testFiles.length
}

/**
 * Generate a unique ID for a test case
 */
function generateTestCaseId(fileName, testName) {
  const base = fileName.replace(/\.(test|spec)\.js$/, '')
  const normalized = testName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `${base}-${normalized}`
}

/**
 * Determine which suite a test file belongs to
 */
function determineSuite(filePath) {
  if (filePath.includes('/unit/') || filePath.includes('unit.test')) {
    return 'unit'
  } else if (filePath.includes('/integration/') || filePath.includes('integration.test')) {
    return 'integration'
  } else if (filePath.includes('/e2e/') || filePath.includes('e2e.test')) {
    return 'integration'
  }
  return 'general'
}

/**
 * Check for test file changes and return freshness info
 */
export async function checkTestFreshness() {
  const freshness = {
    last_check: new Date().toISOString(),
    stale_tests: [],
    new_tests: [],
    modified_tests: [],
    recommendations: []
  }

  try {
    const testFiles = await findAllTestFiles()
    
    for (const testFile of testFiles) {
      const stats = await fs.stat(testFile)
      const age = Date.now() - stats.mtime.getTime()
      const daysOld = age / (1000 * 60 * 60 * 24)

      if (daysOld > 30) {
        freshness.stale_tests.push({
          file: path.relative(API_PATH, testFile),
          days_old: Math.floor(daysOld),
          last_modified: stats.mtime.toISOString()
        })
      }
    }

    // Add recommendations
    if (freshness.stale_tests.length > 0) {
      freshness.recommendations.push({
        type: 'stale_tests',
        message: `${freshness.stale_tests.length} test files haven't been updated in 30+ days`,
        action: 'Review and update test cases to ensure they cover current functionality'
      })
    }

  } catch (error) {
    console.warn('Could not check test freshness:', error.message)
  }

  return freshness
}