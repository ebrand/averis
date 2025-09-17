import React, { useState, useEffect } from 'react'
import { ChartBarIcon, ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

const AnalyticsPage = () => {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock analytics data
  const mockMetrics = {
    systemOverview: {
      totalRequests: 125430,
      averageResponseTime: 24,
      errorRate: 0.3,
      uptime: 99.8
    },
    serviceMetrics: [
      {
        name: 'Product MDM API',
        requests: 45230,
        avgResponseTime: 15,
        errorRate: 0.1,
        status: 'healthy'
      },
      {
        name: 'Pricing MDM API',
        requests: 32150,
        avgResponseTime: 12,
        errorRate: 0.2,
        status: 'healthy'
      },
      {
        name: 'E-commerce API',
        requests: 48050,
        avgResponseTime: 45,
        errorRate: 0.8,
        status: 'degraded'
      }
    ],
    hourlyData: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      requests: Math.floor(Math.random() * 1000) + 500,
      responseTime: Math.floor(Math.random() * 50) + 10,
      errors: Math.floor(Math.random() * 20)
    })),
    trends: {
      requestsChange: 12.5,
      responseTimeChange: -8.3,
      errorRateChange: -15.2,
      uptimeChange: 0.1
    }
  }

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        setMetrics(mockMetrics)
      } catch (err) {
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getTrendIcon = (change) => {
    if (change > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    } else if (change < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    }
    return <div className="h-4 w-4" />
  }

  const getTrendColor = (change, isInverse = false) => {
    if (isInverse) {
      // For metrics where lower is better (like response time, error rate)
      if (change > 0) return 'text-red-600'
      if (change < 0) return 'text-green-600'
    } else {
      // For metrics where higher is better (like uptime, requests)
      if (change > 0) return 'text-green-600'
      if (change < 0) return 'text-red-600'
    }
    return 'text-gray-600'
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
          <ChartBarIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Analytics</h3>
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
          <ChartBarIcon className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-time Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">System performance metrics and trends</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(metrics.systemOverview.totalRequests)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.requestsChange)}`}>
                      {getTrendIcon(metrics.trends.requestsChange)}
                      <span className="sr-only">
                        {metrics.trends.requestsChange > 0 ? 'Increased' : 'Decreased'} by
                      </span>
                      {Math.abs(metrics.trends.requestsChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⚡</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics.systemOverview.averageResponseTime}ms
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.responseTimeChange, true)}`}>
                      {getTrendIcon(metrics.trends.responseTimeChange)}
                      {Math.abs(metrics.trends.responseTimeChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🚨</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Error Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics.systemOverview.errorRate}%
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.errorRateChange, true)}`}>
                      {getTrendIcon(metrics.trends.errorRateChange)}
                      {Math.abs(metrics.trends.errorRateChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">System Uptime</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics.systemOverview.uptime}%
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.uptimeChange)}`}>
                      {getTrendIcon(metrics.trends.uptimeChange)}
                      {Math.abs(metrics.trends.uptimeChange)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Performance Table */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.serviceMetrics.map((service) => (
                  <tr key={service.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(service.requests)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.avgResponseTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.errorRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        service.status === 'healthy' 
                          ? 'bg-green-100 text-green-800' 
                          : service.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Simple Chart Representation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">24-Hour Request Volume</h3>
          <div className="flex items-end space-x-1 h-64">
            {metrics.hourlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div 
                  className="bg-red-500 rounded-t-sm min-h-1 transition-all duration-300 hover:bg-red-600"
                  style={{ 
                    height: `${(data.requests / 1500) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`Hour ${data.hour}: ${data.requests} requests`}
                />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {data.hour}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Hours (0-23) - Hover bars for details
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage