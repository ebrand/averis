import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import { getProductStats, getDataSourceInfo } from '../services/productDataService'
import systemStatusService from '../services/systemStatusService'
import { 
  CubeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export const DashboardPage = () => {
  const { userProfile } = useAuth()
  const { isUserAdmin, isAdmin, isProductAdmin } = useRole()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState('unknown')
  const [systemStatus, setSystemStatus] = useState(null)

  // Load stats and system status
  useEffect(() => {
    const loadData = async () => {
      try {
        const [result, status] = await Promise.all([
          getProductStats(),
          systemStatusService.getSystemStatus()
        ])
        setStats(result)
        setDataSource(result.source || 'unknown')
        setSystemStatus(status)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const staticStats = [
    {
      name: 'Total Products',
      value: '2,847',
      change: '+12%',
      changeType: 'increase',
      icon: CubeIcon,
      color: 'blue'
    },
    {
      name: 'Active Categories',
      value: '142',
      change: '+3%',
      changeType: 'increase',
      icon: ClipboardDocumentListIcon,
      color: 'green'
    },
    {
      name: 'Revenue Impact',
      value: '$1.2M',
      change: '+8%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'purple'
    },
    {
      name: 'API Calls',
      value: '45.2K',
      change: '+22%',
      changeType: 'increase',
      icon: ChartBarIcon,
      color: 'orange'
    }
  ]

  // Calculate dynamic stats from loaded data
  const dynamicStats = stats ? [
    {
      name: 'Total Products',
      value: stats.total?.toLocaleString() || '0',
      change: '+12%', // This could be calculated from historical data
      changeType: 'increase',
      icon: CubeIcon,
      color: 'blue'
    },
    {
      name: 'Active Categories',
      value: stats.categories?.active?.toString() || '0',
      change: `+${Math.max(0, stats.categories?.active - stats.categories?.total + 5)}`,
      changeType: 'increase',
      icon: ClipboardDocumentListIcon,
      color: 'green'
    },
    {
      name: 'Available Products',
      value: stats.available?.toLocaleString() || '0',
      change: `${Math.round((stats.available / stats.total) * 100)}%`,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'purple'
    },
    {
      name: 'Web Displayed',
      value: stats.webDisplayed?.toLocaleString() || '0',
      change: `${Math.round((stats.webDisplayed / stats.total) * 100)}%`,
      changeType: 'increase',
      icon: ChartBarIcon,
      color: 'orange'
    }
  ] : staticStats

  const recentActivity = [
    { action: 'Product updated', item: 'iPhone 15 Pro Max', user: 'John Doe', time: '2 minutes ago' },
    { action: 'New product added', item: 'MacBook Air M3', user: 'Jane Smith', time: '15 minutes ago' },
    { action: 'Price updated', item: 'iPad Pro 12.9"', user: 'Mike Johnson', time: '1 hour ago' },
    { action: 'Category created', item: 'Smart Home', user: 'Sarah Wilson', time: '2 hours ago' },
    { action: 'Batch import', item: '25 products', user: 'System', time: '3 hours ago' }
  ]

  const quickActions = [
    { name: 'Add Product', href: '/products/create', icon: CubeIcon, color: 'blue' },
    { name: 'All Products', href: '/products', icon: ClipboardDocumentListIcon, color: 'green' },
    ...(isProductAdmin() || isAdmin() ? [
      { name: 'Manage Categories', href: '/products/categories', icon: CurrencyDollarIcon, color: 'orange' }
    ] : []),
    ...(isUserAdmin() || isAdmin() ? [
      { name: 'User Management', href: '/users', icon: UserGroupIcon, color: 'purple' }
    ] : [])
  ]

  const getStatColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    }
    return colors[color] || 'bg-gray-500'
  }

  const getStatBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20',
      green: 'bg-green-50 dark:bg-green-900/20',
      purple: 'bg-purple-50 dark:bg-purple-900/20', 
      orange: 'bg-orange-50 dark:bg-orange-900/20'
    }
    return colors[color] || 'bg-gray-50 dark:bg-gray-800'
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
              Welcome back, {userProfile?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">
              Here's what's happening with your product data today.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Last login:</span>
              <span className="font-medium">
                {userProfile?.lastLoginAt ? 
                  new Date(userProfile.lastLoginAt).toLocaleDateString() : 
                  'Today'
                }
              </span>
            </div>
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
          dynamicStats.map((stat) => (
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
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest changes to your product catalog</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-blue-600 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.item} by {activity.user}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Common tasks and shortcuts</p>
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

          {/* System Status */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Status</h3>
            </div>
            <div className="p-6 space-y-4">
              {systemStatus ? (
                <>
                  {/* API Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">API Server</div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        systemStatusService.getStatusIndicator(systemStatus.components.api.status).color
                      }`} />
                      <div className={`text-sm font-medium ${
                        systemStatusService.getStatusIndicator(systemStatus.components.api.status).textColor
                      }`}>
                        {systemStatus.components.api.message}
                      </div>
                    </div>
                  </div>
                  
                  {/* Users Database Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Users Database</div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        systemStatusService.getStatusIndicator(systemStatus.components.usersDatabase.status).color
                      }`} />
                      <div className={`text-sm font-medium ${
                        systemStatusService.getStatusIndicator(systemStatus.components.usersDatabase.status).textColor
                      }`}>
                        {systemStatus.components.usersDatabase.message}
                      </div>
                    </div>
                  </div>
                  
                  {/* Products Database Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Products Database</div>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        systemStatusService.getStatusIndicator(systemStatus.components.productsDatabase.status).color
                      }`} />
                      <div className={`text-sm font-medium ${
                        systemStatusService.getStatusIndicator(systemStatus.components.productsDatabase.status).textColor
                      }`}>
                        {systemStatus.components.productsDatabase.message}
                      </div>
                    </div>
                  </div>
                  
                  {/* RabbitMQ Status */}
                  {systemStatus.components.rabbitMQ && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">RabbitMQ</div>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          systemStatusService.getStatusIndicator(systemStatus.components.rabbitMQ.status).color
                        }`} />
                        <div className={`text-sm font-medium ${
                          systemStatusService.getStatusIndicator(systemStatus.components.rabbitMQ.status).textColor
                        }`}>
                          {systemStatus.components.rabbitMQ.message}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Overall System Health */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Overall Health</div>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          systemStatusService.getStatusIndicator(systemStatus.overall.status).color
                        }`} />
                        <div className={`text-sm font-medium ${
                          systemStatusService.getStatusIndicator(systemStatus.overall.status).textColor
                        }`}>
                          {systemStatus.overall.healthPercentage}% ({systemStatus.overall.message})
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  {systemStatus.components.usersDatabase.details && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Users: {systemStatus.components.usersDatabase.details.totalUsers} total
                    </div>
                  )}
                  {systemStatus.components.productsDatabase.details && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Products: {systemStatus.components.productsDatabase.details.totalProducts || 0} total, {systemStatus.components.productsDatabase.details.activeProducts || 0} active
                    </div>
                  )}
                  {systemStatus.components.rabbitMQ?.details && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      RabbitMQ: {systemStatus.components.rabbitMQ.details.connected ? 'Connected' : 'Disconnected'}, 
                      {systemStatus.components.rabbitMQ.details.consuming ? ' Consumer active' : ' Consumer inactive'}, 
                      Queues: {systemStatus.components.rabbitMQ.details.queues?.join(', ') || 'None'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Fallback to old display while loading */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">System Status</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {loading ? 'Checking...' : 'Ready'}
                    </div>
                  </div>
                </>
              )}
              
              {/* Last Update */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Update</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {loading ? 'Loading...' : (systemStatus ? 
                    new Date(systemStatus.timestamp).toLocaleTimeString() : 'Just now'
                  )}
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