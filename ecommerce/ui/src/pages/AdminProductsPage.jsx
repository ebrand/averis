import React, { useState, useEffect } from 'react'
import useRealTimeUpdates from '../hooks/useRealTimeUpdates'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const AdminProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:6004'

  // Real-time updates
  const { isConnected, connectionStatus } = useRealTimeUpdates({
    onProductUpdate: ({ product, eventType }) => {
      console.log(`📦 Admin: Product ${eventType}:`, product)
      
      // Update the product in the list if it exists, otherwise refresh the list
      setProducts(currentProducts => {
        const existingIndex = currentProducts.findIndex(p => p.id === product.id)
        
        if (existingIndex >= 0) {
          // Update existing product
          const updatedProducts = [...currentProducts]
          updatedProducts[existingIndex] = { ...updatedProducts[existingIndex], ...product }
          return updatedProducts
        } else if (eventType === 'created' || eventType === 'launched') {
          // Add new product to the beginning of the list
          return [product, ...currentProducts]
        } else {
          // For unknown products, we might need to refresh the list
          // but for now just log it
          console.log('Product not found in current list, might need refresh')
          return currentProducts
        }
      })
      
      setLastUpdated(new Date())
    },
    
    onInventoryUpdate: ({ productId, stockStatus, stockQuantity }) => {
      console.log(`📦 Admin: Inventory update for ${productId}:`, { stockStatus, stockQuantity })
      
      // Update the inventory for the specific product
      setProducts(currentProducts => 
        currentProducts.map(product => 
          product.id === productId 
            ? { ...product, stockStatus, stockQuantity }
            : product
        )
      )
      
      setLastUpdated(new Date())
    }
  })

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`${API_BASE}/api/products/admin?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setProducts(result.data.products || [])
        setPagination(result.data.pagination || null)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch products')
      }
    } catch (err) {
      console.error('Error fetching admin products:', err)
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage, search, statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts(1)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        icon: CheckCircleIcon, 
        className: 'bg-green-100 text-green-800', 
        label: 'Active' 
      },
      draft: { 
        icon: DocumentTextIcon, 
        className: 'bg-gray-100 text-gray-800', 
        label: 'Draft' 
      },
      pending: { 
        icon: ClockIcon, 
        className: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending' 
      },
      inactive: { 
        icon: XCircleIcon, 
        className: 'bg-red-100 text-red-800', 
        label: 'Inactive' 
      }
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getFlagIcon = (flag, label) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
        flag ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
      }`}>
        {flag ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
        {label}
      </span>
    )
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Administration</h1>
              <p className="mt-2 text-gray-600">
                Manage all products in the e-commerce system with detailed technical information.
              </p>
            </div>
            
            {/* Real-time Status */}
            <div className="flex flex-col items-end space-y-2">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' && <CheckCircleIcon className="h-3 w-3" />}
                {connectionStatus === 'connecting' && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
                {connectionStatus === 'disconnected' && <XCircleIcon className="h-3 w-3" />}
                <span>
                  {connectionStatus === 'connected' && 'Live Updates'}
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'disconnected' && 'Offline'}
                  {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                </span>
              </div>
              
              {lastUpdated && (
                <div className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products by name, SKU, or description..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </form>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {pagination && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-700">
                Showing {products.length} of {pagination?.total || 0} products
                {search && (
                  <span className="font-medium"> matching "{search}"</span>
                )}
                {statusFilter && (
                  <span className="font-medium"> with status "{statusFilter}"</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0 z-50 shadow-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
                    SKU Code
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
                    Product Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
                    Status
                  </th>
                  <th scope="col" className="relative px-4 py-3 border-b border-gray-300">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.sort((a, b) => {
                  // Default to sorting by product name ascending
                  return (a.name || '').localeCompare(b.name || '')
                }).map((product, index) => (
                  <tr 
                    key={product.id}
                    className={`hover:bg-gray-100 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {product.sku}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {product.name || 'Unnamed Product'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.basePrice)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(product.status)}
                        {product.webDisplayFlag && (
                          <EyeIcon className="h-4 w-4 text-blue-500" title="Web Display" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPreviousPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? `No products match your search "${search}".` : 'No products are available in the database.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProductsPage