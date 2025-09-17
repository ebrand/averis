import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const CatalogEditPage = () => {
  const { catalogId, region } = useParams()
  const navigate = useNavigate()
  const { canEditCatalogs, hasRegionAccess } = useRole()
  
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    status: 'active',
    priority: 1,
    channel_id: '',
    EffectiveFrom: '',
    EffectiveTo: '',
    IsDefault: false
  })
  
  // Reference data
  const [channels, setChannels] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [regions, setRegions] = useState([])

  useEffect(() => {
    if (canEditCatalogs() && (region ? hasRegionAccess(region.toUpperCase()) : true)) {
      loadCatalog()
      loadReferenceData()
    }
  }, [catalogId, canEditCatalogs, hasRegionAccess, region])

  const loadCatalog = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // If no catalogId, this is a new catalog creation
      if (!catalogId) {
        setCatalog(null)
        // Keep default form data for new catalog
        setLoading(false)
        return
      }
      
      // Get all catalogs and find the one with matching ID
      const response = await fetch('/api/catalogs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const foundCatalog = data.catalogs?.find(c => c.id === catalogId)
        
        if (foundCatalog) {
          setCatalog(foundCatalog)
          
          // Populate form with catalog data
          setFormData({
            code: foundCatalog.code || '',
            name: foundCatalog.name || '',
            status: foundCatalog.status || 'active',
            priority: foundCatalog.priority || 1,
            channel_id: foundCatalog.market_segment_id || foundCatalog.marketSegmentId || '',
            EffectiveFrom: foundCatalog.effective_from ? 
              new Date(foundCatalog.effective_from).toISOString().slice(0, 16) : '',
            EffectiveTo: foundCatalog.effective_to ? 
              new Date(foundCatalog.effective_to).toISOString().slice(0, 16) : '',
            IsDefault: foundCatalog.is_default || foundCatalog.IsDefault || false
          })
        } else {
          setError('Catalog not found')
        }
      } else {
        setError('Failed to load catalog')
      }
    } catch (error) {
      console.error('Error loading catalog:', error)
      setError('Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }

  const loadReferenceData = async () => {
    try {
      // Load channels
      const channelsResponse = await fetch('/api/catalogs/channels')
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json()
        setChannels(channelsData.channels || [])
      }

      // Load currencies
      const currenciesResponse = await fetch('/api/catalogs/currencies')
      if (currenciesResponse.ok) {
        const currenciesData = await currenciesResponse.json()
        setCurrencies(currenciesData.currencies || [])
      }

      // Load regions
      const regionsResponse = await fetch('/api/catalogs/regions')
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json()
        setRegions(regionsData.regions || [])
      }
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      console.log(`🎯 === CATALOG ${catalogId ? 'UPDATE' : 'CREATE'} STARTED ===`)
      console.log('📦 Catalog ID:', catalogId)
      console.log('📝 Form data:', formData)

      const url = catalogId ? `/api/catalogs/${catalogId}` : '/api/catalogs'
      const method = catalogId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      console.log(`📤 ${method} response status:`, response.status)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Catalog ${catalogId ? 'updated' : 'created'} successfully:`, result)
        setSuccess(`Catalog ${catalogId ? 'updated' : 'created'} successfully!`)
        
        // Redirect back to all catalogs page after 2 seconds
        setTimeout(() => {
          navigate('/catalogs')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Update failed:', errorData)
        setError(errorData.error || 'Failed to update catalog')
      }
    } catch (error) {
      console.error('Exception updating catalog:', error)
      setError('Failed to update catalog: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!canEditCatalogs() || (region && !hasRegionAccess(region.toUpperCase()))) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to edit catalogs.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !catalog) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Link 
            to="/catalogs" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Catalogs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <Link 
            to="/catalogs"
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {catalogId ? 'Edit Catalog' : 'Create New Catalog'}
              </h1>
              {catalog && (
                <p className="text-sm text-gray-500">
                  {catalog?.code} • {catalog?.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
              <p className="text-xs text-green-600 mt-1">Redirecting to catalog page...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900">Catalog Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              
              {/* Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Catalog Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Catalog Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <input
                  type="number"
                  id="priority"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Channel */}
              <div>
                <label htmlFor="channel_id" className="block text-sm font-medium text-gray-700">
                  Sales Channel
                </label>
                <select
                  id="channel_id"
                  value={formData.channel_id}
                  onChange={(e) => handleInputChange('channel_id', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a channel...</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Effective From */}
              <div>
                <label htmlFor="EffectiveFrom" className="block text-sm font-medium text-gray-700">
                  Effective From
                </label>
                <input
                  type="datetime-local"
                  id="EffectiveFrom"
                  value={formData.EffectiveFrom}
                  onChange={(e) => handleInputChange('EffectiveFrom', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Effective To */}
              <div>
                <label htmlFor="EffectiveTo" className="block text-sm font-medium text-gray-700">
                  Effective To
                </label>
                <input
                  type="datetime-local"
                  id="EffectiveTo"
                  value={formData.EffectiveTo}
                  onChange={(e) => handleInputChange('EffectiveTo', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* IsDefault checkbox */}
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="IsDefault"
                    checked={formData.IsDefault}
                    onChange={(e) => handleInputChange('IsDefault', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="IsDefault" className="ml-3 block text-sm font-medium text-gray-700">
                    Set as default catalog for this region
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-3 bg-gray-50 text-right">
            <Link
              to="/catalogs"
              className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
{saving ? 'Saving...' : (catalogId ? 'Save Changes' : 'Create Catalog')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CatalogEditPage