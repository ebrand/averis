import React, { useState, useEffect, useCallback } from 'react'
import { ChartBarIcon, ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'

const AnalyticsPage = () => {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connection, setConnection] = useState(null)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)

  // Centralized metrics endpoint - System API aggregates all service metrics
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const SYSTEM_API_METRICS_URL = `${apiBaseUrl}/metrics`

  // Handle real-time metrics updates from SignalR
  const handleRealTimeMetricsUpdate = useCallback((metricsUpdate) => {
    console.log('Received real-time metrics update:', metricsUpdate)
    
    // Update the metrics state with the new data
    setMetrics(currentMetrics => {
      if (!currentMetrics) return currentMetrics
      
      // Create a copy of current metrics
      const updatedMetrics = { ...currentMetrics }
      
      // Update or add the service metrics
      const serviceIndex = updatedMetrics.serviceMetrics.findIndex(s => s.name === metricsUpdate.serviceName)
      
      if (serviceIndex !== -1) {
        // Update existing service metrics
        const existingService = updatedMetrics.serviceMetrics[serviceIndex]
        updatedMetrics.serviceMetrics[serviceIndex] = {
          ...existingService,
          requests: metricsUpdate.totalRequests,
          avgResponseTime: Math.round(metricsUpdate.averageResponseTime),
          errorRate: metricsUpdate.errorRate.toFixed(1),
          status: metricsUpdate.errorRate > 5 ? 'degraded' : metricsUpdate.errorRate > 1 ? 'warning' : 'healthy'
        }
      }
      
      // Recalculate system overview metrics
      const totalRequests = updatedMetrics.serviceMetrics.reduce((sum, s) => sum + (s.requests || 0), 0)
      const totalResponseTime = updatedMetrics.serviceMetrics.reduce((sum, s) => sum + (s.avgResponseTime * (s.requests || 0)), 0)
      const totalErrors = updatedMetrics.serviceMetrics.reduce((sum, s) => {
        const errorCount = (s.requests || 0) * (parseFloat(s.errorRate) || 0) / 100
        return sum + errorCount
      }, 0)
      
      updatedMetrics.systemOverview = {
        ...updatedMetrics.systemOverview,
        totalRequests: totalRequests,
        averageResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(1) : 0
      }
      
      return updatedMetrics
    })
  }, [])

  const fetchLiveMetrics = async () => {
    try {
      const response = await fetch(SYSTEM_API_METRICS_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Fetched live metrics from System API:', data)
      
      // Process the centralized service metrics
      const allServiceMetrics = []
      let totalRequests = 0
      let totalResponseTime = 0
      let totalErrors = 0
      let totalServices = 0
      
      if (data.services) {
        Object.values(data.services).forEach(serviceData => {
          const avgResponseTime = serviceData.averageResponseTime || 0
          const errorRate = serviceData.errorRate || 0
          
          allServiceMetrics.push({
            name: serviceData.serviceName,
            requests: serviceData.totalRequests,
            avgResponseTime: Math.round(avgResponseTime),
            errorRate: errorRate.toFixed(1),
            status: errorRate > 5 ? 'degraded' : errorRate > 1 ? 'warning' : 'healthy'
          })
          
          totalRequests += serviceData.totalRequests
          totalResponseTime += avgResponseTime * serviceData.totalRequests
          totalErrors += serviceData.errorCount
          totalServices++
        })
      }

      // Calculate overall system metrics
      const avgSystemResponseTime = totalServices > 0 && totalRequests > 0 
        ? Math.round(totalResponseTime / totalRequests) 
        : 0
      const systemErrorRate = totalRequests > 0 
        ? ((totalErrors / totalRequests) * 100).toFixed(1)
        : 0

      // Use hourly data from System API if available, otherwise generate fallback
      const hourlyData = data.hourly && data.hourly.length > 0 
        ? data.hourly.map(h => ({
            hour: h.hour,
            requests: h.requestCount,
            responseTime: Math.round(h.averageResponseTime),
            errors: h.errorCount
          }))
        : Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            requests: Math.max(1, Math.floor(totalRequests / 24)),
            responseTime: avgSystemResponseTime + Math.floor(Math.random() * 10) - 5,
            errors: Math.max(0, Math.floor(totalErrors / 24))
          }))

      // Define service order and colors
      const serviceOrder = [
        'Product MDM API',
        'Product Staging API', 
        'Pricing MDM API',
        'Customer MDM API',
        'OMS API',
        'ERP API',
        'E-commerce API',
        'System API'
      ]

      const serviceColors = {
      'Product MDM API': { 
        primary: '#1E40AF', 
        secondary: '#2563EB',
        bgClass: 'bg-blue-800',
        borderClass: 'border-blue-600'
      },
      'Product Staging API': { 
        primary: '#1E40AF', 
        secondary: '#2563EB',
        bgClass: 'bg-blue-800',
        borderClass: 'border-blue-600'
      },
      'Pricing MDM API': { 
        primary: '#166534', 
        secondary: '#16A34A',
        bgClass: 'bg-green-800',
        borderClass: 'border-green-600'
      },
      'Customer MDM API': { 
        primary: '#B91C1C', 
        secondary: '#EF4444',
        bgClass: 'bg-red-700',
        borderClass: 'border-red-500'
      },
      'OMS API': { 
        primary: '#6B21A8', 
        secondary: '#9333EA',
        bgClass: 'bg-purple-800',
        borderClass: 'border-purple-600'
      },
      'ERP API': { 
        primary: '#C2410C', 
        secondary: '#EA580C',
        bgClass: 'bg-orange-800',
        borderClass: 'border-orange-600'
      },
      'E-commerce API': { 
        primary: '#4B5563', 
        secondary: '#6B7280',
        bgClass: 'bg-gray-600',
        borderClass: 'border-gray-500'
      },
      'System API': { 
        primary: '#374151', 
        secondary: '#4B5563',
        bgClass: 'bg-gray-700',
        borderClass: 'border-gray-600'
      }
    }

    // Sort service metrics according to defined order
    const orderedServiceMetrics = serviceOrder
      .map(serviceName => {
        const serviceData = allServiceMetrics.find(s => s.name === serviceName)
        if (serviceData) {
          // Add color information to service data
          return {
            ...serviceData,
            colors: serviceColors[serviceName] || serviceColors['System API']
          }
        }
        // Return placeholder for services that aren't running
        return {
          name: serviceName,
          requests: 0,
          avgResponseTime: 0,
          errorRate: 'N/A',
          status: 'offline',
          colors: serviceColors[serviceName] || serviceColors['System API']
        }
      })
      .slice(0, 8) // Limit to the main services

      return {
        systemOverview: {
          totalRequests: totalRequests,
          averageResponseTime: avgSystemResponseTime,
          errorRate: parseFloat(systemErrorRate),
          uptime: 99.5 // This would need to be calculated from actual uptime data
        },
        serviceMetrics: orderedServiceMetrics,
        hourlyData: hourlyData,
        trends: {
          requestsChange: Math.random() * 20 - 10, // Mock trend data for now
          responseTimeChange: Math.random() * 10 - 5,
          errorRateChange: Math.random() * 5 - 2.5,
          uptimeChange: Math.random() * 0.5 - 0.25
        }
      }
    } catch (error) {
      console.error('Failed to fetch metrics from System API:', error.message)
      throw error // Re-throw to trigger fallback to mock data
    }
  }

  // Mock analytics data
  const mockMetrics = {
    systemOverview: {
      totalRequests: 245,
      averageResponseTime: 24,
      errorRate: 0.3,
      uptime: 99.8
    },
    serviceMetrics: [
      {
        name: 'Product MDM API',
        requests: 32,
        avgResponseTime: 15,
        errorRate: 15.6,
        status: 'warning',
        colors: { bgClass: 'bg-blue-800', borderClass: 'border-blue-600' }
      },
      {
        name: 'Product Staging API',
        requests: 8,
        avgResponseTime: 22,
        errorRate: 0.0,
        status: 'healthy',
        colors: { bgClass: 'bg-blue-800', borderClass: 'border-blue-600' }
      },
      {
        name: 'Pricing MDM API',
        requests: 0,
        avgResponseTime: 0,
        errorRate: 'N/A',
        status: 'offline',
        colors: { bgClass: 'bg-green-800', borderClass: 'border-green-600' }
      },
      {
        name: 'Customer MDM API',
        requests: 5,
        avgResponseTime: 28,
        errorRate: 0.0,
        status: 'healthy',
        colors: { bgClass: 'bg-red-700', borderClass: 'border-red-500' }
      },
      {
        name: 'OMS API',
        requests: 0,
        avgResponseTime: 0,
        errorRate: 'N/A',
        status: 'offline',
        colors: { bgClass: 'bg-purple-800', borderClass: 'border-purple-600' }
      },
      {
        name: 'ERP API',
        requests: 0,
        avgResponseTime: 0,
        errorRate: 'N/A',
        status: 'offline',
        colors: { bgClass: 'bg-orange-800', borderClass: 'border-orange-600' }
      },
      {
        name: 'E-commerce API',
        requests: 0,
        avgResponseTime: 0,
        errorRate: 'N/A',
        status: 'offline',
        colors: { bgClass: 'bg-gray-600', borderClass: 'border-gray-500' }
      },
      {
        name: 'System API',
        requests: 1,
        avgResponseTime: 14,
        errorRate: 0.0,
        status: 'healthy',
        colors: { bgClass: 'bg-gray-700', borderClass: 'border-gray-600' }
      }
    ],
    hourlyData: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      requests: Math.floor(Math.random() * 20) + 5,
      responseTime: Math.floor(Math.random() * 50) + 10,
      errors: Math.floor(Math.random() * 3)
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
        // Fetch live metrics from all APIs
        const liveMetrics = await fetchLiveMetrics()
        setMetrics(liveMetrics)
      } catch (err) {
        console.error('Failed to load live metrics, falling back to mock data:', err)
        // Fallback to mock data if live metrics fail
        setMetrics(mockMetrics)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // SignalR connection setup for real-time metrics updates
  useEffect(() => {
    console.log('SignalR useEffect triggered - setting up connection')
    let newConnection = null
    let isCancelled = false
    
    const setupSignalRConnection = async () => {
      try {
        // Prevent multiple concurrent connection attempts
        if (connection && connection.state === 'Connected') {
          console.log('SignalR: Connection already established, skipping setup')
          return
        }

        console.log(`SignalR: Setting up connection to ${apiBaseUrl}/metricsHub`)
        newConnection = new HubConnectionBuilder()
          .withUrl(`${apiBaseUrl}/metricsHub`)
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build()
        
        console.log('SignalR: HubConnection created, setting up event handlers')

        // Set up event handler for metrics updates
        newConnection.on('MetricsUpdated', (metricsUpdate) => {
          console.log('SignalR: Received MetricsUpdated event:', metricsUpdate)
          // Directly update metrics state instead of using callback
          setMetrics(currentMetrics => {
            if (!currentMetrics) return currentMetrics
            
            // Create a copy of current metrics
            const updatedMetrics = { ...currentMetrics }
            
            // Update or add the service metrics
            const serviceIndex = updatedMetrics.serviceMetrics.findIndex(s => s.name === metricsUpdate.serviceName)
            
            if (serviceIndex !== -1) {
              // Update existing service metrics
              const existingService = updatedMetrics.serviceMetrics[serviceIndex]
              updatedMetrics.serviceMetrics[serviceIndex] = {
                ...existingService,
                requests: metricsUpdate.totalRequests,
                avgResponseTime: Math.round(metricsUpdate.averageResponseTime),
                errorRate: metricsUpdate.errorRate.toFixed(1),
                status: metricsUpdate.errorRate > 5 ? 'degraded' : metricsUpdate.errorRate > 1 ? 'warning' : 'healthy'
              }
            }
            
            // Recalculate system overview metrics
            const totalRequests = updatedMetrics.serviceMetrics.reduce((sum, s) => sum + (s.requests || 0), 0)
            const totalResponseTime = updatedMetrics.serviceMetrics.reduce((sum, s) => sum + (s.avgResponseTime * (s.requests || 0)), 0)
            const totalErrors = updatedMetrics.serviceMetrics.reduce((sum, s) => {
              const errorCount = (s.requests || 0) * (parseFloat(s.errorRate) || 0) / 100
              return sum + errorCount
            }, 0)
            
            updatedMetrics.systemOverview = {
              ...updatedMetrics.systemOverview,
              totalRequests: totalRequests,
              averageResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
              errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(1) : 0
            }
            
            return updatedMetrics
          })
        })

        // Handle connection events - using correct SignalR JavaScript API
        newConnection.onclose = (error) => {
          console.log('SignalR: Connection closed', error)
          setIsRealTimeConnected(false)
        }

        newConnection.onreconnecting = (error) => {
          console.log('SignalR: Reconnecting to metrics hub...', error)
          setIsRealTimeConnected(false)
        }

        newConnection.onreconnected = (connectionId) => {
          console.log('SignalR: Reconnected to metrics hub', connectionId)
          setIsRealTimeConnected(true)
        }

        // Start the connection with proper error handling
        console.log('SignalR: Starting connection...')
        await newConnection.start()
        
        // Check if component was unmounted during async operation
        if (isCancelled) {
          console.log('SignalR: Component unmounted during connection, stopping...')
          await newConnection.stop()
          return
        }
        
        console.log('SignalR: Connection established successfully')
        setIsRealTimeConnected(true)
        setConnection(newConnection)
        console.log('SignalR: Connection ready for metrics updates')
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to establish SignalR connection:', error)
          setIsRealTimeConnected(false)
        }
      }
    }

    setupSignalRConnection()
      .then(() => {
        if (!isCancelled) {
          console.log('SignalR setup completed successfully')
        }
      })
      .catch(error => {
        if (!isCancelled) {
          console.error('SignalR setup failed:', error)
        }
      })

    // Cleanup function
    return () => {
      isCancelled = true
      if (newConnection) {
        console.log('SignalR: Stopping connection...')
        newConnection.stop().catch(err => console.log('Error stopping connection:', err))
      }
    }
  }, []) // Remove callback from dependency array to prevent reconnections

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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Real-time Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">System performance metrics and trends</p>
            </div>
          </div>
          
          {/* Real-time Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isRealTimeConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isRealTimeConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {isRealTimeConnected ? 'Live Updates Active' : 'Connecting...'}
            </div>
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
                      {Math.round(Math.abs(metrics.trends.requestsChange))}%
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
                      {Math.round(Math.abs(metrics.trends.responseTimeChange))}%
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
                      {Math.round(metrics.systemOverview.errorRate)}%
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.errorRateChange, true)}`}>
                      {getTrendIcon(metrics.trends.errorRateChange)}
                      {Math.round(Math.abs(metrics.trends.errorRateChange))}%
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
                      {Math.round(metrics.systemOverview.uptime)}%
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(metrics.trends.uptimeChange)}`}>
                      {getTrendIcon(metrics.trends.uptimeChange)}
                      {Math.round(Math.abs(metrics.trends.uptimeChange))}%
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
                  <tr key={service.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {/* Colored end cap - made larger and more prominent */}
                        <div 
                          className={`w-2 h-12 ${service.colors?.bgClass || 'bg-gray-500'} rounded-md mr-4 flex-shrink-0 shadow-sm`}
                          title={`${service.name} - Color from Platform Palette`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{service.name}</div>
                          {service.status === 'offline' && (
                            <div className="text-xs text-gray-500">Service not running</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof service.requests === 'number' ? formatNumber(service.requests) : service.requests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof service.avgResponseTime === 'number' ? `${service.avgResponseTime}ms` : service.avgResponseTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof service.errorRate === 'number' ? `${Math.round(service.errorRate)}%` : service.errorRate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        service.status === 'healthy' 
                          ? 'bg-green-100 text-green-800' 
                          : service.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-800'
                          : service.status === 'offline'
                          ? 'bg-gray-100 text-gray-600'
                          : service.status === 'error'
                          ? 'bg-red-100 text-red-800'
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