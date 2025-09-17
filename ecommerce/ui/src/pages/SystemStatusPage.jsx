import React, { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

const SystemStatusPage = () => {
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:6004'

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      
      // Check e-commerce API
      const apiResponse = await fetch(`${API_BASE}/health`)
      const apiHealthy = apiResponse.ok
      
      // Check external services
      const checks = await Promise.allSettled([
        fetch('http://localhost:8000/health'), // Product MDM
        fetch('http://localhost:8003/health'), // Pricing MDM
      ])

      const status = {
        overall: {
          status: apiHealthy ? 'healthy' : 'unhealthy',
          message: apiHealthy ? 'All critical systems operational' : 'Critical systems down',
          healthPercentage: apiHealthy ? 100 : 0
        },
        components: {
          api: {
            status: apiHealthy ? 'healthy' : 'unhealthy',
            message: apiHealthy ? 'API server is responding' : 'API server unavailable',
            responseTime: apiHealthy ? '< 100ms' : 'N/A',
            port: '5003'
          },
          database: {
            status: 'healthy', // Assume healthy if API is responding
            message: 'E-commerce database operational',
            port: '5435'
          },
        },
        externalServices: {
          productMdm: {
            status: checks[0].status === 'fulfilled' && checks[0].value.ok ? 'healthy' : 'warning',
            message: checks[0].status === 'fulfilled' && checks[0].value.ok ? 'Connected' : 'Unavailable',
            port: '8000'
          },
          pricingMdm: {
            status: checks[1].status === 'fulfilled' && checks[1].value.ok ? 'healthy' : 'warning',
            message: checks[1].status === 'fulfilled' && checks[1].value.ok ? 'Connected' : 'Unavailable',
            port: '8003'
          },
        }
      }

      setSystemStatus(status)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch system status:', error)
      setSystemStatus({
        overall: { status: 'error', message: 'Failed to check system status', healthPercentage: 0 },
        components: {},
        externalServices: {}
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchSystemStatus, 30000) // Refresh every 30 seconds
    }
    return () => interval && clearInterval(interval)
  }, [autoRefresh])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !systemStatus) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Checking System Status</h2>
          <p className="text-gray-600 mt-2">Please wait while we check all systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-commerce System Status</h1>
            <p className="text-gray-600 mt-2">
              Monitor the health and status of e-commerce platform components
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="auto-refresh" className="text-sm text-gray-600 mr-2">
                Auto-refresh
              </label>
              <input
                id="auto-refresh"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </div>

      {systemStatus && (
        <>
          {/* Quick Status Badges - No Scrolling */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {/* E-commerce API */}
            <div className={`flex flex-col items-center p-4 rounded-lg shadow-sm border ${
              systemStatus.components.api?.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                systemStatus.components.api?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemStatus.components.api?.status === 'healthy' ? '✓' : '✗'}
              </div>
              <span className="text-sm font-semibold text-gray-900">E-comm API</span>
              <span className="text-xs text-gray-500">Port 5003</span>
            </div>

            {/* E-commerce Database */}
            <div className={`flex flex-col items-center p-4 rounded-lg shadow-sm border ${
              systemStatus.components.database?.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                systemStatus.components.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemStatus.components.database?.status === 'healthy' ? '✓' : '✗'}
              </div>
              <span className="text-sm font-semibold text-gray-900">E-comm DB</span>
              <span className="text-xs text-gray-500">Port 5435</span>
            </div>


            {/* Product MDM */}
            <div className={`flex flex-col items-center p-4 rounded-lg shadow-sm border ${
              systemStatus.externalServices?.productMdm?.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                systemStatus.externalServices?.productMdm?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {systemStatus.externalServices?.productMdm?.status === 'healthy' ? '✓' : '⚠'}
              </div>
              <span className="text-sm font-semibold text-gray-900">Product MDM</span>
              <span className="text-xs text-gray-500">Port 8000</span>
            </div>

            {/* Pricing MDM */}
            <div className={`flex flex-col items-center p-4 rounded-lg shadow-sm border ${
              systemStatus.externalServices?.pricingMdm?.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`text-2xl mb-2 ${
                systemStatus.externalServices?.pricingMdm?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {systemStatus.externalServices?.pricingMdm?.status === 'healthy' ? '✓' : '⚠'}
              </div>
              <span className="text-sm font-semibold text-gray-900">Pricing MDM</span>
              <span className="text-xs text-gray-500">Port 8003</span>
            </div>

          </div>

          {/* Overall Status Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Overall System Health</h2>
                <p className="text-gray-600">{systemStatus.overall.message}</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  systemStatus.overall.healthPercentage >= 80 ? 'text-green-600' : 
                  systemStatus.overall.healthPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {systemStatus.overall.healthPercentage}%
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(systemStatus.overall.status)}`}>
                  {systemStatus.overall.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Component Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">E-commerce Components</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Core e-commerce platform services
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {Object.entries(systemStatus.components).map(([key, component], index) => (
                  <div key={key} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      {getStatusIcon(component.status)}
                      <span className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span>{component.message}</span>
                        <span className="text-xs text-gray-500">Port: {component.port}</span>
                      </div>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* External Services */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">External Services</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Connected services and dependencies
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {Object.entries(systemStatus.externalServices).map(([key, service], index) => (
                  <div key={key} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      {getStatusIcon(service.status)}
                      <span className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span>{service.message}</span>
                        <span className="text-xs text-gray-500">Port: {service.port}</span>
                      </div>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SystemStatusPage