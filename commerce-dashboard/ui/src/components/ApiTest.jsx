import React, { useState } from 'react'

const ApiTest = () => {
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)

  const testEndpoints = async () => {
    setTesting(true)
    setTestResults([])
    
    const endpoints = [
      '/health',  // Using Vite proxy
      '/api/products?limit=1',  // Using Vite proxy
      'http://localhost:6000/health',  // Direct to API server
      'http://127.0.0.1:6000/health',  // Direct to API server
      'http://localhost:6000/api/products?limit=1',  // Direct to API server
      'http://127.0.0.1:6000/api/products?limit=1'  // Direct to API server
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint}...`)
        const startTime = Date.now()
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        const endTime = Date.now()
        const data = await response.json()
        
        setTestResults(prev => [...prev, {
          endpoint,
          status: 'SUCCESS',
          statusCode: response.status,
          time: endTime - startTime,
          data: JSON.stringify(data, null, 2)
        }])
        
      } catch (error) {
        console.error(`Failed ${endpoint}:`, error)
        setTestResults(prev => [...prev, {
          endpoint,
          status: 'ERROR',
          error: error.message,
          errorType: error.constructor.name
        }])
      }
    }
    
    setTesting(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <button 
        onClick={testEndpoints}
        disabled={testing}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test API Endpoints'}
      </button>
      
      <div className="mt-6 space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
              <span className={`px-2 py-1 rounded text-white text-sm ${
                result.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.status}
              </span>
            </div>
            
            {result.status === 'SUCCESS' ? (
              <div>
                <p><strong>Status:</strong> {result.statusCode}</p>
                <p><strong>Time:</strong> {result.time}ms</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Response Data</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-40">
                    {result.data}
                  </pre>
                </details>
              </div>
            ) : (
              <div>
                <p><strong>Error Type:</strong> {result.errorType}</p>
                <p><strong>Error:</strong> {result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Environment Variables</h3>
        <ul className="text-sm space-y-1">
          <li><strong>VITE_API_BASE_URL:</strong> {import.meta.env.VITE_API_BASE_URL}</li>
          <li><strong>VITE_USE_MOCK_DATA:</strong> {import.meta.env.VITE_USE_MOCK_DATA}</li>
          <li><strong>VITE_API_FALLBACK_ENABLED:</strong> {import.meta.env.VITE_API_FALLBACK_ENABLED}</li>
          <li><strong>VITE_FORCE_API_USAGE:</strong> {import.meta.env.VITE_FORCE_API_USAGE}</li>
        </ul>
      </div>
    </div>
  )
}

export default ApiTest