import React, { useState, useEffect } from 'react'
import { Play, CheckCircle, XCircle, Clock, Settings, RefreshCw, Monitor, Database } from 'lucide-react'

const API_BASE = 'http://localhost:3011/api'

function App() {
  const [testSuites, setTestSuites] = useState([])
  const [testCases, setTestCases] = useState([])
  const [systemStatus, setSystemStatus] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [runningTests, setRunningTests] = useState(new Set())
  const [testResults, setTestResults] = useState({})
  const [selectedTab, setSelectedTab] = useState('suites')

  useEffect(() => {
    fetchTestSuites()
    fetchTestCases()
    fetchSystemStatus()
  }, [])

  const fetchTestSuites = async () => {
    try {
      const response = await fetch(`${API_BASE}/test-suites`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setTestSuites(data.suites || [])
      setApiError(null)
    } catch (error) {
      console.error('Failed to fetch test suites:', error)
      setApiError(error.message)
      setTestSuites([])
    }
  }

  const fetchTestCases = async () => {
    try {
      const response = await fetch(`${API_BASE}/test-cases`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setTestCases(data.cases || [])
    } catch (error) {
      console.error('Failed to fetch test cases:', error)
      setTestCases([])
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/system-status`)
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const runTestSuite = async (suiteId) => {
    setRunningTests(prev => new Set(prev).add(suiteId))
    
    try {
      const response = await fetch(`${API_BASE}/run-suite/${suiteId}`, {
        method: 'POST'
      })
      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [suiteId]: result
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [suiteId]: { 
          success: false, 
          error_output: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(suiteId)
        return newSet
      })
    }
  }

  const runTestCase = async (caseId) => {
    setRunningTests(prev => new Set(prev).add(caseId))
    
    try {
      const response = await fetch(`${API_BASE}/run-case/${caseId}`, {
        method: 'POST'
      })
      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [caseId]: result
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [caseId]: { 
          success: false, 
          error_output: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(caseId)
        return newSet
      })
    }
  }

  const getStatusIcon = (id) => {
    if (runningTests.has(id)) {
      return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
    }
    
    const result = testResults[id]
    if (!result) {
      return <div className="status-indicator status-pending" />
    }
    
    return result.success 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getSystemStatusColor = (status) => {
    if (status === 'running' || status === 'connected') return 'text-green-500'
    if (status === 'not_running' || status === 'disconnected') return 'text-red-500'
    return 'text-yellow-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commerce Context Test Suite</h1>
              <p className="text-gray-600">Automated testing for Product MDM APIs</p>
            </div>
            <button
              onClick={fetchSystemStatus}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* API Error Banner */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Backend Server Not Available</h3>
                <p className="text-sm text-red-600 mt-1">
                  Cannot connect to test server at <code>localhost:3011</code>. 
                  Please start the backend server to run tests.
                </p>
                <p className="text-xs text-red-500 mt-2">Error: {apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className={`status-indicator ${systemStatus.api_server?.status === 'running' ? 'status-success' : 'status-failure'}`} />
                <div>
                  <div className="font-medium">API Server</div>
                  <div className={`text-sm ${getSystemStatusColor(systemStatus.api_server?.status)}`}>
                    {systemStatus.api_server?.status || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className={`w-3 h-3 ${getSystemStatusColor(systemStatus.database?.status)}`} />
                <div>
                  <div className="font-medium">Database</div>
                  <div className={`text-sm ${getSystemStatusColor(systemStatus.database?.status)}`}>
                    {systemStatus.database?.status || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Settings className={`w-3 h-3 ${systemStatus.jest_available ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <div className="font-medium">Jest</div>
                  <div className={`text-sm ${systemStatus.jest_available ? 'text-green-500' : 'text-red-500'}`}>
                    {systemStatus.jest_available ? 'Available' : 'Not Available'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <div>
                  <div className="font-medium">Node.js</div>
                  <div className="text-sm text-gray-600">
                    {systemStatus.node_version}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setSelectedTab('suites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'suites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Test Suites ({testSuites.length})
              </button>
              <button
                onClick={() => setSelectedTab('cases')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'cases'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Individual Tests ({testCases.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Test Suites Tab */}
            {selectedTab === 'suites' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testSuites.map((suite) => (
                  <TestSuiteCard
                    key={suite.id}
                    suite={suite}
                    onRun={() => runTestSuite(suite.id)}
                    status={getStatusIcon(suite.id)}
                    result={testResults[suite.id]}
                    isRunning={runningTests.has(suite.id)}
                    colorClass={getColorClass(suite.color)}
                  />
                ))}
              </div>
            )}

            {/* Individual Test Cases Tab */}
            {selectedTab === 'cases' && (
              <div className="space-y-4">
                {testCases.map((testCase) => (
                  <TestCaseCard
                    key={testCase.id}
                    testCase={testCase}
                    onRun={() => runTestCase(testCase.id)}
                    status={getStatusIcon(testCase.id)}
                    result={testResults[testCase.id]}
                    isRunning={runningTests.has(testCase.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Test Suite Card Component
function TestSuiteCard({ suite, onRun, status, result, isRunning, colorClass }) {
  const [showOutput, setShowOutput] = useState(false)

  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{suite.icon}</span>
          <div>
            <h3 className="font-semibold">{suite.name}</h3>
            <p className="text-sm opacity-75">{suite.description}</p>
          </div>
        </div>
        {status}
      </div>
      
      <div className="text-sm mb-3">
        <div>Duration: {suite.estimated_duration}</div>
        <div>Files: {suite.files.join(', ')}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
            isRunning 
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-gray-100 border'
          }`}
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
        
        {result && (
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="px-3 py-1 text-sm bg-white text-gray-900 hover:bg-gray-100 border rounded"
          >
            {showOutput ? 'Hide' : 'Show'} Output
          </button>
        )}
      </div>

      {result && showOutput && (
        <TestResultOutput result={result} />
      )}
    </div>
  )
}

// Test Case Card Component
function TestCaseCard({ testCase, onRun, status, result, isRunning }) {
  const [showOutput, setShowOutput] = useState(false)

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{testCase.name}</h3>
          <p className="text-sm text-gray-600">{testCase.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Suite: {testCase.suite} | File: {testCase.file}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status}
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
              isRunning 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-3">
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border rounded"
          >
            {showOutput ? 'Hide' : 'Show'} Output
          </button>
          
          {showOutput && <TestResultOutput result={result} />}
        </div>
      )}
    </div>
  )
}

// Test Result Output Component
function TestResultOutput({ result }) {
  return (
    <div className="mt-4 space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className={`px-2 py-1 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.success ? 'PASSED' : 'FAILED'}
        </span>
        <span>Duration: {Math.round(result.duration_ms / 1000)}s</span>
        {result.summary && (
          <span>
            Tests: {result.summary.tests_passed}/{result.summary.tests_run}
          </span>
        )}
        {result.summary?.coverage && (
          <span>Coverage: {result.summary.coverage}%</span>
        )}
      </div>

      {/* Output */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs test-output max-h-64 overflow-y-auto">
        {result.output || result.error_output || 'No output available'}
      </div>
    </div>
  )
}

export default App