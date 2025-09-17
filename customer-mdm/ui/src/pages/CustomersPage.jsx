import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

const CustomersPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { canAccessAdminFeatures } = useRole()
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    disclosureLevel: '',
    customerSegment: '',
    emailVerified: ''
  })
  
  // Sorting State
  const [sortBy, setSortBy] = useState('lastName')
  const [sortOrder, setSortOrder] = useState('asc')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Data State
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Handle success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the message from navigation state
      navigate(location.pathname, { replace: true, state: {} })
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [location.state, navigate, location.pathname])

  // Load customers when search, filters, or pagination changes
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage,
          pageSize: itemsPerPage
        })
        
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim())
        }
        
        if (filters.status) {
          params.append('status', filters.status)
        }
        
        if (filters.disclosureLevel) {
          params.append('disclosureLevel', filters.disclosureLevel)
        }

        const response = await fetch(`/api/customers?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'omit'
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('API Response received:', data)
        
        if (!data || (!data.data && !Array.isArray(data))) {
          throw new Error('API response missing data field or invalid structure')
        }
        
        const customersArray = data.data || data
        if (!Array.isArray(customersArray)) {
          throw new Error(`Expected customers array, got ${typeof customersArray}`)
        }
        
        setCustomers(customersArray)
        setPagination(data.pagination || { page: currentPage, limit: itemsPerPage, total: customersArray.length, pages: 1 })
        
      } catch (err) {
        console.error('Error fetching customers:', err)
        setError('Failed to load customers from API: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [searchQuery, filters, currentPage, itemsPerPage])

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  // Handle double-click on customer row to navigate to edit page
  const handleCustomerDoubleClick = (customer) => {
    if (canAccessAdminFeatures()) {
      navigate(`/customers/edit/${customer.id}`)
    }
  }

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
      <ChevronUpIcon className="h-3 w-3 text-red-600" />
    ) : (
      <ChevronDownIcon className="h-3 w-3 text-red-600" />
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const getStatusBadge = (customer) => {
    const isActive = customer.isActive
    const config = isActive ? {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      label: 'Active'
    } : {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', 
      label: 'Inactive'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getDisclosureLevelBadge = (level) => {
    const config = {
      hot: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'HOT' },
      warm: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'WARM' },
      cold: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'COLD' }
    }
    
    const levelConfig = config[level?.toLowerCase()] || config.cold
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelConfig.color}`}>
        {levelConfig.label}
      </span>
    )
  }

  // Sort customers client-side for display
  const sortedCustomers = customers.sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy) {
      case 'firstName':
        aVal = a.firstName || ''
        bVal = b.firstName || ''
        break
      case 'lastName':
        aVal = a.lastName || ''
        bVal = b.lastName || ''
        break
      case 'email':
        aVal = a.email || ''
        bVal = b.email || ''
        break
      case 'lifetimeValue':
        aVal = a.lifetimeValue || 0
        bVal = b.lifetimeValue || 0
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      case 'lastActivity':
        aVal = new Date(a.lastActivity)
        bVal = new Date(b.lastActivity)
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      default:
        return 0
    }
    
    const comparison = aVal.toString().localeCompare(bVal.toString())
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your customer relationships and accounts
          </p>
        </div>
        {canAccessAdminFeatures() && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/customers/create')}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Customer
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-500"
              >
                <span className="sr-only">Close</span>
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers, emails, segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Disclosure Level Filter */}
            <div>
              <select
                value={filters.disclosureLevel}
                onChange={(e) => handleFilterChange('disclosureLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Levels</option>
                <option value="hot">Hot (Authenticated)</option>
                <option value="warm">Warm (Registered)</option>
                <option value="cold">Cold (Visitor)</option>
              </select>
            </div>

            {/* Email Verified Filter */}
            <div>
              <select
                value={filters.emailVerified}
                onChange={(e) => handleFilterChange('emailVerified', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Verification</option>
                <option value="true">Email Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? (
                <span>Loading customers...</span>
              ) : (
                <>
                  Showing {customers.length} of {pagination?.total || customers.length || 0} customers
                  {searchQuery && (
                    <span className="ml-2">
                      for "<strong className="text-gray-900 dark:text-white">{searchQuery}</strong>"
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                🔗 Live Data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-200 dark:bg-gray-600 sticky top-0 z-50 shadow-sm">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('firstName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>First Name</span>
                    {getSortIcon('firstName')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('lastName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Name</span>
                    {getSortIcon('lastName')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    {getSortIcon('email')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-300 dark:border-gray-500"
                >
                  Segment
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('lifetimeValue')}
                >
                  <div className="flex items-center space-x-1">
                    <span>LTV</span>
                    {getSortIcon('lifetimeValue')}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-300 dark:border-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider border-b border-gray-300 dark:border-gray-500">
                  Level
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 border-b border-gray-300 dark:border-gray-500"
                  onClick={() => handleSort('lastActivity')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Activity</span>
                    {getSortIcon('lastActivity')}
                  </div>
                </th>
                <th scope="col" className="relative px-4 py-3 border-b border-gray-300 dark:border-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-red-600 dark:text-red-400">
                      <p className="font-medium">Error loading customers</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || Object.values(filters).some(f => f) ? 'No customers match your search criteria.' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer, index) => (
                <tr 
                  key={customer.id} 
                  className={`hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                  }`} 
                  onDoubleClick={() => handleCustomerDoubleClick(customer)}
                  title="Double-click to edit customer"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.firstName || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.lastName || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center">
                      {customer.emailVerified && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" title="Email Verified" />
                      )}
                      {customer.email || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.customerSegment || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.lifetimeValue > 0 ? formatCurrency(customer.lifetimeValue) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(customer)}
                      {customer.isHighValue && (
                        <CurrencyDollarIcon className="h-4 w-4 text-yellow-500" title="High Value Customer" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {getDisclosureLevelBadge(customer.disclosureLevel)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.lastActivity ? new Date(customer.lastActivity).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {canAccessAdminFeatures() && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/customers/edit/${customer.id}`)
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                        title="Edit customer"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
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

export default CustomersPage