import React, { useState, useEffect } from 'react'
import { useRole } from '../contexts/RoleContext'
import { Link, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  PencilIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  GlobeEuropeAfricaIcon,
  GlobeAsiaAustraliaIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const AllCatalogsPage = () => {
  const { hasPermission, canViewCatalogs, canEditCatalogs, hasRegionAccess } = useRole()
  const navigate = useNavigate()
  const [catalogs, setCatalogs] = useState([])
  const [filteredCatalogs, setFilteredCatalogs] = useState([])
  const [channels, setChannels] = useState([])
  const [apiRegions, setApiRegions] = useState([])  // API regions with IDs
  const [catalogProductCounts, setCatalogProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCatalog, setSelectedCatalog] = useState(null)
  
  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    region: '',
    code: '',
    name: '',
    status: 'active',
    priority: 1,
    channel_id: '',
    EffectiveFrom: '',
    EffectiveTo: '',
    IsDefault: false
  })
  
  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    status: 'active',
    priority: 1,
    channel_id: '',
    EffectiveFrom: '',
    EffectiveTo: '',
    IsDefault: false
  })
  
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState(null)
  const [createError, setCreateError] = useState(null)
  const [createSuccess, setCreateSuccess] = useState(null)

  // Regional configuration
  const regions = [
    { code: 'AMER', name: 'Americas', icon: GlobeAmericasIcon, color: 'blue' },
    { code: 'EMEA', name: 'Europe, Middle East & Africa', icon: GlobeEuropeAfricaIcon, color: 'green' },
    { code: 'APJ', name: 'Asia Pacific & Japan', icon: GlobeAsiaAustraliaIcon, color: 'indigo' },
    { code: 'LA', name: 'Latin America', icon: GlobeAltIcon, color: 'red' }
  ]

  // Get regional statistics - show all regions to everyone
  const getRegionalStats = () => {
    const stats = regions
      .map(region => {
        const regionCatalogs = filteredCatalogs.filter(catalog => catalog.region === region.code)
        const activeCatalogs = regionCatalogs.filter(catalog => catalog.status === 'active')
        
        return {
          ...region,
          totalCatalogs: regionCatalogs.length,
          activeCatalogs: activeCatalogs.length,
          inactiveCatalogs: regionCatalogs.length - activeCatalogs.length
        }
      })
    
    return stats
  }

  // Fetch catalogs from all accessible regions
  const fetchAllCatalogs = async () => {
    try {
      setLoading(true)
      
      // First fetch regions to map region IDs to region codes and names
      const regionsResponse = await fetch('/api/catalogs/regions')
      let regionsMap = {}
      
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json()
        regionsMap = regionsData.regions.reduce((map, region) => {
          map[region.id] = {
            code: region.code,
            name: region.name
          }
          return map
        }, {})
      }
      
      const response = await fetch('/api/catalogs')
      
      if (response.ok) {
        const data = await response.json()
        const allCatalogs = data.catalogs || []
        
        // Process catalogs and add region information using proper region lookup
        const catalogsWithRegion = allCatalogs.map(catalog => {
          // Use regionId from API response to get proper region info
          const regionInfo = regionsMap[catalog.regionId]
          
          // Fallback to extracting from code if region lookup fails
          let regionCode, regionName
          if (regionInfo) {
            regionCode = regionInfo.code
            regionName = regionInfo.name
          } else {
            // Fallback: try to extract region from catalog code
            const codeRegion = catalog.code.split('_').find(part => 
              regions.some(r => r.code === part)
            )
            const region = regions.find(r => r.code === codeRegion)
            regionCode = codeRegion || 'UNKNOWN'
            regionName = region ? region.name : regionCode
          }
          
          return {
            ...catalog,
            region: regionCode,
            regionName: regionName
          }
        })
        
        setCatalogs(catalogsWithRegion)
        setFilteredCatalogs(catalogsWithRegion)
      } else {
        setError('Failed to load catalogs')
      }
    } catch (error) {
      console.error('Failed to fetch catalogs:', error)
      setError('Failed to load catalogs')
    } finally {
      setLoading(false)
    }
  }

  // Fetch channels
  const fetchChannels = async () => {
    try {
      console.log('🔄 Fetching channels...')
      const response = await fetch('/api/catalogs/channels')
      console.log('📡 Channels response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Channels data received:', data)
        setChannels(data.channels || [])
        console.log('✅ Channels set:', data.channels?.length || 0, 'channels')
      } else {
        console.error('❌ Failed to fetch channels - HTTP', response.status)
      }
    } catch (error) {
      console.error('❌ Failed to fetch channels:', error)
    }
  }

  // Fetch regions from API
  const fetchRegions = async () => {
    try {
      console.log('🔄 Fetching regions...')
      const response = await fetch('/api/catalogs/regions')
      console.log('📡 Regions response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Regions data received:', data)
        setApiRegions(data.regions || [])
        console.log('✅ Regions set:', data.regions?.length || 0, 'regions')
      } else {
        console.error('❌ Failed to fetch regions - HTTP', response.status)
      }
    } catch (error) {
      console.error('❌ Failed to fetch regions:', error)
    }
  }

  useEffect(() => {
    // Allow everyone to view all catalogs (remove canViewCatalogs check)
    fetchAllCatalogs()
    fetchChannels()
    fetchRegions()
  }, [])

  // Fetch product counts for all catalogs
  useEffect(() => {
    const fetchProductCounts = async () => {
      if (catalogs.length === 0) return
      
      const counts = {}
      
      // Fetch product counts for each catalog in parallel
      await Promise.all(
        catalogs.map(async (catalog) => {
          try {
            const response = await fetch(`/api/catalogproduct/catalog/${catalog.id}/products?pageSize=1`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              counts[catalog.id] = data.totalCount || 0
            } else {
              counts[catalog.id] = 0
            }
          } catch (error) {
            console.error(`Failed to fetch product count for catalog ${catalog.id}:`, error)
            counts[catalog.id] = 0
          }
        })
      )
      
      setCatalogProductCounts(counts)
    }
    
    fetchProductCounts()
  }, [catalogs])

  // Filter catalogs based on search and filters
  useEffect(() => {
    let filtered = [...catalogs]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(catalog => 
        catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.regionName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(catalog => catalog.region === regionFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(catalog => catalog.status === statusFilter)
    }

    setFilteredCatalogs(filtered)
  }, [catalogs, searchQuery, regionFilter, statusFilter])

  // Force re-render of catalogs when channels are loaded to update channel names
  useEffect(() => {
    if (channels.length > 0 && catalogs.length > 0) {
      // Force a state update to trigger re-render of the table with updated channel names
      setFilteredCatalogs(prev => [...prev])
    }
  }, [channels.length, catalogs.length])

  const getRegionConfig = (regionCode) => {
    return regions.find(r => r.code === regionCode) || regions[0]
  }

  const getChannelName = (marketSegmentId) => {
    if (!marketSegmentId) {
      return 'No Channel'
    }
    
    if (channels.length === 0) {
      return 'Loading...'
    }
    
    const channel = channels.find(c => c.id === marketSegmentId)
    return channel ? channel.name : `Unknown Channel`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }
  
  const formatDateForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().slice(0, 16)
  }
  
  // Create Modal Functions
  const resetCreateForm = () => {
    setCreateFormData({
      region: '',
      code: '',
      name: '',
      status: 'active',
      priority: 1,
      channel_id: '',
      EffectiveFrom: '',
      EffectiveTo: '',
      IsDefault: false
    })
  }
  
  const handleOpenCreateModal = () => {
    console.log('🎯 Opening create modal...')
    console.log('📋 Available channels:', channels.length, channels)
    console.log('🌍 Available regions:', regions.filter(r => hasRegionAccess(r.code)))
    console.log('👤 User permissions check:')
    regions.forEach(region => {
      const hasAccess = hasRegionAccess(region.code)
      console.log(`  - ${region.code}: ${hasAccess}`)
    })
    resetCreateForm()
    // Set default effective dates for new catalogs
    const today = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(today.getFullYear() + 1)
    
    setCreateFormData(prev => ({
      ...prev,
      EffectiveFrom: formatDateForInput(today),
      EffectiveTo: formatDateForInput(oneYearFromNow)
    }))
    
    setCreateError(null)
    setCreateSuccess(null)
    setShowCreateModal(true)
  }
  
  const handleRegionSelection = (regionCode) => {
    console.log('🌍 Region selected:', regionCode)
    setCreateFormData(prev => ({
      ...prev,
      region: regionCode,
      // Reset channel and derived fields when region changes
      channel_id: '',
      code: '',
      name: ''
    }))
  }
  
  const handleChannelSelection = (channelId) => {
    const selectedChannel = channels.find(c => c.id === channelId)
    const selectedRegion = regions.find(r => r.code === createFormData.region)
    
    if (selectedChannel && selectedRegion) {
      // Generate default code and name based on region and channel
      const channelCode = selectedChannel.code || selectedChannel.name.toUpperCase().replace(/\s+/g, '_')
      const defaultCode = `${createFormData.region}_${channelCode}_`
      const defaultName = `${selectedRegion.name} ${selectedChannel.name} Catalog`
      
      console.log('📝 Generating defaults:', { regionCode: createFormData.region, channelCode, defaultCode, defaultName })
      
      setCreateFormData(prev => ({
        ...prev,
        channel_id: channelId,
        code: defaultCode,
        name: defaultName
      }))
    } else {
      setCreateFormData(prev => ({
        ...prev,
        channel_id: channelId,
        code: '',
        name: ''
      }))
    }
  }
  
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleCreateCatalog = async () => {
    try {
      setCreateError(null)
      setCreateSuccess(null)
      
      console.log('🎯 === CATALOG CREATE STARTED ===')
      console.log('📝 Form data:', createFormData)
      
      // Need to find the region ID from the region code
      const selectedRegion = apiRegions.find(r => r.code === createFormData.region)
      if (!selectedRegion) {
        setCreateError('Invalid region selected')
        return
      }
      
      // Prepare the API payload (using PascalCase as expected by the API)
      const catalogPayload = {
        Code: createFormData.code,
        Name: createFormData.name,
        Status: createFormData.status,
        Priority: createFormData.priority,
        MarketSegmentId: createFormData.channel_id,  // API expects MarketSegmentId not ChannelId
        RegionId: selectedRegion.id,  // Use the region ID from the API
        CurrencyId: "770e8400-e29b-41d4-a716-446655440001",  // Default to USD for now
        EffectiveFrom: createFormData.EffectiveFrom,
        EffectiveTo: createFormData.EffectiveTo,
        IsDefault: createFormData.IsDefault
      }
      
      console.log('📦 API payload:', catalogPayload)
      
      const response = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(catalogPayload)
      })
      
      console.log('📤 Create response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Catalog created successfully:', result)
        setCreateSuccess('Catalog created successfully!')
        
        // Refresh catalogs list
        await fetchAllCatalogs()
        
        // Close modal after brief delay
        setTimeout(() => {
          setShowCreateModal(false)
          resetCreateForm()
        }, 1500)
      } else {
        const errorData = await response.json()
        console.error('❌ Create failed:', errorData)
        setCreateError(errorData.error || 'Failed to create catalog')
      }
    } catch (error) {
      console.error('Exception creating catalog:', error)
      setCreateError('Failed to create catalog: ' + error.message)
    }
  }

  // Catalog Edit Modal Functions
  const openEditModal = (catalog) => {
    console.log('🎯 === CATALOG EDIT MODAL OPENING ===')
    console.log('📦 Catalog to edit:', catalog)
    console.log('🔑 Can edit catalogs?', canEditCatalogs())
    
    setSelectedCatalog(catalog)
    setEditFormData({
      code: catalog.code || '',
      name: catalog.name || '',
      status: catalog.status || 'active',
      priority: catalog.priority || 1,
      channel_id: catalog.market_segment_id || catalog.marketSegmentId || '',
      EffectiveFrom: catalog.effective_from ? 
        new Date(catalog.effective_from).toISOString().slice(0, 10) : '',
      EffectiveTo: catalog.effective_to ? 
        new Date(catalog.effective_to).toISOString().slice(0, 10) : '',
      IsDefault: catalog.is_default || catalog.IsDefault || false
    })
    setEditError(null)
    setEditSuccess(null)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedCatalog(null)
    setEditError(null)
    setEditSuccess(null)
    setSaving(false)
  }
  
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateError(null)
    setCreateSuccess(null)
    resetCreateForm()
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setEditError(null)
      setEditSuccess(null)

      console.log('💾 === CATALOG UPDATE STARTED ===')
      console.log('📦 Catalog ID:', selectedCatalog.id)
      console.log('📝 Form data:', editFormData)

      const response = await fetch(`/api/catalogs/${selectedCatalog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editFormData)
      })

      console.log('📤 Update response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Catalog updated successfully:', result)
        setEditSuccess('Catalog updated successfully!')
        
        // Update the catalog in the local state
        setCatalogs(prevCatalogs => 
          prevCatalogs.map(cat => 
            cat.id === selectedCatalog.id 
              ? { 
                  ...cat, 
                  code: editFormData.code,
                  name: editFormData.name,
                  status: editFormData.status,
                  priority: editFormData.priority,
                  effective_from: editFormData.EffectiveFrom ? new Date(editFormData.EffectiveFrom + 'T00:00:00.000Z').toISOString() : null,
                  effective_to: editFormData.EffectiveTo ? new Date(editFormData.EffectiveTo + 'T23:59:59.999Z').toISOString() : null,
                  is_default: editFormData.IsDefault
                }
              : cat
          )
        )
        
        // Close modal after brief delay
        setTimeout(() => {
          closeEditModal()
        }, 1500)
      } else {
        const errorData = await response.json()
        console.error('❌ Update failed:', errorData)
        setEditError(errorData.error || 'Failed to update catalog')
      }
    } catch (error) {
      console.error('Exception updating catalog:', error)
      setEditError('Failed to update catalog: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Remove the canViewCatalogs check - everyone can view all catalogs

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
        </div>
      </div>
    )
  }

  const regionalStats = getRegionalStats()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-6 text-gray-900">All Catalogs</h1>
          <p className="mt-2 text-sm text-gray-700">
            View product catalogs across all regions. Create and edit permissions are role-based.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {/* Show create button if user can edit catalogs in any region */}
          {regions.some(region => canEditCatalogs(region.code)) && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Catalog
            </button>
          )}
        </div>
      </div>

      {/* Regional Overview Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {regionalStats.map((region) => {
          const RegionIcon = region.icon
          return (
            <div
              key={region.code}
              className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
            >
              <div>
                <div className={`absolute rounded-md bg-${region.color}-500 p-3`}>
                  <RegionIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{region.name}</p>
                <p className="ml-16 text-2xl font-semibold text-gray-900">{region.totalCatalogs}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link
                    to={`/catalogs/${region.code.toLowerCase()}`}
                    className={`font-medium text-${region.color}-600 hover:text-${region.color}-500`}
                  >
                    View regional catalogs
                    <span className="sr-only"> for {region.name}</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search and Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search catalogs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-800 focus:border-green-800 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Region Filter */}
          <select
            className="block py-2 pl-3 pr-10 text-sm border-gray-300 focus:outline-none focus:ring-green-800 focus:border-green-800 rounded-md"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="block py-2 pl-3 pr-10 text-sm border-gray-300 focus:outline-none focus:ring-green-800 focus:border-green-800 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Catalogs Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              
              <table className="min-w-full divide-y divide-gray-200">
                
                <thead className="bg-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Region
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Channel
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Period
                    </th>
                    <th scope="col" className="relative px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCatalogs.map((catalog, index) => {
                    const regionConfig = getRegionConfig(catalog.region)
                    const RegionIcon = regionConfig.icon
                    
                    return (
                      <tr 
                        key={`${catalog.region}-${catalog.id}`} 
                        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                        onDoubleClick={() => canEditCatalogs(catalog.region) ? openEditModal(catalog) : navigate(`/catalogs/${catalog.region.toLowerCase()}/${catalog.id}`)}
                        title={canEditCatalogs(catalog.region) ? "🎯 Double-click to edit catalog" : "Double-click to manage catalog products"}
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-900">
                          {catalog.code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {catalog.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <RegionIcon className={`h-4 w-4 text-${regionConfig.color}-500 mr-1`} />
                            <span className="text-sm text-gray-900">{catalog.regionName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {(catalog.channel_name && catalog.channel_name !== 'Unknown Channel') ? 
                            catalog.channel_name : 
                            getChannelName(catalog.market_segment_id || catalog.marketSegmentId)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            catalog.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {catalog.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(catalog.effective_from)} - {catalog.effective_to ? formatDate(catalog.effective_to) : 'Ongoing'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/catalogs/${catalog.region.toLowerCase()}/${catalog.id}`}
                              className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-green-800 bg-green-50 border border-green-200 rounded hover:bg-green-100 hover:text-green-900"
                              title="View catalog products"
                            >
                              <CubeIcon className="h-4 w-4" />
                              <span className="font-mono inline-block text-right" style={{minWidth: '3ch'}}>{catalogProductCounts[catalog.id] || 0}</span>&nbsp;Products
                            </Link>
                            
                            {canEditCatalogs(catalog.region) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditModal(catalog)
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:text-blue-900"
                                title="Edit catalog"
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span>Edit Catalog</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              
              </table>
              
              {filteredCatalogs.length === 0 && (
                <div className="text-center py-12">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No catalogs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || regionFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by creating your first catalog.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Catalog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Catalog
                </h3>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Success Message */}
              {createSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <CheckIcon className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{createSuccess}</p>
                      <p className="text-xs text-green-600 mt-1">Modal will close automatically...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {createError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{createError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Region Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Region *
                  </label>
                  <select
                    value={createFormData.region}
                    onChange={(e) => handleRegionSelection(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a region first...</option>
                    {regions
                      .filter(region => {
                        const hasAccess = hasRegionAccess(region.code)
                        console.log(`🔐 Region access check: ${region.code} (${region.name}) - Access: ${hasAccess}`)
                        return hasAccess
                      })
                      .map((region) => {
                        const RegionIcon = region.icon
                        return (
                          <option key={region.code} value={region.code}>
                            {region.name} ({region.code})
                          </option>
                        )
                      })}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Only regions you have access to are shown
                  </p>
                </div>

                {/* Sales Channel - only show after region is selected */}
                {createFormData.region && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sales Channel *
                    </label>
                    <select
                      value={createFormData.channel_id}
                      onChange={(e) => handleChannelSelection(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a sales channel...</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Selecting a channel will auto-generate the catalog code and name
                    </p>
                  </div>
                )}

                {/* Code (auto-populated) */}
                {createFormData.channel_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Catalog Code *
                    </label>
                    <input
                      type="text"
                      value={createFormData.code}
                      onChange={(e) => handleCreateFormChange('code', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Catalog code..."
                      required
                    />
                  </div>
                )}

                {/* Name (auto-populated) */}
                {createFormData.channel_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Catalog Name *
                    </label>
                    <input
                      type="text"
                      value={createFormData.name}
                      onChange={(e) => handleCreateFormChange('name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Catalog name..."
                      required
                    />
                  </div>
                )}

                {/* Effective From (auto-populated) */}
                {createFormData.channel_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Effective From
                    </label>
                    <input
                      type="datetime-local"
                      value={createFormData.EffectiveFrom}
                      onChange={(e) => handleCreateFormChange('EffectiveFrom', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Effective To (auto-populated) */}
                {createFormData.channel_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Effective To
                    </label>
                    <input
                      type="datetime-local"
                      value={createFormData.EffectiveTo}
                      onChange={(e) => handleCreateFormChange('EffectiveTo', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeCreateModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCatalog}
                  disabled={!createFormData.region || !createFormData.channel_id || !createFormData.code || !createFormData.name}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {!createFormData.region ? 'Select Region First' : 
                   !createFormData.channel_id ? 'Select Channel Next' : 
                   'Create Catalog'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Edit Modal */}
      {showEditModal && selectedCatalog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Catalog: {selectedCatalog.code}
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Success Message */}
              {editSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <CheckIcon className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{editSuccess}</p>
                      <p className="text-xs text-green-600 mt-1">Modal will close automatically...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{editError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  
                  {/* Code */}
                  <div>
                    <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700">
                      Catalog Code
                    </label>
                    <input
                      type="text"
                      id="edit-code"
                      value={editFormData.code}
                      onChange={(e) => handleEditFormChange('code', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                      Catalog Name
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      value={editFormData.status}
                      onChange={(e) => handleEditFormChange('status', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <input
                      type="number"
                      id="edit-priority"
                      min="1"
                      max="100"
                      value={editFormData.priority}
                      onChange={(e) => handleEditFormChange('priority', parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>

                  {/* Channel */}
                  <div className="sm:col-span-2">
                    <label htmlFor="edit-channel" className="block text-sm font-medium text-gray-700">
                      Sales Channel
                    </label>
                    <select
                      id="edit-channel"
                      value={editFormData.channel_id}
                      onChange={(e) => handleEditFormChange('channel_id', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    <label htmlFor="edit-effective-from" className="block text-sm font-medium text-gray-700">
                      Effective From
                    </label>
                    <input
                      type="date"
                      id="edit-effective-from"
                      value={editFormData.EffectiveFrom}
                      onChange={(e) => handleEditFormChange('EffectiveFrom', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>

                  {/* Effective To */}
                  <div>
                    <label htmlFor="edit-effective-to" className="block text-sm font-medium text-gray-700">
                      Effective To
                    </label>
                    <input
                      type="date"
                      id="edit-effective-to"
                      value={editFormData.EffectiveTo}
                      onChange={(e) => handleEditFormChange('EffectiveTo', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>

                  {/* IsDefault checkbox */}
                  <div className="sm:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="edit-is-default"
                      checked={editFormData.IsDefault}
                      onChange={(e) => handleEditFormChange('IsDefault', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-is-default" className="ml-3 block text-sm font-medium text-gray-700">
                      Set as default catalog for this region
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllCatalogsPage