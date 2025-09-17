import React, { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { getProducts, getProductStats, getDataSourceInfo } from '../services/productDataService'
import { useDataDictionaryFields } from '../hooks/useDataDictionaryFields'
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
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const ProductsPage = () => {
  const { hasPermission, canViewProducts, canEditProducts } = useRole()
  const { fieldsByColumnName, loading: fieldsLoading, error: fieldsError, isUsingFallback } = useDataDictionaryFields()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    class: '',
    available: '',
    webDisplay: '',
    status: ''
  })
  const [showLaunchedOnly, setShowLaunchedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  // Data state
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 0 })
  const [stats, setStats] = useState({ total: 0, available: 0, inactive: 0, webDisplayed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('unknown')

  // Helper function to get display name from data dictionary
  const getDisplayName = (columnName, fallback = columnName) => {
    const field = fieldsByColumnName[columnName]
    return field?.displayName || fallback
  }

  // Handle double-click on product row to navigate to edit page
  const handleProductDoubleClick = (product) => {
    if (canViewProducts()) {
      navigate(`/products/${product.id}/edit`)
    }
  }

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
        const result = await getProductStats()
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
        // Create effective filters that include launched products logic
        const effectiveFilters = { ...filters }
        if (showLaunchedOnly) {
          effectiveFilters.status = effectiveFilters.status || 'active'
        }
        
        const result = await getProducts(searchQuery, effectiveFilters, currentPage, itemsPerPage)
        console.log('📊 Products result:', { 
          productsCount: result.products?.length, 
          pagination: result.pagination,
          source: result.source 
        })
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
  }, [searchQuery, filters, currentPage, itemsPerPage, showLaunchedOnly])

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters, showLaunchedOnly])

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

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <Bars3BottomLeftIcon className="h-3 w-3 text-gray-400" />
    }
    
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-3 w-3 text-blue-600" />
    ) : (
      <ChevronDownIcon className="h-3 w-3 text-blue-600" />
    )
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getDataCompletionStatus = (product) => {
    // Define the five product data attribute sections
    const sections = [
      { key: 'marketing', label: 'M', title: 'Marketing' },
      { key: 'legal', label: 'L', title: 'Legal' },
      { key: 'finance', label: 'F', title: 'Finance' },
      { key: 'salesops', label: 'S', title: 'SalesOps' },
      { key: 'contracts', label: 'C', title: 'Contracts & Services' }
    ]

    // Get Go for Launch approval status from localStorage
    const getApprovalStatus = (section, product) => {
      try {
        const savedApprovals = localStorage.getItem(`product_approvals_${product.id}`)
        if (savedApprovals) {
          const approvals = JSON.parse(savedApprovals)
          return approvals[section.key]?.approved === true
        }
      } catch (e) {
        console.warn('Failed to parse saved approvals:', e)
      }
      return false
    }

    return sections.map(section => {
      const isApproved = getApprovalStatus(section, product)
      return (
        <div
          key={section.key}
          className="flex flex-col items-center"
          title={`${section.title}: ${isApproved ? 'Go for Launch Approved' : 'Pending Go for Launch Approval'}`}
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {section.label}
          </span>
          {isApproved ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ClockIcon className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      )
    })
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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog and master data
          </p>
        </div>
        {canEditProducts() && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/products/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Product
            </Link>
          </div>
        )}
      </div>

      {/* Data Dictionary Fallback Warning */}
      {isUsingFallback && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                Data Dictionary Service Unavailable
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                Using essential field definitions only. Some field labels may appear generic. Product functionality remains available.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, SKUs, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Class Filter */}
            <div>
              <select
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Classes</option>
                <option value="Core Product">Core Product</option>
                <option value="Add-on">Add-on</option>
                <option value="Extension">Extension</option>
                <option value="Bundle">Bundle</option>
                <option value="Upgrade">Upgrade</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Available Filter */}
            <div>
              <select
                value={filters.available}
                onChange={(e) => handleFilterChange('available', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>

            {/* Web Display Filter */}
            <div>
              <select
                value={filters.webDisplay}
                onChange={(e) => handleFilterChange('webDisplay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Visibility</option>
                <option value="true">Web Display</option>
                <option value="false">Hidden</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Launched Products Toggle */}
          <div className="mt-4 flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLaunchedOnly}
                onChange={(e) => setShowLaunchedOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show launched products only
              </span>
            </label>
          </div>

          {/* Results count and data source indicator */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? (
                <span>Loading products...</span>
              ) : (
                <>
                  Showing {products.length} of {pagination?.total || products.length || 0} products
                  {searchQuery && (
                    <span className="ml-2">
                      for "<strong className="text-gray-900 dark:text-white">{searchQuery}</strong>"
                    </span>
                  )}
                </>
              )}
            </div>
            {dataSource && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                  dataSource === 'api' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {dataSource === 'api' ? '🔗 Live Data' : '📝 Mock Data'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-200 dark:bg-gray-600 sticky top-0 z-50 shadow-sm">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{getDisplayName('sku', 'SKU Code')}</span>
                    {getSortIcon('sku')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{getDisplayName('name', 'Product Name')}</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{getDisplayName('type', 'Type')}</span>
                    {getSortIcon('type')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('basePrice')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{getDisplayName('base_price', 'Price')}</span>
                    {getSortIcon('basePrice')}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-300 dark:border-gray-500">
                  {getDisplayName('status', 'Status')}
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-300 dark:border-gray-500">
                  Data Completion
                </th>
                <th scope="col" className="relative px-4 py-3 border-b border-gray-300 dark:border-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-red-600 dark:text-red-400">
                      <p className="font-medium">Error loading products</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || Object.values(filters).some(f => f) ? 'No products match your search criteria.' : 'No products found.'}
                  </td>
                </tr>
              ) : (
                products.sort((a, b) => {
                  if (sortBy === 'name') {
                    return sortOrder === 'asc' 
                      ? (a.name || '').localeCompare(b.name || '')
                      : (b.name || '').localeCompare(a.name || '')
                  }
                  if (sortBy === 'sku') {
                    return sortOrder === 'asc'
                      ? (a.sku || '').localeCompare(b.sku || '')
                      : (b.sku || '').localeCompare(a.sku || '')
                  }
                  if (sortBy === 'type') {
                    return sortOrder === 'asc'
                      ? (a.type || '').localeCompare(b.type || '')
                      : (b.type || '').localeCompare(a.type || '')
                  }
                  if (sortBy === 'basePrice') {
                    return sortOrder === 'asc'
                      ? (a.basePrice || 0) - (b.basePrice || 0)
                      : (b.basePrice || 0) - (a.basePrice || 0)
                  }
                  return 0
                }).map((product, index) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                  }`} 
                  onDoubleClick={() => handleProductDoubleClick(product)}
                  title="Double-click to edit product"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                      {product.sku}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {product.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      {getDataCompletionStatus(product)}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
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
  )
}

export default ProductsPage