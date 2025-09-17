import React, { useState, useEffect } from 'react'
import { ShieldCheckIcon, XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const HealthChecksPage = () => {
  const [healthChecks, setHealthChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock health check data - in real implementation this would come from the backend
  const mockHealthChecks = [
    {
      id: 'product-mdm-db',
      name: 'Product MDM Database',
      service: 'Product MDM API',
      type: 'database',
      status: 'healthy',
      description: 'PostgreSQL connection to averis_product schema',
      lastChecked: new Date(),
      responseTime: '5ms',
      details: {
        host: 'localhost:5432',
        database: 'commerce_db',
        schema: 'averis_product',
        connectionPool: '8/10 connections used'
      }
    },
    {
      id: 'pricing-mdm-db',
      name: 'Pricing MDM Database',
      service: 'Pricing MDM API',
      type: 'database',
      status: 'healthy',
      description: 'PostgreSQL connection to averis_pricing schema',
      lastChecked: new Date(),
      responseTime: '3ms',
      details: {
        host: 'localhost:5432',
        database: 'commerce_db',
        schema: 'averis_pricing',
        connectionPool: '5/10 connections used'
      }
    },
    {
      id: 'averis_ecomm-db',
      name: 'E-commerce Database',
      service: 'E-commerce API',
      type: 'database',
      status: 'degraded',
      description: 'PostgreSQL connection to averis_ecomm schema',
      lastChecked: new Date(),
      responseTime: '25ms',
      details: {
        host: 'localhost:5432',
        database: 'commerce_db',
        schema: 'averis_ecomm',
        connectionPool: '9/10 connections used'
      }
    },
    {
      id: 'rabbitmq-connection',
      name: 'RabbitMQ Message Broker',
      service: 'All Services',
      type: 'messaging',
      status: 'healthy',
      description: 'Message broker for inter-service communication',
      lastChecked: new Date(),
      responseTime: '2ms',
      details: {
        host: 'localhost:5672',
        vhost: '/commerce',
        queues: '12 queues active',
        messages: '45 messages in queue'
      }
    },
    {
      id: 'external-api',
      name: 'External Payment Gateway',
      service: 'E-commerce API',
      type: 'external',
      status: 'unhealthy',
      description: 'Third-party payment processing service',
      lastChecked: new Date(),
      responseTime: 'timeout',
      details: {
        endpoint: 'https://api.payments.example.com',
        lastError: 'Connection timeout after 30 seconds',
        retries: '3/3 attempts failed'
      }
    },
    {
      id: 'redis-cache',
      name: 'Redis Cache',
      service: 'All Services',
      type: 'cache',
      status: 'healthy',
      description: 'Distributed caching layer',
      lastChecked: new Date(),
      responseTime: '1ms',
      details: {
        host: 'localhost:6379',
        memory: '245MB used',
        keys: '1,247 cached objects',
        hitRate: '94.2% hit rate'
      }
    }
  ]

  useEffect(() => {
    const loadHealthChecks = async () => {
      setLoading(true)
      try {
        // In real implementation, fetch from API
        await new Promise(resolve => setTimeout(resolve, 300))
        setHealthChecks(mockHealthChecks)
      } catch (err) {
        setError('Failed to load health checks')
      } finally {
        setLoading(false)
      }
    }

    loadHealthChecks()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'degraded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'unhealthy':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'database':
        return '🗄️'
      case 'messaging':
        return '📨'
      case 'external':
        return '🌐'
      case 'cache':
        return '⚡'
      default:
        return '🔍'
    }
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
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Health Checks</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Checks</h1>
            <p className="mt-1 text-sm text-gray-500">Detailed health monitoring for all system components</p>
          </div>
        </div>
      </div>

      {/* Health Checks List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {healthChecks.map((check) => (
            <li key={check.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getTypeIcon(check.type)}</span>
                    <div>
                      <div className="flex items-center">
                        {getStatusIcon(check.status)}
                        <p className="ml-2 text-sm font-medium text-gray-900">
                          {check.name}
                        </p>
                        <span className={`ml-3 ${getStatusBadge(check.status)}`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{check.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Service: {check.service} • Response: {check.responseTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Last checked: {check.lastChecked.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                    {Object.entries(check.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-green-600">
                {healthChecks.filter(c => c.status === 'healthy').length}
              </p>
              <p className="text-sm text-gray-500">Healthy</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-yellow-600">
                {healthChecks.filter(c => c.status === 'degraded').length}
              </p>
              <p className="text-sm text-gray-500">Degraded</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-red-600">
                {healthChecks.filter(c => c.status === 'unhealthy').length}
              </p>
              <p className="text-sm text-gray-500">Unhealthy</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {healthChecks.length}
              </p>
              <p className="text-sm text-gray-500">Total Checks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HealthChecksPage