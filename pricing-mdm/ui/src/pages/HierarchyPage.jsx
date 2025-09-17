import React, { useState, useEffect } from 'react'
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  PlusIcon,
  GlobeAltIcon,
  MapIcon,
  LanguageIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const API_BASE = '/api'

function HierarchyPage() {
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set(['regions']))
  const [showLocaleForm, setShowLocaleForm] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [localeFormData, setLocaleFormData] = useState({
    name: '',
    code: '',
    languageCode: 'en',
    currencyId: '',
    isRtl: false,
    dateFormat: 'MM/dd/yyyy',
    numberFormat: '{}',
    priority: 100
  })

  // Load tree data and currencies on mount
  useEffect(() => {
    loadTreeData()
    loadCurrencies()
  }, [])

  // Load the hierarchical tree structure
  const loadTreeData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE}/tree?includeCompliance=true&includeInactive=false`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTreeData(data)
      
      // Auto-expand first region
      if (data.length > 0) {
        setExpandedNodes(prev => new Set([...prev, data[0].id]))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load available currencies
  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${API_BASE}/tree/currencies`)
      if (response.ok) {
        const currencyData = await response.json()
        setCurrencies(currencyData)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.warn('Could not load currencies:', err)
      // Fallback currencies
      setCurrencies([
        { id: '1', code: 'USD', symbol: '$', name: 'US Dollar' },
        { id: '2', code: 'EUR', symbol: '€', name: 'Euro' },
        { id: '3', code: 'GBP', symbol: '£', name: 'British Pound' }
      ])
    }
  }

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  // Handle country selection
  const selectCountry = (countryNode) => {
    setSelectedCountry(countryNode)
    setShowLocaleForm(false)
    
    // Reset form with country defaults
    setLocaleFormData({
      name: '',
      code: '',
      languageCode: 'en',
      currencyId: currencies.length > 0 ? currencies[0].id : '',
      isRtl: false,
      dateFormat: 'MM/dd/yyyy',
      numberFormat: '{}',
      priority: countryNode.children ? countryNode.children.length + 1 : 1
    })
  }

  // Show locale creation form
  const showCreateLocaleForm = () => {
    if (!selectedCountry) return
    
    // Generate default values based on country
    const countryCode = selectedCountry.metadata?.code || 'US'
    const defaultLanguage = getDefaultLanguageForCountry(countryCode)
    const defaultCurrency = getDefaultCurrencyForCountry(countryCode)
    
    setLocaleFormData({
      name: `${defaultLanguage.name} (${selectedCountry.name})`,
      code: `${defaultLanguage.code}_${countryCode.toUpperCase()}`,
      languageCode: defaultLanguage.code,
      currencyId: defaultCurrency?.id || (currencies.length > 0 ? currencies[0].id : ''),
      isRtl: defaultLanguage.isRtl || false,
      dateFormat: defaultLanguage.dateFormat || 'MM/dd/yyyy',
      numberFormat: defaultLanguage.numberFormat || '{}',
      priority: selectedCountry.children ? selectedCountry.children.length + 1 : 1
    })
    
    setShowLocaleForm(true)
  }

  // Create new locale
  const createLocale = async (e) => {
    e.preventDefault()
    
    if (!selectedCountry) return
    
    try {
      const countryId = selectedCountry.metadata.entityId
      
      const createRequest = {
        nodeType: 'locale',
        name: localeFormData.name,
        code: localeFormData.code.toLowerCase(),
        parentId: countryId,
        properties: {
          languageCode: localeFormData.languageCode.toLowerCase(),
          currencyId: localeFormData.currencyId,
          isRtl: localeFormData.isRtl,
          dateFormat: localeFormData.dateFormat,
          numberFormat: localeFormData.numberFormat,
          priority: parseInt(localeFormData.priority)
        }
      }
      
      const response = await fetch(`${API_BASE}/tree/create-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(createRequest)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const newLocale = await response.json()
      
      // Reload tree data to show new locale
      await loadTreeData()
      
      // Reset form and hide it
      setShowLocaleForm(false)
      setLocaleFormData({
        name: '',
        code: '',
        languageCode: 'en',
        currencyId: currencies.length > 0 ? currencies[0].id : '',
        isRtl: false,
        dateFormat: 'MM/dd/yyyy',
        numberFormat: '{}',
        priority: 100
      })
      
      // Expand the country node to show the new locale
      setExpandedNodes(prev => new Set([...prev, selectedCountry.id]))
      
      alert(`Locale "${newLocale.name}" created successfully!`)
      
    } catch (err) {
      alert(`Failed to create locale: ${err.message}`)
    }
  }

  // Get default language info for a country
  const getDefaultLanguageForCountry = (countryCode) => {
    const languageMap = {
      'US': { code: 'en', name: 'English', isRtl: false, dateFormat: 'MM/dd/yyyy', numberFormat: '{}' },
      'CA': { code: 'en', name: 'English', isRtl: false, dateFormat: 'MM/dd/yyyy', numberFormat: '{}' },
      'MX': { code: 'es', name: 'Spanish', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'FR': { code: 'fr', name: 'French', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'DE': { code: 'de', name: 'German', isRtl: false, dateFormat: 'dd.MM.yyyy', numberFormat: '{}' },
      'GB': { code: 'en', name: 'English', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'IT': { code: 'it', name: 'Italian', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'ES': { code: 'es', name: 'Spanish', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'CH': { code: 'de', name: 'German', isRtl: false, dateFormat: 'dd.MM.yyyy', numberFormat: '{}' },
      'JP': { code: 'ja', name: 'Japanese', isRtl: false, dateFormat: 'yyyy/MM/dd', numberFormat: '{}' },
      'CN': { code: 'zh', name: 'Chinese', isRtl: false, dateFormat: 'yyyy/MM/dd', numberFormat: '{}' },
      'AU': { code: 'en', name: 'English', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'BR': { code: 'pt', name: 'Portuguese', isRtl: false, dateFormat: 'dd/MM/yyyy', numberFormat: '{}' },
      'RU': { code: 'ru', name: 'Russian', isRtl: false, dateFormat: 'dd.MM.yyyy', numberFormat: '{}' }
    }
    
    return languageMap[countryCode] || languageMap['US']
  }

  // Get default currency for a country
  const getDefaultCurrencyForCountry = (countryCode) => {
    const currencyMap = {
      'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'FR': 'EUR', 'DE': 'EUR',
      'GB': 'GBP', 'IT': 'EUR', 'ES': 'EUR', 'CH': 'CHF', 'JP': 'JPY',
      'CN': 'CNY', 'AU': 'AUD', 'BR': 'BRL', 'RU': 'RUB'
    }
    
    const currencyCode = currencyMap[countryCode] || 'USD'
    return currencies.find(c => c.code === currencyCode)
  }

  // Get compliance risk styling
  const getComplianceStyle = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Render tree node
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isCountry = node.type === 'country'
    const isLocale = node.type === 'locale'
    
    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors duration-150 ${
            selectedCountry?.id === node.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id)
            if (isCountry) selectCountry(node)
          }}
        >
          {hasChildren && (
            <button className="mr-2 p-1 hover:bg-gray-200 rounded">
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-6 mr-2" />}
          
          <span className="mr-2 text-lg">{node.icon}</span>
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              
              {/* Compliance indicator */}
              {node.metadata?.complianceRisk && (
                <span className={`px-2 py-1 text-xs rounded-full border ${
                  getComplianceStyle(node.metadata.complianceRisk)
                }`}>
                  {node.metadata.complianceRisk}
                </span>
              )}
              
              {/* Primary locale indicator */}
              {isLocale && node.metadata?.isPrimary && (
                <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Primary
                </span>
              )}
              
              {/* Item count */}
              {node.metadata?.itemCount > 0 && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {node.metadata.itemCount}
                </span>
              )}
            </div>
            
            {/* Country action button */}
            {isCountry && selectedCountry?.id === node.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  showCreateLocaleForm()
                }}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded text-sm font-medium transition-all duration-200"
              >
                Add Locale
              </button>
            )}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Hierarchy</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button 
            onClick={loadTreeData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Region Hierarchy Management</h1>
            <p className="text-gray-600 mt-1">
              Manage the Region → Country → Locale hierarchy with compliance indicators
            </p>
          </div>
          <button 
            onClick={loadTreeData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Geographic Hierarchy
              </h2>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {treeData.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hierarchy data available
                </div>
              ) : (
                <div className="space-y-1 group">
                  {treeData.map(node => renderTreeNode(node))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Selected Country Info */}
          {selectedCountry && (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapIcon className="h-5 w-5 mr-2" />
                  {selectedCountry.name}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div><span className="font-medium">Country Code:</span> {selectedCountry.metadata?.code}</div>
                  <div><span className="font-medium">Native Name:</span> {selectedCountry.metadata?.nativeName || selectedCountry.name}</div>
                  <div><span className="font-medium">Continent:</span> {selectedCountry.metadata?.continent || 'N/A'}</div>
                  <div><span className="font-medium">Locales:</span> {selectedCountry.metadata?.itemCount || 0}</div>
                  {selectedCountry.metadata?.complianceRisk && (
                    <div>
                      <span className="font-medium">Compliance Risk:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        getComplianceStyle(selectedCountry.metadata.complianceRisk)
                      }`}>
                        {selectedCountry.metadata.complianceRisk}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={showCreateLocaleForm}
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Locale for {selectedCountry.name}
                </button>
              </div>
            </div>
          )}

          {/* Locale Creation Form */}
          {showLocaleForm && selectedCountry && (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <LanguageIcon className="h-5 w-5 mr-2" />
                  Create New Locale
                </h3>
              </div>
              <form onSubmit={createLocale} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Locale Name
                  </label>
                  <input
                    type="text"
                    value={localeFormData.name}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Locale Code
                  </label>
                  <input
                    type="text"
                    value={localeFormData.code}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, code: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., en_US, fr_CA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language Code
                  </label>
                  <input
                    type="text"
                    value={localeFormData.languageCode}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, languageCode: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., en, fr, de"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={localeFormData.currencyId}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, currencyId: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Currency</option>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    value={localeFormData.dateFormat}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, dateFormat: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MM/dd/yyyy">MM/dd/yyyy (US)</option>
                    <option value="dd/MM/yyyy">dd/MM/yyyy (UK/EU)</option>
                    <option value="dd.MM.yyyy">dd.MM.yyyy (German)</option>
                    <option value="yyyy/MM/dd">yyyy/MM/dd (Asian)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={localeFormData.priority}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, priority: parseInt(e.target.value)}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers = higher priority</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRtl"
                    checked={localeFormData.isRtl}
                    onChange={(e) => setLocaleFormData(prev => ({...prev, isRtl: e.target.checked}))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRtl" className="ml-2 block text-sm text-gray-900">
                    Right-to-left language
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Locale
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocaleForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Instructions */}
          {!selectedCountry && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Click on regions to expand/collapse</p>
                <p>• Click on countries to select them</p>
                <p>• Use "Add Locale" to create new locales for selected countries</p>
                <p>• Compliance indicators show regulatory risk levels</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HierarchyPage