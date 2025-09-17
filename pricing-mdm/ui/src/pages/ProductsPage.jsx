import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { getStagingProducts, getStagingProductStats, getStagingDataSourceInfo } from '../services/productStagingDataService'
import socketService from '../services/socketService'

import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CubeIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const ProductsPage = () => {
  const { hasPermission, canViewProducts } = useRole()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    class: '',
    available: '',
    webDisplay: '',
    status: ''
  })
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Data state
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [stats, setStats] = useState({ total: 0, available: 0, inactive: 0, webDisplayed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('unknown')

  // Real-time notification state
  const [lastNotification, setLastNotification] = useState(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [refreshTimeoutId, setRefreshTimeoutId] = useState(null)

  // Read-only mode - no edit functionality for pricing-mdm app

  // Initialize search query from URL parameters
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search')
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery)
    }
  }, [searchParams])

  // Load statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getStagingProductStats()
        setStats(result)
        setDataSource(result.source || 'unknown')
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }
    loadStats()
  }, [])

  // Load products when search, filters, or pagination changes
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getStagingProducts(searchQuery, filters, currentPage, itemsPerPage)
        setProducts(result.products)
        setPagination(result.pagination)
        setDataSource(result.source || 'unknown')

        if (result.error) {
          setError(result.error)
        }
      } catch (error) {
        console.error('Failed to load products:', error)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [searchQuery, filters, currentPage, itemsPerPage])

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  // Debounced refresh function to avoid multiple concurrent API calls
  const debouncedRefresh = useCallback((notification) => {
    // Clear any existing timeout
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId)
    }

    // Set the notification immediately for visual feedback
    setLastNotification(notification)

    // Schedule the refresh
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🔄 Debounced refresh triggered by notification:', notification.eventType)
        console.log('📋 Refresh params:', { searchQuery, filters, currentPage, itemsPerPage })

        const result = await getStagingProducts(searchQuery, filters, currentPage, itemsPerPage)
        console.log('📥 Refresh result:', result)

        if (result && !result.error) {
          console.log('✅ Setting products state with', result.products?.length || 0, 'products')
          setProducts(result.products || [])
          setPagination(result.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
          setDataSource(result.source || 'unknown')
        } else {
          console.error('❌ Refresh error:', result?.error)
        }
      } catch (error) {
        console.error('❌ Failed to refresh products:', error)
      } finally {
        setRefreshTimeoutId(null)
      }
    }, 800) // Single delay for both types of notifications

    setRefreshTimeoutId(timeoutId)
  }, [searchQuery, filters, currentPage, itemsPerPage, refreshTimeoutId])

  // Setup Socket.IO connection and real-time notifications
  useEffect(() => {
    console.log('🔌 Setting up Socket.IO connection for product updates')

    // Connect to socket service
    socketService.connect()
    setIsSocketConnected(socketService.isSocketConnected())

    // Handle product notifications (unified handler)
    const handleProductNotification = (notification, type = 'update') => {
      console.log(`🔔 Product ${type} notification received:`, notification)
      debouncedRefresh({ ...notification, type })
    }

    // Subscribe to socket events with unified handler
    socketService.on('product-updated', (notification) => handleProductNotification(notification, 'update'))
    socketService.on('product-launched', (notification) => handleProductNotification(notification, 'launch'))

    // Update connection status periodically
    const checkConnection = () => {
      setIsSocketConnected(socketService.isSocketConnected())
    }
    const connectionInterval = setInterval(checkConnection, 5000)

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.IO connection')

      // Clear any pending refresh timeout
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }

      // Remove socket event listeners - using 'off' without specific handler removes all
      socketService.off('product-updated')
      socketService.off('product-launched')
      clearInterval(connectionInterval)
      socketService.disconnect()
    }
  }, [searchQuery, filters, currentPage, itemsPerPage])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
    setCurrentPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getStatusIcon = (product) => {
    if (product.inactiveFlag) {
      return <XCircleIcon className="h-4 w-4 text-red-500" title="Inactive" />
    }
    if (product.availableFlag) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" title="Available" />
    }
    return <ClockIcon className="h-4 w-4 text-yellow-500" title="Unavailable" />
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        label: 'Draft'
      },
      active: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Active'
      },
      deprecated: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        label: 'Deprecated'
      },
      archived: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        label: 'Archived'
      }
    }

    const config = statusConfig[status] || statusConfig.active

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Products</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Browse product catalog (read-only view)
            </p>
          </div>

          {/* Real-time Status Indicator */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isSocketConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>

            {lastNotification && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last update: {new Date(lastNotification.timestamp).toLocaleTimeString()}
                {lastNotification.type === 'launch' && (
                  <span className="ml-1 text-green-600 dark:text-green-400">🚀</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            
            <div className="flex gap-3">
              
              {/* Search */}
              <div>
                <div>
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, SKUs, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[400px] pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-[250px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Types</option>
                  <option value="Software License">Software License</option>
                  <option value="SaaS Subscription">SaaS Subscription</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Service">Service</option>
                  <option value="Training">Training</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-[250px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            
            </div>

            {/* Results count and data source indicator */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? (
                  <span>Loading products...</span>
                ) : (
                  <>
                    Showing {products.length} of {pagination?.total || 0} products
                    {searchQuery && (
                      <span className="ml-2">
                        for "<strong className="text-gray-900 dark:text-white">{searchQuery}</strong>"
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {dataSource && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${dataSource === 'staging-api'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : dataSource === 'api'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                      {dataSource === 'staging-api' ? '🔗 Staging Data' : dataSource === 'api' ? '🔗 Live Data' : '📝 Mock Data'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="flex flex-col">
          <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading products...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 dark:text-red-400">
                      <p className="font-medium">Error loading products</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery || Object.values(filters).some(f => f) ? 'No products match your search criteria.' : 'No products found.'}
                  </div>
                ) : (
                  <div className="h-[450px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('sku_code')}
                          >
                            SKU Code
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('name')}
                          >
                            Product Name
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('type')}
                          >
                            Type
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('sub_type')}
                          >
                            Sub Type
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('class')}
                          >
                            Class
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                            onClick={() => handleSort('base_price')}
                          >
                            Price
                          </th>
                          <th 
                            scope="col" 
                            className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider"
                          >
                            Web
                          </th>
                        </tr>
                      </thead>
                      
                      <tbody className="bg-white divide-y divide-gray-200">
                        {
                          products.sort((a, b) => {
                            if (sortBy === 'name') {
                              return sortOrder === 'asc'
                                ? (a.name || '').localeCompare(b.name || '')
                                : (b.name || '').localeCompare(a.name || '')
                            }
                            if (sortBy === 'sku_code') {
                              return sortOrder === 'asc'
                                ? (a.skuCode || '').localeCompare(b.skuCode || '')
                                : (b.skuCode || '').localeCompare(a.skuCode || '')
                            }
                            if (sortBy === 'type') {
                              return sortOrder === 'asc'
                                ? (a.type || '').localeCompare(b.type || '')
                                : (b.type || '').localeCompare(a.type || '')
                            }
                            if (sortBy === 'sub_type') {
                              return sortOrder === 'asc'
                                ? (a.subType || a.sub_type || '').localeCompare(b.subType || b.sub_type || '')
                                : (b.subType || b.sub_type || '').localeCompare(a.subType || a.sub_type || '')
                            }
                            if (sortBy === 'class') {
                              return sortOrder === 'asc'
                                ? (a.class || '').localeCompare(b.class || '')
                                : (b.class || '').localeCompare(a.class || '')
                            }
                            if (sortBy === 'base_price') {
                              return sortOrder === 'asc'
                                ? (a.basePrice || 0) - (b.basePrice || 0)
                                : (b.basePrice || 0) - (a.basePrice || 0)
                            }
                            return 0
                          }).map((product, index) => (
                            <tr 
                              key={product.id} 
                              className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-900">
                                {product.skuCode}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {product.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {product.subType || product.sub_type || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {product.class || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatPrice(product.basePrice)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center">
                                  {product.webDisplayFlag && (
                                    <EyeIcon className="h-4 w-4 text-blue-500" title="Web Display" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}

                {products.length === 0 && !loading && !error && (
                  <div className="text-center py-12">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery || Object.values(filters).some(f => f)
                        ? 'Try adjusting your search or filters.'
                        : 'Get started by adding your first product.'}
                    </p>
                  </div>
                )}
              
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          {!loading && !error && pagination.pages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        
        </div>
      
      </div>
    </div>
  )
}

export default ProductsPage;