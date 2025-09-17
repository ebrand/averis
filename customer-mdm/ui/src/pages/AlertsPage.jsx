import React, { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BellIcon } from '@heroicons/react/24/outline'

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, resolved

  // Mock alerts data
  const mockAlerts = [
    {
      id: 'alert-001',
      title: 'High Response Time',
      description: 'E-commerce API response time exceeded threshold (>40ms) for 5 minutes',
      severity: 'warning',
      status: 'active',
      service: 'E-commerce API',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      details: {
        metric: 'avg_response_time',
        threshold: '40ms',
        current: '45ms',
        duration: '5 minutes'
      }
    },
    {
      id: 'alert-002',
      title: 'Database Connection Pool Full',
      description: 'E-commerce database connection pool is at 100% utilization',
      severity: 'critical',
      status: 'active',
      service: 'E-commerce API',
      timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
      details: {
        metric: 'connection_pool_usage',
        threshold: '90%',
        current: '100%',
        duration: '8 minutes'
      }
    },
    {
      id: 'alert-003',
      title: 'External Payment Gateway Timeout',
      description: 'Payment gateway failing to respond within timeout period',
      severity: 'critical',
      status: 'active',
      service: 'E-commerce API',
      timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      details: {
        metric: 'gateway_response_time',
        threshold: '30s',
        current: 'timeout',
        duration: '3 minutes'
      }
    },
    {
      id: 'alert-004',
      title: 'Memory Usage High',
      description: 'Product MDM API memory usage exceeded 80%',
      severity: 'warning',
      status: 'resolved',
      service: 'Product MDM API',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      resolvedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
      details: {
        metric: 'memory_usage',
        threshold: '80%',
        peak: '85%',
        duration: '30 minutes'
      }
    },
    {
      id: 'alert-005',
      title: 'Disk Space Low',
      description: 'System disk space below 10% threshold',
      severity: 'info',
      status: 'resolved',
      service: 'System',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      details: {
        metric: 'disk_usage',
        threshold: '10%',
        lowest: '8%',
        duration: '2 hours'
      }
    }
  ]

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 400))
        setAlerts(mockAlerts)
      } catch (err) {
        setError('Failed to load alerts')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [])

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getSeverityBadge = (severity) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.status === filter
  })

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`
    }
    return `${minutes}m ago`
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Alerts</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor and manage system alerts and notifications</p>
            </div>
          </div>
          
          {/* Filter buttons */}
          <div className="flex space-x-2">
            {['all', 'active', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === status
                    ? 'bg-red-100 text-red-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {alerts.filter(a => a.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.severity === 'critical' && a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Critical Active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.severity === 'warning' && a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Warning Active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {alerts.length}
              </p>
              <p className="text-sm text-gray-500">Total Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No alerts in the system.' : `No ${filter} alerts.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <li key={alert.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {alert.title}
                          </p>
                          <span className={getSeverityBadge(alert.severity)}>
                            {alert.severity}
                          </span>
                          <span className={getStatusBadge(alert.status)}>
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-400 space-x-4">
                          <span>Service: {alert.service}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                          {alert.resolvedAt && (
                            <>
                              <span>•</span>
                              <span>Resolved {formatTimeAgo(alert.resolvedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {alert.status === 'active' && (
                        <div className="flex space-x-2">
                          <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                            Acknowledge
                          </button>
                          <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Alert Details */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Alert Details:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600">
                      {Object.entries(alert.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default AlertsPage