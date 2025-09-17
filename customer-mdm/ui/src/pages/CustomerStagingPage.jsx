import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { io } from 'socket.io-client'
import { 
  CircleStackIcon,
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import CustomerForm from '../components/forms/CustomerForm'

const CustomerStagingPage = () => {
  const navigate = useNavigate()
  const { canAccessAdminFeatures } = useRole()
  const [stagingCustomers, setStagingCustomers] = useState([])
  const [productionCustomers, setProductionCustomers] = useState([])
  const [stagingStats, setStagingStats] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [syncingCustomers, setSyncingCustomers] = useState(new Set())
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  const fetchStagingData = async () => {
    try {
      // Fetch staging customers
      const stagingResponse = await fetch('http://localhost:6008/api/customers', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (!stagingResponse.ok) {
        throw new Error(`Staging API error: ${stagingResponse.status}`)
      }
      
      const stagingData = await stagingResponse.json()
      setStagingCustomers(stagingData.customers || [])
      
      // Fetch staging stats
      const statsResponse = await fetch('http://localhost:6008/api/customers/stats', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStagingStats(statsData)
      }
      
      // Fetch comparison data
      const comparisonResponse = await fetch('http://localhost:6008/api/customers/comparison', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (comparisonResponse.ok) {
        const comparisonDataResult = await comparisonResponse.json()
        setComparisonData(comparisonDataResult)
      }
      
    } catch (err) {
      console.error('Error fetching staging data:', err)
      setError('Failed to load staging data: ' + err.message)
    }
  }

  const fetchProductionData = async () => {
    try {
      // Fetch production customers for comparison
      const productionResponse = await fetch('http://localhost:6007/api/customers', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (productionResponse.ok) {
        const productionData = await productionResponse.json()
        setProductionCustomers(productionData.data || [])
      }
      
    } catch (err) {
      console.error('Error fetching production data:', err)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchStagingData(), fetchProductionData()])
    } finally {
      setRefreshing(false)
    }
  }

  const handleCustomerDoubleClick = async (customerId) => {
    try {
      setModalLoading(true)
      // Fetch the customer data from the production API for editing
      const response = await fetch(`http://localhost:6007/api/customers/${customerId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (response.ok) {
        const customer = await response.json()
        setSelectedCustomer(customer)
        setIsModalOpen(true)
      } else {
        console.error('Failed to fetch customer for editing')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleModalSubmit = async (formData) => {
    try {
      setModalLoading(true)
      
      const response = await fetch(`http://localhost:6007/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsModalOpen(false)
        setSelectedCustomer(null)
        // Refresh both production and staging data
        await refreshData()
      } else {
        console.error('Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
  }

  const handleSyncCustomer = async (customerId, customerEmail) => {
    try {
      // Add to syncing customers set
      setSyncingCustomers(prev => new Set(prev).add(customerId))
      
      const response = await fetch(`http://localhost:6007/api/customers/${customerId}/sync`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Sync initiated:', result.message)
        
        // Real-time updates via Socket.IO will handle the refresh automatically
        // No need for manual setTimeout refresh
        
      } else {
        console.error('Failed to sync customer')
      }
    } catch (error) {
      console.error('Error syncing customer:', error)
    } finally {
      // Remove from syncing customers set after a delay
      setTimeout(() => {
        setSyncingCustomers(prev => {
          const newSet = new Set(prev)
          newSet.delete(customerId)
          return newSet
        })
      }, 2000)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchStagingData(), fetchProductionData()])
      } catch (err) {
        setError('Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Socket.IO connection and real-time updates
  useEffect(() => {
    console.log('🔗 CustomerStagingPage: Setting up Socket.IO connection...')
    
    // Create Socket.IO connection to customer staging ingest service
    const newSocket = io('http://localhost:9008', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      forceNew: true
    })

    setSocket(newSocket)

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ CustomerStagingPage: Socket.IO connected')
      setIsConnected(true)
      
      // Join the customer-mdm room for notifications
      newSocket.emit('join-room', 'customer-mdm')
      console.log('🏠 CustomerStagingPage: Joined customer-mdm room')
    })

    newSocket.on('disconnect', () => {
      console.log('❌ CustomerStagingPage: Socket.IO disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔥 CustomerStagingPage: Socket.IO connection error:', error)
      setIsConnected(false)
    })

    // Listen for customer update notifications
    newSocket.on('customer-updated', (notification) => {
      console.log('📨 CustomerStagingPage: Received customer-updated notification:', notification)
      
      // Automatically refresh staging data when customer is updated
      fetchStagingData()
    })

    // Listen for dashboard notifications too
    newSocket.on('customer-staging-sync', (notification) => {
      console.log('📊 CustomerStagingPage: Received customer-staging-sync notification:', notification)
      
      // Automatically refresh staging data when sync occurs
      fetchStagingData()
    })

    // Cleanup on unmount
    return () => {
      console.log('🔌 CustomerStagingPage: Cleaning up Socket.IO connection')
      newSocket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customer staging data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load Staging Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={refreshData} 
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CircleStackIcon className="h-8 w-8 text-red-700 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Staging</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Analytics and comparison between production and staging customer data
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Live Updates' : 'Disconnected'}
                </span>
              </div>
              <button 
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Analytics Cards */}
        {stagingStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Staging Customers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stagingStats.totalCustomers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        High Value Customers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stagingStats.highValueCustomers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EyeIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Recently Active
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stagingStats.recentlyActive}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {comparisonData && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Data Freshness
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {comparisonData.comparisonMetrics.dataFreshness ? 
                            `${Math.round(comparisonData.comparisonMetrics.dataFreshness.split(':')[1])}min ago` : 
                            'N/A'
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Side-by-Side Customer Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Customers List */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {productionCustomers.length} Production Customers (MDM)
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-blue-100 dark:bg-blue-900/30 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Disclosure
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productionCustomers
                    .sort((a, b) => {
                      const aLast = a.lastName || '';
                      const bLast = b.lastName || '';
                      const aFirst = a.firstName || '';
                      const bFirst = b.firstName || '';
                      
                      if (aLast !== bLast) {
                        return aLast.localeCompare(bLast);
                      }
                      return aFirst.localeCompare(bFirst);
                    })
                    .map((customer, index) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors ${
                        index % 2 === 0 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-gray-50 dark:bg-gray-750'
                      }`}
                      onDoubleClick={() => handleCustomerDoubleClick(customer.id)}
                      title="Double-click to edit customer in modal"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-700 font-medium text-xs">
                                {customer.firstName?.[0] || customer.email?.[0] || '?'}
                                {customer.lastName?.[0] || ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.lastName || ''}{customer.lastName && customer.firstName ? ', ' : ''}{customer.firstName || customer.email || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {customer.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          customer.disclosureLevel === 'hot' 
                            ? 'bg-red-100 text-red-800' 
                            : customer.disclosureLevel === 'warm'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.disclosureLevel?.toUpperCase() || 'COLD'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSyncCustomer(customer.id, customer.email)
                          }}
                          disabled={syncingCustomers.has(customer.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                            syncingCustomers.has(customer.id)
                              ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                          }`}
                          title={syncingCustomers.has(customer.id) ? 'Syncing...' : 'Sync to staging'}
                        >
                          {syncingCustomers.has(customer.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                              Syncing
                            </>
                          ) : (
                            <>
                              <ArrowRightIcon className="h-3 w-3 mr-1" />
                              Sync
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productionCustomers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No production customers found</p>
              </div>
            )}
          </div>

          {/* Staging Customers List */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {stagingCustomers.length} Staging Customers (Cache)
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-red-100 dark:bg-red-900/30 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900 dark:text-red-200 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900 dark:text-red-200 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900 dark:text-red-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900 dark:text-red-200 uppercase tracking-wider">
                      Disclosure
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900 dark:text-red-200 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stagingCustomers
                    .sort((a, b) => {
                      const aLast = (a.lastName && a.lastName.trim()) || '';
                      const bLast = (b.lastName && b.lastName.trim()) || '';
                      const aFirst = (a.firstName && a.firstName.trim()) || '';
                      const bFirst = (b.firstName && b.firstName.trim()) || '';
                      
                      if (aLast !== bLast) {
                        return aLast.localeCompare(bLast);
                      }
                      return aFirst.localeCompare(bFirst);
                    })
                    .map((customer, index) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors ${
                        index % 2 === 0 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-gray-50 dark:bg-gray-750'
                      }`}
                      onDoubleClick={() => handleCustomerDoubleClick(customer.id)}
                      title="Double-click to edit customer in modal"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-700 font-medium text-xs">
                                {(customer.firstName && customer.firstName.trim() && customer.firstName[0]) || (customer.email && customer.email[0]) || '?'}
                                {(customer.lastName && customer.lastName.trim() && customer.lastName[0]) || ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {(() => {
                              const lastName = customer.lastName && customer.lastName.trim() ? customer.lastName.trim() : '';
                              const firstName = customer.firstName && customer.firstName.trim() ? customer.firstName.trim() : '';
                              
                              if (lastName && firstName) {
                                return `${lastName}, ${firstName}`;
                              } else if (lastName) {
                                return lastName;
                              } else if (firstName) {
                                return firstName;
                              } else {
                                return customer.email || 'Anonymous';
                              }
                            })()}
                          </span>
                          {customer.isHighValue && (
                            <span className="text-purple-600 font-medium">💎</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {customer.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          customer.disclosureLevel === 'hot' 
                            ? 'bg-red-100 text-red-800' 
                            : customer.disclosureLevel === 'warm'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.disclosureLevel?.toUpperCase() || 'COLD'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stagingCustomers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <CircleStackIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No customers found in staging environment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Edit Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Customer: {selectedCustomer.displayName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim() || selectedCustomer.email}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={handleModalCancel}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">
              <CustomerForm
                customer={selectedCustomer}
                onSubmit={handleModalSubmit}
                onCancel={handleModalCancel}
                loading={modalLoading}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerStagingPage