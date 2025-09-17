import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { navigateToApp, getPlatformApps, createNavHandler } from '../utils/crossAppNavigation'
import { 
  ServerIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

export const DashboardPage = () => {
  const { userProfile } = useAuth()
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Mock system metrics - in real implementation this would come from monitoring APIs
  const mockMetrics = {
    services: {
      total: 6,
      healthy: 4,
      degraded: 1,
      unhealthy: 1
    },
    performance: {
      avgResponseTime: 24,
      totalRequests: 125430,
      errorRate: 0.3,
      uptime: 99.8
    },
    alerts: {
      critical: 2,
      warning: 1,
      info: 0
    }
  }

  // Load system metrics
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        setSystemMetrics(mockMetrics)
      } catch (error) {
        console.error('Failed to load system metrics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // System overview stats
  const systemStats = systemMetrics ? [
    {
      name: 'Total Services',
      value: systemMetrics.services.total.toString(),
      change: '+0%',
      changeType: 'neutral',
      icon: ServerIcon,
      color: 'red'
    },
    {
      name: 'Healthy Services',
      value: systemMetrics.services.healthy.toString(),
      change: `${Math.round((systemMetrics.services.healthy / systemMetrics.services.total) * 100)}%`,
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      name: 'Avg Response Time',
      value: `${systemMetrics.performance.avgResponseTime}ms`,
      change: '-8%',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'blue'
    },
    {
      name: 'System Uptime',
      value: `${systemMetrics.performance.uptime}%`,
      change: '+0.1%',
      changeType: 'increase',
      icon: ShieldCheckIcon,
      color: 'purple'
    }
  ] : [
    {
      name: 'Total Services',
      value: '6',
      change: '+0%',
      changeType: 'neutral',
      icon: ServerIcon,
      color: 'red'
    },
    {
      name: 'Healthy Services',
      value: '4',
      change: '67%',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      name: 'Avg Response Time',
      value: '24ms',
      change: '-8%',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'blue'
    },
    {
      name: 'System Uptime',
      value: '99.8%',
      change: '+0.1%',
      changeType: 'increase',
      icon: ShieldCheckIcon,
      color: 'purple'
    }
  ]

  const systemActivity = [
    { event: 'Service Alert', description: 'E-commerce API response time degraded', severity: 'warning', time: '3 minutes ago' },
    { event: 'Health Check', description: 'All database connections verified', severity: 'info', time: '5 minutes ago' },
    { event: 'Service Recovery', description: 'Payment gateway connection restored', severity: 'success', time: '8 minutes ago' },
    { event: 'System Alert', description: 'Database connection pool at 90%', severity: 'critical', time: '12 minutes ago' },
    { event: 'Auto-Scale', description: 'Product MDM API scaled to 3 instances', severity: 'info', time: '15 minutes ago' }
  ]

  const quickActions = [
    { name: 'View Services', href: '/services', icon: ServerIcon, color: 'red' },
    { name: 'Health Checks', href: '/services/health', icon: ShieldCheckIcon, color: 'green' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, color: 'blue' },
    { name: 'Active Alerts', href: '/alerts/active', icon: ExclamationTriangleIcon, color: 'orange' }
  ]

  // Platform Applications with icons and colors
  const platformApps = [
    { 
      key: 'product', 
      name: 'Averis Product', 
      description: 'Product master data management', 
      icon: CubeIcon, 
      color: 'blue',
      status: 'healthy' 
    },
    { 
      key: 'pricing', 
      name: 'Averis Pricing', 
      description: 'Pricing & catalog management', 
      icon: CurrencyDollarIcon, 
      color: 'green',
      status: 'healthy' 
    },
    { 
      key: 'averis_ecomm', 
      name: 'Averis Store', 
      description: 'E-commerce platform', 
      icon: ShoppingCartIcon, 
      color: 'purple',
      status: 'healthy' 
    }
  ]

  const getStatColor = (color) => {
    const colors = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    }
    return colors[color] || 'bg-gray-500'
  }

  const getStatBgColor = (color) => {
    const colors = {
      red: 'bg-red-50 dark:bg-red-900/20',
      blue: 'bg-blue-50 dark:bg-blue-900/20',
      green: 'bg-green-50 dark:bg-green-900/20',
      purple: 'bg-purple-50 dark:bg-purple-900/20', 
      orange: 'bg-orange-50 dark:bg-orange-900/20'
    }
    return colors[color] || 'bg-gray-50 dark:bg-gray-800'
  }

  const getAppStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 dark:text-green-400',
      degraded: 'text-yellow-600 dark:text-yellow-400',
      unhealthy: 'text-red-600 dark:text-red-400'
    }
    return colors[status] || 'text-gray-600 dark:text-gray-400'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      success: 'text-green-600',
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600'
    }
    return colors[severity] || 'text-gray-600'
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success':
        return '✅'
      case 'info':
        return 'ℹ️'
      case 'warning':
        return '⚠️'
      case 'critical':
        return '🚨'
      default:
        return '📍'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Commerce Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring of all commerce platform services and infrastructure.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Last Updated:</span>
              <span className="font-medium">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Applications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Averis Platform</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Navigate to platform applications with single sign-on</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformApps.map((app) => (
              <button
                key={app.key}
                onClick={createNavHandler(app.key)}
                className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-colors text-left w-full group"
              >
                <div className={`flex-shrink-0 p-3 ${getStatColor(app.color)} rounded-lg group-hover:scale-105 transition-transform`}>
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {app.name}
                    </div>
                    <div className={`text-xs ${getAppStatusColor(app.status)} font-medium`}>
                      ● {app.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {app.description}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Click to navigate with SSO →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="animate-pulse flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          systemStats.map((stat) => (
          <div
            key={stat.name}
            className={`relative overflow-hidden rounded-lg ${getStatBgColor(stat.color)} p-6 shadow-sm border border-gray-200 dark:border-gray-600`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`inline-flex items-center justify-center p-2 ${getStatColor(stat.color)} rounded-md`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      <span className="sr-only">
                        {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                      </span>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* System Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Activity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recent system events and alerts</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {systemActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="text-xl">
                          {getSeverityIcon(activity.severity)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.event}
                        </div>
                        <div className={`text-sm ${getSeverityColor(activity.severity)}`}>
                          {activity.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor and manage system components</p>
            </div>
            <div className="p-6 space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-colors"
                >
                  <div className={`flex-shrink-0 p-2 ${getStatColor(action.color)} rounded-md`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Alert Summary */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Alert Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              {systemMetrics ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2 bg-red-500" />
                      <div className="text-sm font-medium text-red-600">
                        {systemMetrics.alerts.critical} active
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Warning Alerts</div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2 bg-yellow-500" />
                      <div className="text-sm font-medium text-yellow-600">
                        {systemMetrics.alerts.warning} active
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Info Alerts</div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2 bg-blue-500" />
                      <div className="text-sm font-medium text-blue-600">
                        {systemMetrics.alerts.info} active
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests (24h)</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {systemMetrics.performance.totalRequests.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {systemMetrics.performance.errorRate}%
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Update</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage