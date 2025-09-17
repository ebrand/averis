import React, { useState, useEffect, useCallback } from 'react'
import { useRole } from '../contexts/RoleContext'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const CatalogsAmerPage = () => {
  const { hasPermission, canViewCatalogs, canEditCatalogs, hasRegionAccess } = useRole()
  const navigate = useNavigate()
  const [catalogs, setCatalogs] = useState([])
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCatalog, setSelectedCatalog] = useState(null)
  
  // Form states
  const [catalogForm, setCatalogForm] = useState({
    code: '',
    name: '',
    channel_id: '',
    effective_from: '',
    effective_to: '',
    priority: 1,
    status: 'active',
    is_default: false
  })
  
  const [productForm, setProductForm] = useState({
    product_id: '',
    is_available: true,
    is_featured: false,
    custom_name: '',
    custom_description: '',
    override_base_price: '',
    discount_percentage: '',
    minimum_quantity: 1,
    maximum_quantity: '',
    display_order: 0,
    local_sku_code: '',
    fulfillment_method: 'standard',
    delivery_timeframe: '',
    support_level: 'standard',
    export_classification: '',
    regulatory_notes: '',
    requires_approval: false,
    tags: []
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  
  // Calendar picker state
  const [showEffectiveFromCalendar, setShowEffectiveFromCalendar] = useState(false)
  const [showEffectiveToCalendar, setShowEffectiveToCalendar] = useState(false)
  const [showEditEffectiveFromCalendar, setShowEditEffectiveFromCalendar] = useState(false)
  const [showEditEffectiveToCalendar, setShowEditEffectiveToCalendar] = useState(false)

  // Load initial data
  useEffect(() => {
    loadCatalogs()
    loadChannels()
  }, [])

  const loadCatalogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/catalogs?region=AMER', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setCatalogs(data.catalogs || [])
    } catch (error) {
      console.error('Error loading catalogs:', error)
      setError('Failed to load catalogs')
    } finally {
      setLoading(false)
    }
  }

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/channels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setChannels(data || [])
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  // Calendar helper functions
  const formatDateForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().slice(0, 16)
  }

  const formatDateDisplay = (date) => {
    if (!date) return 'Select date'
    return new Date(date).toLocaleDateString()
  }

  const handleDateSelect = (date, field, isEdit = false) => {
    const formattedDate = formatDateForInput(date)
    
    if (isEdit) {
      setCatalogForm({...catalogForm, [field]: formattedDate})
    } else {
      setCatalogForm({...catalogForm, [field]: formattedDate})
    }
    
    // Close the calendar after selection
    if (field === 'effective_from') {
      if (isEdit) {
        setShowEditEffectiveFromCalendar(false)
      } else {
        setShowEffectiveFromCalendar(false)
      }
    } else if (field === 'effective_to') {
      if (isEdit) {
        setShowEditEffectiveToCalendar(false)
      } else {
        setShowEffectiveToCalendar(false)
      }
    }
  }

  const clearDate = (field) => {
    setCatalogForm({...catalogForm, [field]: ''})
  }

  // Reset form to initial state
  const resetCatalogForm = () => {
    setCatalogForm({
      code: '',
      name: '',
      channel_id: '',
      effective_from: '',
      effective_to: '',
      priority: 1,
      status: 'active',
      is_default: false
    })
  }

  // Handle opening create modal with clean form
  const handleOpenCreateModal = () => {
    resetCatalogForm()
    // Set default effective dates for new catalogs
    const today = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(today.getFullYear() + 1)
    
    setCatalogForm(prev => ({
      ...prev,
      effective_from: formatDateForInput(today),
      effective_to: formatDateForInput(oneYearFromNow)
    }))
    
    setShowCreateModal(true)
  }

  // Handle channel selection in create modal
  const handleChannelSelection = (channelId) => {
    const selectedChannel = channels.find(c => c.id === channelId)
    if (selectedChannel) {
      // Generate default code and name
      const regionCode = 'AMER' // Since we're in the Americas page
      const channelCode = selectedChannel.code || selectedChannel.name.toUpperCase().replace(/\s+/g, '_')
      const defaultCode = `${regionCode}_${channelCode}_`
      const defaultName = `Americas ${selectedChannel.name} Catalog`
      
      setCatalogForm(prev => ({
        ...prev,
        channel_id: channelId,
        code: defaultCode,
        name: defaultName
      }))
    } else {
      // Just set the channel if no channel found
      setCatalogForm(prev => ({
        ...prev,
        channel_id: channelId
      }))
    }
  }

  // Simple calendar component
  const SimpleCalendar = ({ onDateSelect, onClose, selectedDate }) => {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isSelected = selectedDate && new Date(selectedDate).toDateString() === date.toDateString()
      const isToday = date.toDateString() === today.toDateString()
      
      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(date)}
          className={`p-2 text-sm rounded hover:bg-blue-100 dark:hover:bg-blue-800 ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isToday 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {day}
        </button>
      )
    }
    
    return (
      <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11)
                setCurrentYear(currentYear - 1)
              } else {
                setCurrentMonth(currentMonth - 1)
              }
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            ←
          </button>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0)
                setCurrentYear(currentYear + 1)
              } else {
                setCurrentMonth(currentMonth + 1)
              }
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        <div className="mt-3 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }


  const handleCreateCatalog = async () => {
    try {
      // Get AMER region ID
      const regionsResponse = await fetch('/api/regions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const regionsData = await regionsResponse.json()
      const amerRegion = regionsData.find(r => r.code === 'AMER')
      
      // Get currency ID (default to USD)
      const currenciesResponse = await fetch('/api/currencies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const currenciesData = await currenciesResponse.json()
      const usdCurrency = currenciesData.find(c => c.code === 'USD')

      // Transform form data to match API expectations (PascalCase)
      const requestBody = {
        Code: catalogForm.code,
        Name: catalogForm.name,
        RegionId: amerRegion?.id,
        MarketSegmentId: catalogForm.channel_id,
        CurrencyId: usdCurrency?.id,
        EffectiveFrom: catalogForm.effective_from ? new Date(catalogForm.effective_from).toISOString() : null,
        EffectiveTo: catalogForm.effective_to ? new Date(catalogForm.effective_to).toISOString() : null,
        Priority: catalogForm.priority,
        Status: catalogForm.status,
        IsActive: true,
        IsDefault: catalogForm.is_default,
        CreatedBy: "pricing-ui"
      }

      const response = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        setShowCreateModal(false)
        resetCatalogForm()
        loadCatalogs()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create catalog')
      }
    } catch (error) {
      console.error('Error creating catalog:', error)
      setError('Failed to create catalog')
    }
  }



  const filteredCatalogs = catalogs.filter(catalog =>
    catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    catalog.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    catalog.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCatalogDoubleClick = (catalog) => {
    openEditCatalogModal(catalog)
  }

  const openEditCatalogModal = (catalog) => {
    setSelectedCatalog(catalog)
    setCatalogForm({
      code: catalog.code,
      name: catalog.name,
      channel_id: catalog.market_segment_id,
      effective_from: catalog.effective_from ? new Date(catalog.effective_from).toISOString().slice(0, 16) : '',
      effective_to: catalog.effective_to ? new Date(catalog.effective_to).toISOString().slice(0, 16) : '',
      priority: catalog.priority || 1,
      status: catalog.status || 'active',
      is_default: catalog.is_default || false
    })
    setShowEditModal(true)
  }

  const handleEditCatalog = async () => {
    try {
      // Transform form data to match API expectations (PascalCase)
      const requestBody = {
        Name: catalogForm.name,
        RegionId: null, // Will be set if needed
        MarketSegmentId: catalogForm.channel_id,
        CurrencyId: null, // Will be set if needed
        EffectiveFrom: catalogForm.effective_from ? new Date(catalogForm.effective_from).toISOString() : null,
        EffectiveTo: catalogForm.effective_to ? new Date(catalogForm.effective_to).toISOString() : null,
        Priority: catalogForm.priority,
        Status: catalogForm.status,
        IsActive: true, // Assume active for updates
        IsDefault: catalogForm.is_default,
        UpdatedBy: "pricing-ui"
      }

      const response = await fetch(`/api/catalogs/${selectedCatalog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedCatalog(null)
        resetCatalogForm()
        loadCatalogs()
        setError(null)
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update catalog')
      }
    } catch (error) {
      console.error('Error updating catalog:', error)
      setError('Failed to update catalog')
    }
  }


  if (!canViewCatalogs('AMER') && !hasRegionAccess('AMER')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to manage catalogs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <GlobeAmericasIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Americas Catalogs</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Manage pricing catalogs for the Americas region across different sales channels.
              </p>
            </div>
          </div>
        </div>
        {canEditCatalogs('AMER') && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Catalog
            </button>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search catalogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Catalogs list */}
      <div className="mt-8">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 6 }).map((_, index) => (
                <li key={index} className="animate-pulse px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No catalogs</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new catalog for the Americas region.
            </p>
            {canEditCatalogs('AMER') && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Create Your First Catalog
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCatalogs.map((catalog) => (
                <li key={catalog.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onDoubleClick={() => handleCatalogDoubleClick(catalog)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BuildingStorefrontIcon className="h-10 w-10 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {catalog.name}
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            catalog.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {catalog.status}
                          </span>
                          {catalog.is_default && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ⭐ Default
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">
                            {catalog.code} • {catalog.channel_name} • {catalog.currency_code}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <TagIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {catalog.product_count || 0} products
                          </span>
                        </div>
                        {catalog.effective_from && (
                          <div className="mt-1 text-xs text-gray-400">
                            Effective from: {new Date(catalog.effective_from).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/catalogs/amer/${catalog.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Manage Products
                      </Link>
                      <Link
                        to={`/catalogs/amer/${catalog.id}`}
                        className="inline-flex items-center px-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                        title="Open catalog details"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Catalog Modal */}
      {showEditModal && selectedCatalog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Edit Catalog
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Catalog Code
                  </label>
                  <input
                    type="text"
                    value={catalogForm.code}
                    onChange={(e) => setCatalogForm({...catalogForm, code: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., AMER-DIRECT-2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Catalog Name
                  </label>
                  <input
                    type="text"
                    value={catalogForm.name}
                    onChange={(e) => setCatalogForm({...catalogForm, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Americas Direct Sales 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sales Channel
                  </label>
                  <select
                    value={catalogForm.channel_id}
                    onChange={(e) => setCatalogForm({...catalogForm, channel_id: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Channel</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Effective From
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditEffectiveFromCalendar(!showEditEffectiveFromCalendar)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 text-left"
                    >
                      {formatDateDisplay(catalogForm.effective_from)}
                    </button>
                    {catalogForm.effective_from && (
                      <button
                        type="button"
                        onClick={() => clearDate('effective_from')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                      >
                        ×
                      </button>
                    )}
                    {showEditEffectiveFromCalendar && (
                      <SimpleCalendar
                        onDateSelect={(date) => handleDateSelect(date, 'effective_from', true)}
                        onClose={() => setShowEditEffectiveFromCalendar(false)}
                        selectedDate={catalogForm.effective_from}
                      />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Effective To (Optional)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditEffectiveToCalendar(!showEditEffectiveToCalendar)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 text-left"
                    >
                      {formatDateDisplay(catalogForm.effective_to)}
                    </button>
                    {catalogForm.effective_to && (
                      <button
                        type="button"
                        onClick={() => clearDate('effective_to')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                      >
                        ×
                      </button>
                    )}
                    {showEditEffectiveToCalendar && (
                      <SimpleCalendar
                        onDateSelect={(date) => handleDateSelect(date, 'effective_to', true)}
                        onClose={() => setShowEditEffectiveToCalendar(false)}
                        selectedDate={catalogForm.effective_to}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave blank for no expiration date
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_default"
                    checked={catalogForm.is_default}
                    onChange={(e) => setCatalogForm({...catalogForm, is_default: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="edit_is_default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Set as default catalog for this region and channel
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCatalog}
                  disabled={!catalogForm.code || !catalogForm.name || !catalogForm.channel_id}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Catalog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Create New Catalog
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sales Channel *
                  </label>
                  <select
                    value={catalogForm.channel_id}
                    onChange={(e) => handleChannelSelection(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a sales channel to get started...</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will auto-populate the catalog code and name
                  </p>
                </div>

                {catalogForm.channel_id && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Catalog Code
                      </label>
                      <input
                        type="text"
                        value={catalogForm.code}
                        onChange={(e) => setCatalogForm({...catalogForm, code: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., AMER_DIRECT_"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Auto-generated based on region and channel. You can modify if needed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Catalog Name
                      </label>
                      <input
                        type="text"
                        value={catalogForm.name}
                        onChange={(e) => setCatalogForm({...catalogForm, name: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Americas Direct Sales Catalog"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Auto-generated display name. You can customize as needed.
                      </p>
                    </div>

                    <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Effective From
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEffectiveFromCalendar(!showEffectiveFromCalendar)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 text-left"
                    >
                      {formatDateDisplay(catalogForm.effective_from)}
                    </button>
                    {catalogForm.effective_from && (
                      <button
                        type="button"
                        onClick={() => clearDate('effective_from')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                      >
                        ×
                      </button>
                    )}
                    {showEffectiveFromCalendar && (
                      <SimpleCalendar
                        onDateSelect={(date) => handleDateSelect(date, 'effective_from', false)}
                        onClose={() => setShowEffectiveFromCalendar(false)}
                        selectedDate={catalogForm.effective_from}
                      />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Effective To (Optional)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEffectiveToCalendar(!showEffectiveToCalendar)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 text-left"
                    >
                      {formatDateDisplay(catalogForm.effective_to)}
                    </button>
                    {catalogForm.effective_to && (
                      <button
                        type="button"
                        onClick={() => clearDate('effective_to')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-1"
                      >
                        ×
                      </button>
                    )}
                    {showEffectiveToCalendar && (
                      <SimpleCalendar
                        onDateSelect={(date) => handleDateSelect(date, 'effective_to', false)}
                        onClose={() => setShowEffectiveToCalendar(false)}
                        selectedDate={catalogForm.effective_to}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave blank for no expiration date
                  </p>
                </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={catalogForm.is_default}
                        onChange={(e) => setCatalogForm({...catalogForm, is_default: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Set as default catalog for this region and channel
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCatalog}
                  disabled={!catalogForm.channel_id || (catalogForm.channel_id && (!catalogForm.code || !catalogForm.name))}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {catalogForm.channel_id ? 'Create Catalog' : 'Select Channel First'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CatalogsAmerPage