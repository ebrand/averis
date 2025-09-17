import React, { useState, useEffect } from 'react'
import { 
  MapIcon, 
  GlobeAmericasIcon, 
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FlagIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const RegionsPage = () => {
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  
  // Compliance screening state
  const [complianceData, setComplianceData] = useState({})
  const [complianceLoading, setComplianceLoading] = useState({})
  
  // Locale creation modal state
  const [showCreateLocaleModal, setShowCreateLocaleModal] = useState(false)
  const [createLocaleLoading, setCreateLocaleLoading] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [countries, setCountries] = useState([])
  const [localeForm, setLocaleForm] = useState({
    name: '',
    code: '',
    nativeName: '',
    languageCode: '',
    countryCode: '',
    countryId: '',
    currencyId: '',
    isRtl: false,
    dateFormat: 'MM/dd/yyyy',
    numberFormat: '{}',
    priority: 100,
    editingLocaleId: null // Track if we're editing an existing locale
  })

  // Common language options with metadata
  const [languages] = useState([
    { code: 'en', name: 'English', nativeName: 'English', isRtl: false, dateFormat: 'MM/dd/yyyy' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'fr', name: 'French', nativeName: 'Français', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', isRtl: false, dateFormat: 'dd.MM.yyyy' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', isRtl: false, dateFormat: 'dd-MM-yyyy' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', isRtl: false, dateFormat: 'yyyy-MM-dd' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', isRtl: false, dateFormat: 'dd-MM-yyyy' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', isRtl: false, dateFormat: 'dd.MM.yyyy' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', isRtl: false, dateFormat: 'd.M.yyyy' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', isRtl: false, dateFormat: 'dd.MM.yyyy' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', isRtl: false, dateFormat: 'dd.MM.yyyy' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isRtl: false, dateFormat: 'yyyy/MM/dd' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', isRtl: false, dateFormat: 'yyyy. M. d.' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', isRtl: false, dateFormat: 'yyyy/M/d' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isRtl: false, dateFormat: 'yyyy/M/d' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true, dateFormat: 'dd/MM/yyyy' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRtl: true, dateFormat: 'dd/MM/yyyy' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', isRtl: false, dateFormat: 'd/M/yyyy' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isRtl: false, dateFormat: 'dd/MM/yyyy' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRtl: false, dateFormat: 'dd.MM.yyyy' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', isRtl: false, dateFormat: 'd. M. yyyy' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', isRtl: false, dateFormat: 'yyyy. MM. dd.' }
  ])
  
  // Fetch tree data from the API
  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/tree')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setTreeData(data)
        
        // Keep all nodes collapsed by default - user can expand manually
      } catch (err) {
        setError(err.message)
        console.error('Error fetching tree data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTreeData()
    fetchCurrencies()
    fetchCountries()
  }, [])

  // Fetch available currencies
  const fetchCurrencies = async () => {
    try {
      console.log('Fetching currencies from API...')
      const response = await fetch('/api/tree/currencies', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Add a timeout
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Successfully fetched currencies:', data)
        setCurrencies(data)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Error fetching currencies:', err)
      console.log('Using fallback currencies')
      // Enhanced fallback currencies based on database content
      setCurrencies([
        { id: 'f834f3c5-1c1c-4a68-a2c4-5770f88a2774', code: 'USD', name: 'US Dollar', symbol: '$' },
        { id: '6b44741a-6273-46af-87e5-1bacb125f4f1', code: 'EUR', name: 'Euro', symbol: '€' },
        { id: 'a883fd36-4275-4e29-84ad-0b6dc461f032', code: 'GBP', name: 'British Pound', symbol: '£' },
        { id: '89d42e97-035e-4d08-baef-39ef131f7167', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { id: '2a8135bd-efcc-435f-9172-05a00bebb7dd', code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { id: '6e26d863-87d1-4c5a-98a5-041aabbb2983', code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { id: '5bbf73f7-f878-4c8b-80d5-a9c3e336cac2', code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { id: '1d47b579-53cc-40e7-bcb2-ba24ec9f050c', code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
        { id: 'fc597655-2eb1-4b46-818a-87c71d5a2b6d', code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' }
      ])
    }
  }

  // Fetch available countries
  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries')
      if (response.ok) {
        const data = await response.json()
        setCountries(data)
      }
    } catch (err) {
      console.error('Error fetching countries:', err)
    }
  }

  // Compliance screening functions
  const screenCountryCompliance = async (countryCode, countryName) => {
    if (!countryCode) return null
    
    const key = `country_${countryCode}`
    setComplianceLoading(prev => ({ ...prev, [key]: true }))
    
    try {
      const response = await fetch(
        `/api/compliance/screen/country/${countryCode}?countryName=${encodeURIComponent(countryName || countryCode)}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setComplianceData(prev => ({ ...prev, [key]: data }))
        return data
      }
    } catch (err) {
      console.error('Error screening country compliance:', err)
    } finally {
      setComplianceLoading(prev => ({ ...prev, [key]: false }))
    }
    
    return null
  }

  const assessRegionalRisk = async (regionCode) => {
    if (!regionCode) return null
    
    const key = `region_${regionCode}`
    setComplianceLoading(prev => ({ ...prev, [key]: true }))
    
    try {
      const response = await fetch(`/api/compliance/assess/region/${regionCode}`)
      
      if (response.ok) {
        const data = await response.json()
        setComplianceData(prev => ({ ...prev, [key]: data }))
        return data
      }
    } catch (err) {
      console.error('Error assessing regional risk:', err)
    } finally {
      setComplianceLoading(prev => ({ ...prev, [key]: false }))
    }
    
    return null
  }

  // Automatically screen compliance when a node is selected
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.type === 'country' && selectedNode.metadata?.code) {
        screenCountryCompliance(selectedNode.metadata.code, selectedNode.name)
      } else if (selectedNode.type === 'region' && selectedNode.metadata?.code) {
        assessRegionalRisk(selectedNode.metadata.code)
      }
    }
  }, [selectedNode])

  // Auto-populate compliance badges for high-risk countries when tree loads
  useEffect(() => {
    const populateComplianceBadges = async () => {
      if (treeData.length > 0) {
        // Screen known high-risk countries automatically for badge display
        const highRiskCountries = ['RU', 'IR', 'KP', 'CU', 'SY']
        
        for (const region of treeData) {
          if (region.children) {
            for (const country of region.children) {
              if (country.type === 'country' && country.metadata?.code) {
                if (highRiskCountries.includes(country.metadata.code)) {
                  // Screen high-risk countries in background for badge data
                  screenCountryCompliance(country.metadata.code, country.name)
                }
              }
            }
          }
        }
      }
    }
    
    populateComplianceBadges()
  }, [treeData])

  // Handle locale creation and editing
  const handleCreateLocale = async () => {
    setCreateLocaleLoading(true)
    const isEditing = !!localeForm.editingLocaleId
    
    try {
      let response
      
      if (isEditing) {
        // Update existing locale
        const updateRequest = {
          name: localeForm.name,
          code: localeForm.code,
          properties: {
            languageCode: localeForm.languageCode,
            countryCode: localeForm.countryCode,
            nativeName: localeForm.nativeName,
            currencyId: localeForm.currencyId,
            isRtl: localeForm.isRtl,
            dateFormat: localeForm.dateFormat,
            numberFormat: localeForm.numberFormat,
            priority: localeForm.priority
          }
        }

        const localeNodeId = `locale_${localeForm.editingLocaleId}`
        response = await fetch(`/api/tree/node/${localeNodeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest)
        })
      } else {
        // Create new locale
        const createRequest = {
          nodeType: 'locale',
          name: localeForm.name,
          code: localeForm.code,
          parentId: localeForm.countryId,
          properties: {
            languageCode: localeForm.languageCode,
            countryCode: localeForm.countryCode,
            nativeName: localeForm.nativeName,
            currencyId: localeForm.currencyId,
            isRtl: localeForm.isRtl,
            dateFormat: localeForm.dateFormat,
            numberFormat: localeForm.numberFormat,
            priority: localeForm.priority
          }
        }

        response = await fetch('/api/tree/create-node', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest)
        })
      }

      if (response.ok) {
        // Refresh tree data
        const treeResponse = await fetch('/api/tree')
        if (treeResponse.ok) {
          const data = await treeResponse.json()
          setTreeData(data)
          
          // Update the selected node with fresh data if it's still selected
          if (selectedNode && selectedNode.type === 'country') {
            const updatedCountry = data
              .flatMap(region => region.children || [])
              .find(country => country.id === selectedNode.id)
            if (updatedCountry) {
              setSelectedNode(updatedCountry)
            }
          }
          
          // Only expand the parent country and region to show the new locale
          if (selectedNode && selectedNode.type === 'country') {
            const countryId = selectedNode.id
            const parentRegion = data.find(region => 
              region.children?.some(country => country.id === countryId)
            )
            if (parentRegion) {
              setExpandedNodes(prev => new Set([...prev, parentRegion.id, countryId]))
            }
          }
        }
        
        // Close modal and reset form
        setShowCreateLocaleModal(false)
        resetLocaleForm()
      } else {
        const errorData = await response.json()
        alert(`Failed to ${isEditing ? 'update' : 'create'} locale: ${errorData.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} locale:`, err)
      alert(`Failed to ${isEditing ? 'update' : 'create'} locale. Please check the console for details.`)
    } finally {
      setCreateLocaleLoading(false)
    }
  }

  // Reset locale form
  const resetLocaleForm = () => {
    setLocaleForm({
      name: '',
      code: '',
      nativeName: '',
      languageCode: '',
      countryCode: '',
      countryId: '',
      currencyId: '',
      isRtl: false,
      dateFormat: 'MM/dd/yyyy',
      numberFormat: '{}',
      priority: 100,
      editingLocaleId: null
    })
  }

  // Handle country selection and auto-populate some fields
  const handleCountryChange = (countryId) => {
    const country = countries.find(c => c.id === countryId)
    if (country) {
      setLocaleForm(prev => ({
        ...prev,
        countryId: countryId,
        countryCode: country.code,
        // Auto-populate date format based on country
        dateFormat: country.code === 'US' ? 'MM/dd/yyyy' : 'dd/MM/yyyy'
      }))
    }
  }

  // Generate unique locale code
  const generateUniqueLocaleCode = (languageCode, countryCode) => {
    const baseCode = `${languageCode.toLowerCase()}_${countryCode.toUpperCase()}`
    
    // Check if this base code already exists in the current tree data
    const existingLocales = treeData
      .flatMap(region => region.children || [])
      .flatMap(country => country.children || [])
      .filter(locale => locale.type === 'locale')
    
    const codeExists = existingLocales.some(locale => 
      locale.metadata?.code?.toLowerCase() === baseCode.toLowerCase()
    )
    
    if (!codeExists) {
      return baseCode
    }
    
    // If base code exists, add a numeric suffix
    let counter = 1
    let uniqueCode
    do {
      uniqueCode = `${baseCode}_${counter}`
      counter++
    } while (existingLocales.some(locale => 
      locale.metadata?.code?.toLowerCase() === uniqueCode.toLowerCase()
    ))
    
    return uniqueCode
  }

  // Handle language selection with auto-population
  const handleLanguageChange = (languageCode) => {
    const language = languages.find(lang => lang.code === languageCode)
    if (language) {
      const country = countries.find(c => c.id === localeForm.countryId)
      const newLocaleCode = country ? generateUniqueLocaleCode(languageCode, country.code) : ''
      
      const isEditMode = !!localeForm.editingLocaleId
      
      if (isEditMode) {
        // In edit mode, only update language-related technical fields, DON'T touch name/nativeName
        setLocaleForm(prev => ({
          ...prev,
          languageCode: languageCode,
          code: newLocaleCode,
          isRtl: language.isRtl,
          dateFormat: language.dateFormat
        }))
      } else {
        // In create mode, auto-populate everything
        const localeName = country ? `${language.name} (${country.name})` : language.name
        const nativeName = `${language.nativeName}${country ? ` (${country.name})` : ''}`
        
        setLocaleForm(prev => ({
          ...prev,
          languageCode: languageCode,
          name: localeName,
          nativeName: nativeName,
          code: newLocaleCode,
          isRtl: language.isRtl,
          dateFormat: language.dateFormat
        }))
      }
    }
  }

  // Auto-generate locale code from language and country
  const updateLocaleCode = (languageCode, countryCode) => {
    if (languageCode && countryCode) {
      setLocaleForm(prev => ({
        ...prev,
        code: `${languageCode.toLowerCase()}_${countryCode.toUpperCase()}`
      }))
    }
  }

  // Initialize locale form for selected country
  const initializeLocaleForCountry = (countryNode) => {
    if (countryNode && countryNode.type === 'country') {
      const countryId = countryNode.metadata.entityId
      const countryCode = countryNode.metadata.code
      
      // Get default currency for country (simplified logic)
      const defaultCurrencyCode = getDefaultCurrencyForCountry(countryCode)
      const defaultCurrency = currencies.find(c => c.code === defaultCurrencyCode)
      
      // Calculate next priority
      const existingLocaleCount = countryNode.children ? countryNode.children.length : 0
      
      setLocaleForm({
        name: '',
        code: '',
        nativeName: '',
        languageCode: '',
        countryCode: countryCode,
        countryId: countryId,
        currencyId: defaultCurrency?.id || (currencies.length > 0 ? currencies[0].id : ''),
        isRtl: false,
        dateFormat: 'MM/dd/yyyy',
        numberFormat: '{}',
        priority: existingLocaleCount + 1
      })
    }
  }

  // Get default currency code for a country
  const getDefaultCurrencyForCountry = (countryCode) => {
    const currencyMap = {
      'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'FR': 'EUR', 'DE': 'EUR',
      'GB': 'GBP', 'IT': 'EUR', 'ES': 'EUR', 'CH': 'CHF', 'JP': 'JPY',
      'CN': 'CNY', 'AU': 'AUD', 'BR': 'BRL', 'RU': 'RUB', 'IN': 'INR'
    }
    return currencyMap[countryCode] || 'USD'
  }

  // Handle locale editing
  const handleEditLocale = (locale) => {
    console.log('Edit locale:', locale)
    
    // Populate form with existing locale data
    const language = languages.find(lang => lang.code === locale.metadata?.languageCode || 'en')
    const currency = currencies.find(c => c.code === locale.metadata?.currency)
    
    setLocaleForm({
      name: locale.name, // Names are now clean from backend
      code: locale.metadata?.code || '',
      nativeName: locale.metadata?.nativeName || locale.name,
      languageCode: locale.metadata?.languageCode || 'en',
      countryCode: locale.metadata?.countryCode || '',
      countryId: locale.metadata?.countryId || selectedNode?.metadata?.entityId || '',
      currencyId: currency?.id || (currencies.length > 0 ? currencies[0].id : ''),
      isRtl: locale.metadata?.isRtl || false,
      dateFormat: locale.metadata?.dateFormat || 'MM/dd/yyyy',
      numberFormat: locale.metadata?.numberFormat || '{}',
      priority: locale.metadata?.priority || 100,
      // Add edit mode identifier
      editingLocaleId: locale.metadata?.entityId
    })
    
    setShowCreateLocaleModal(true)
  }

  // Handle locale deletion
  const handleDeleteLocale = async (locale, countryNode) => {
    console.log('Delete locale:', locale)
    
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the locale "${locale.name}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    // Check if this is the primary locale
    if (locale.metadata?.isPrimary) {
      alert('Cannot delete the primary locale for this country. Please set another locale as primary first.')
      return
    }
    
    try {
      setCreateLocaleLoading(true)
      
      const localeNodeId = `locale_${locale.metadata.entityId}`
      const response = await fetch(`/api/tree/bulk-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          nodeIds: [localeNodeId]
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Delete result:', result)
        
        // Refresh tree data
        const treeResponse = await fetch('/api/tree')
        if (treeResponse.ok) {
          const data = await treeResponse.json()
          setTreeData(data)
          
          // Update the selected node with fresh data if it's still selected
          if (selectedNode && selectedNode.type === 'country') {
            const updatedCountry = data
              .flatMap(region => region.children || [])
              .find(country => country.id === selectedNode.id)
            if (updatedCountry) {
              setSelectedNode(updatedCountry)
            }
          }
          
          // Maintain current expansion state - don't auto-expand everything
          // Only keep the current country and its parent region expanded if they were selected
          if (selectedNode && selectedNode.type === 'country') {
            const countryId = selectedNode.id
            const parentRegion = data.find(region => 
              region.children?.some(country => country.id === countryId)
            )
            if (parentRegion) {
              setExpandedNodes(prev => new Set([...prev, parentRegion.id, countryId]))
            }
          }
        }
        
      } else {
        const errorData = await response.json()
        alert(`Failed to delete locale: ${errorData.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error deleting locale:', err)
      alert('Failed to delete locale. Please check the console for details.')
    } finally {
      setCreateLocaleLoading(false)
    }
  }

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

  const handleNodeSelect = (node) => {
    setSelectedNode(node)
  }

  const getNodeIcon = (node) => {
    switch (node.type) {
      case 'region':
        return <GlobeAmericasIcon className="h-5 w-5 text-blue-600" />
      case 'country':
        return <FlagIcon className="h-5 w-5 text-green-600" />
      case 'locale':
        return <BuildingLibraryIcon className="h-5 w-5 text-purple-600" />
      default:
        return <MapIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getComplianceIndicator = (node) => {
    // Check live compliance data first if available
    if (node.type === 'country' && node.metadata?.code) {
      const complianceKey = `country_${node.metadata.code}`
      const liveData = complianceData[complianceKey]
      
      if (liveData) {
        if (liveData.hasSanctions) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2" title="Active Sanctions">
              🔴 Sanctions
            </span>
          )
        }
        if (liveData.hasExportRestrictions) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 ml-2" title="Export Restrictions">
              ⚠️ Export
            </span>
          )
        }
        if (liveData.riskLevel === 'High') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2" title="High Compliance Risk">
              🔴 High Risk
            </span>
          )
        }
        if (liveData.riskLevel === 'Medium') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 ml-2" title="Medium Compliance Risk">
              🟡 Medium Risk
            </span>
          )
        }
        if (liveData.riskLevel === 'Low') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ml-2" title="Low Compliance Risk">
              ✅ Low Risk
            </span>
          )
        }
      }
    }

    // Fallback to static metadata if live data not available
    if (node.metadata?.hasSanctions) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2" title="Active Sanctions">
          🔴 Sanctions
        </span>
      )
    }
    if (node.metadata?.hasExportRestrictions) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 ml-2" title="Export Restrictions">
          ⚠️ Export
        </span>
      )
    }
    if (node.metadata?.complianceRisk === 'High') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2" title="High Compliance Risk">
          🔴 High Risk
        </span>
      )
    }
    if (node.metadata?.complianceRisk === 'Medium') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 ml-2" title="Medium Compliance Risk">
          🟡 Medium Risk
        </span>
      )
    }
    if (node.metadata?.complianceRisk === 'Low') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ml-2" title="Low Compliance Risk">
          ✅ Low Risk
        </span>
      )
    }
    return null
  }

  // Render compliance information for countries
  const renderCountryCompliance = (node) => {
    const key = `country_${node.metadata?.code}`
    const loading = complianceLoading[key]
    const data = complianceData[key]

    if (loading) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      )
    }

    if (!data) return null

    const getRiskColor = (risk) => {
      switch (risk?.toLowerCase()) {
        case 'high': return 'bg-red-50 text-red-700 border border-red-200'
        case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-200'
        case 'low': return 'bg-green-50 text-green-700 border border-green-200'
        default: return 'bg-gray-50 text-gray-700 border border-gray-200'
      }
    }

    const getRiskIcon = (risk) => {
      switch (risk?.toLowerCase()) {
        case 'high': return <ExclamationCircleIcon className="h-4 w-4" />
        case 'medium': return <ShieldExclamationIcon className="h-4 w-4" />
        case 'low': return <ShieldCheckIcon className="h-4 w-4" />
        default: return <ShieldCheckIcon className="h-4 w-4" />
      }
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">🛡️ Export Compliance</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(data.riskLevel)}`}>
            {getRiskIcon(data.riskLevel)}
            <span className="ml-1.5">{data.riskLevel} Risk</span>
          </span>
        </div>

        <div className="space-y-6">
          {/* Quick Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{data.totalMatches}</div>
              <div className="text-sm text-gray-600">Screening Matches</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600">Last Screened</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(data.screenedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Alert Indicators */}
          <div className="space-y-3">
            {data.hasSanctions && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">🔴</span>
                  <span className="text-red-800 font-medium">Active Sanctions</span>
                </div>
                <span className="text-red-600 text-sm">Critical Review Required</span>
              </div>
            )}

            {data.hasExportRestrictions && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-2">⚠️</span>
                  <span className="text-orange-800 font-medium">Export Restrictions</span>
                </div>
                <span className="text-orange-600 text-sm">License May Be Required</span>
              </div>
            )}

            {!data.hasSanctions && !data.hasExportRestrictions && data.totalMatches === 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-green-800 font-medium">No Restrictions Detected</span>
                </div>
                <span className="text-green-600 text-sm">Standard Processing</span>
              </div>
            )}
          </div>

          {/* Detailed Match Information */}
          {data.matches && data.matches.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">📋 Screening Details</h4>
              <div className="space-y-3">
                {data.matches.slice(0, 3).map((match, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{match.name}</span>
                      {match.score && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {match.score}% match
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>Source:</strong> {match.source}
                    </div>
                    {match.startDate && (
                      <div className="text-xs text-gray-600">
                        <strong>Effective:</strong> {new Date(match.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {data.matches.length > 3 && (
                  <div className="text-center">
                    <span className="text-sm text-gray-500">
                      + {data.matches.length - 3} more matches
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">💡 Compliance Actions</h4>
              <div className="space-y-2">
                {data.recommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} className="flex items-start p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-gray-400 mr-3 mt-0.5 text-sm">→</span>
                    <span className="text-sm text-gray-700">
                      {rec.replace(/^[🔴⚠️🟡✅📋📝🔍📚🌍]\s*/, '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Source */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Data Source: {data.source}</span>
              <button 
                onClick={() => screenCountryCompliance(node.metadata?.code, node.name)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render regional risk assessment
  const renderRegionalRisk = (node) => {
    const key = `region_${node.metadata?.code}`
    const loading = complianceLoading[key]
    const data = complianceData[key]

    if (loading) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      )
    }

    if (!data) return null

    const getRiskColor = (risk) => {
      switch (risk?.toLowerCase()) {
        case 'high': return 'bg-red-50 text-red-700 border border-red-200'
        case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-200'
        case 'low': return 'bg-green-50 text-green-700 border border-green-200'
        default: return 'bg-gray-50 text-gray-700 border border-gray-200'
      }
    }

    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Regional Risk Assessment</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(data.overallRisk)}`}>
            {data.overallRisk} Risk
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Countries Assessed</span>
            <span className="text-gray-900 font-medium">{data.countriesAssessed}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">High Risk Countries</span>
            <span className="text-red-600 font-medium">{data.highRiskCountries}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Sanctions</span>
            <span className="text-gray-900 font-medium">{data.totalSanctionMatches}</span>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <span className="text-gray-600 text-sm">Assessed on</span>
            <div className="text-gray-900 font-medium">
              {new Date(data.assessedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            </div>
          </div>

          {data.countryDetails && data.countryDetails.length > 0 && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Country Breakdown</h4>
              <div className="space-y-2">
                {data.countryDetails.slice(0, 5).map((country, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 bg-gray-50 p-3 rounded-xl">
                    <span className="text-sm text-gray-700">{country.countryName}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(country.riskLevel)}`}>
                      {country.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedNode?.id === node.id
    
    return (
      <div key={node.id}>
        {/* Node row */}
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors duration-150 ${
            isSelected 
              ? 'bg-blue-50 border-l-4 border-blue-500' 
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleNodeSelect(node)}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="mr-2 p-1 rounded hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          
          {/* Node icon */}
          <div className="mr-3">
            {getNodeIcon(node)}
          </div>
          
          {/* Node name and metadata */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center min-w-0">
              <span className="font-medium text-gray-900 truncate mr-2">
                {node.name}
              </span>
              
              {/* Compliance indicator */}
              {getComplianceIndicator(node)}
              
              {/* Quick compliance screening for countries */}
              {node.type === 'country' && node.metadata?.code && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    screenCountryCompliance(node.metadata.code, node.name)
                  }}
                  className="ml-2 p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600"
                  title="Quick compliance check"
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                </button>
              )}
              
              {/* Status badges */}
              {node.metadata?.status === 'Inactive' && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
              
              {node.metadata?.isPrimary && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⭐ Primary
                </span>
              )}
              
              {node.metadata?.isRtl && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  RTL
                </span>
              )}
            </div>
            
            {/* Item count */}
            {node.metadata?.itemCount !== undefined && (
              <span className="text-sm text-gray-500 ml-2">
                ({node.metadata.itemCount})
              </span>
            )}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NodeDetail = ({ node }) => {
    if (!node) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>Select a region, country, or locale to view details</p>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          
          {/* Metadata */}
          <div className="space-y-6">
            {/* Node Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              {/* Country Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{node.name}</h1>
                  {node.metadata?.nativeName && node.metadata.nativeName !== node.name && (
                    <p className="text-lg text-gray-600 font-medium">{node.metadata.nativeName}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="mr-2">🏷️</span>
                      {node.metadata?.code}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      node.metadata?.status === 'Active' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {node.metadata?.status === 'Active' ? '✅' : '❌'} {node.metadata?.status || 'Active'}
                    </span>
                  </div>
                </div>
                
                {/* Quick Compliance Overview for Countries */}
                {node.type === 'country' && (
                  <div className="text-right">
                    <div className="mb-2">
                      {node.metadata?.complianceRisk && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          node.metadata.complianceRisk === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                          node.metadata.complianceRisk === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          <span className="mr-1">
                            {node.metadata.complianceRisk === 'High' ? '🔴' : 
                             node.metadata.complianceRisk === 'Medium' ? '🟡' : '✅'}
                          </span>
                          {node.metadata.complianceRisk} Risk
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => screenCountryCompliance(node.metadata?.code, node.name)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      🔄 Update Compliance
                    </button>
                  </div>
                )}
              </div>

              {/* Country-specific information */}
              {node.type === 'country' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Geographic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                      🌍 Geographic Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Continent</span>
                        <span className="text-sm font-medium text-gray-900">{node.metadata?.continent || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone Code</span>
                        <span className="text-sm font-mono font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {node.metadata?.phonePrefix || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Service Capabilities */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                      ⚙️ Service Capabilities
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Shipping Operations</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          node.metadata?.supportsShipping ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {node.metadata?.supportsShipping ? '✅ Available' : '❌ Unavailable'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Billing Services</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          node.metadata?.supportsBilling ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {node.metadata?.supportsBilling ? '✅ Available' : '❌ Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-country basic information */}
              {node.type !== 'country' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="text-gray-900 font-medium capitalize">{node.type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Code</span>
                    <span className="text-gray-900 font-mono font-medium">{node.metadata?.code}</span>
                  </div>
                </div>
              )}

              {/* Compliance Alerts for Countries */}
              {node.type === 'country' && (node.metadata?.hasSanctions || node.metadata?.hasExportRestrictions) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    {node.metadata?.hasSanctions && (
                      <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-red-600 mr-3">🚨</span>
                        <span className="text-sm font-medium text-red-900">Active trade sanctions detected</span>
                      </div>
                    )}
                    {node.metadata?.hasExportRestrictions && (
                      <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-orange-600 mr-3">⚠️</span>
                        <span className="text-sm font-medium text-orange-900">Export restrictions may apply</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Locale-specific information */}
              {node.type === 'locale' && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Currency</span>
                    <span className="text-gray-900 font-medium">
                      {node.metadata?.currencySymbol} {node.metadata?.currency}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Text Direction</span>
                    <span className="text-gray-900 font-medium">
                      {node.metadata?.isRtl ? 'Right-to-Left' : 'Left-to-Right'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Date Format</span>
                    <span className="text-gray-900 font-mono font-medium">{node.metadata?.dateFormat}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Priority</span>
                    <span className="text-gray-900 font-medium">{node.metadata?.priority}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Country compliance screening */}
            {node.type === 'country' && node.metadata?.code && (
              <div className="mb-6">
                {renderCountryCompliance(node)}
              </div>
            )}

            {/* Regional risk assessment for regions */}
            {node.type === 'region' && node.metadata?.code && (
              <div className="mb-6">
                {renderRegionalRisk(node)}
              </div>
            )}

            {/* Country Locales Section - Always show for countries */}
            {node.type === 'country' && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Locales ({(node.children && node.children.length) || 0})
                  </h2>
                  <button 
                    onClick={() => {
                      initializeLocaleForCountry(node)
                      setShowCreateLocaleModal(true)
                    }}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Locale
                  </button>
                </div>
                {node.children && node.children.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {node.children.map(locale => (
                      <div key={locale.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-1 min-w-0">
                            <span className="font-medium text-gray-900 mr-2 text-sm truncate">{locale.name}</span>
                            {locale.metadata?.isPrimary && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-1 flex-shrink-0">
                                ⭐
                              </span>
                            )}
                            {locale.metadata?.isRtl && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-1 flex-shrink-0">
                                RTL
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditLocale(locale)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit locale"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocale(locale, node)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete locale"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono mb-2">{locale.metadata?.code}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Currency: {locale.metadata?.currencySymbol} {locale.metadata?.currency}</div>
                          <div>Date: <span className="font-mono">{locale.metadata?.dateFormat}</span></div>
                          <div>Priority: {locale.metadata?.priority}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BuildingLibraryIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm">No locales configured for this country</p>
                    <p className="text-xs">Click "Add Locale" to create the first locale</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Create Locale Modal Component
  const CreateLocaleModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setShowCreateLocaleModal(false)
                resetLocaleForm()
              }}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <LanguageIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {localeForm.editingLocaleId ? 'Edit' : 'Create New'} Locale for {countries.find(c => c.id === localeForm.countryId)?.name || 'Country'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {localeForm.editingLocaleId 
                  ? 'Update locale settings and language-specific formatting' 
                  : 'Add a new locale with language-specific formatting and culture settings'
                }
              </p>
            </div>
          </div>
          
          <form className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Locale Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Locale Name
                </label>
                <input
                  key={`locale-name-input-${localeForm.editingLocaleId || 'create'}`}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  placeholder="Auto-generated based on language and country"
                  value={localeForm.name}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated based on language selection and country</p>
              </div>
              
              {/* Native Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Native Name
                </label>
                <input
                  key={`locale-native-name-input-${localeForm.editingLocaleId || 'create'}`}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  placeholder="Auto-generated based on language and country"
                  value={localeForm.nativeName}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated based on language selection and country</p>
              </div>
              
              {/* Locale Code (auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Locale Code
                </label>
                <input
                  key={`locale-code-input-${localeForm.editingLocaleId || 'create'}`}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  value={localeForm.code}
                  readOnly
                  placeholder="Auto-generated (e.g., en_CA)"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated based on language and country</p>
              </div>
              
              {/* Country (read-only, pre-selected) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  value={countries.find(c => c.id === localeForm.countryId)?.name || 'Loading...'}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Country is pre-selected based on your selection</p>
              </div>
              
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Language *
                </label>
                <select
                  key={`language-select-${localeForm.editingLocaleId || 'create'}`}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={localeForm.languageCode}
                  onChange={(e) => {
                    const newLanguageCode = e.target.value
                    if (localeForm.editingLocaleId) {
                      // In edit mode, only update technical fields, don't auto-populate names
                      const language = languages.find(lang => lang.code === newLanguageCode)
                      if (language) {
                        const country = countries.find(c => c.id === localeForm.countryId)
                        const newLocaleCode = country ? `${newLanguageCode.toLowerCase()}_${country.code.toUpperCase()}` : newLanguageCode
                        
                        setLocaleForm(prev => ({
                          ...prev,
                          languageCode: newLanguageCode,
                          code: newLocaleCode,
                          isRtl: language.isRtl,
                          dateFormat: language.dateFormat
                        }))
                      } else {
                        setLocaleForm(prev => ({ ...prev, languageCode: newLanguageCode }))
                      }
                    } else {
                      // In create mode, use full auto-population
                      handleLanguageChange(newLanguageCode)
                    }
                  }}
                >
                  <option value="">Select a language...</option>
                  {languages.map(language => (
                    <option key={language.code} value={language.code}>
                      {language.name} ({language.nativeName}) - {language.code}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Currency *
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={localeForm.currencyId}
                  onChange={(e) => setLocaleForm(prev => ({ ...prev, currencyId: e.target.value }))}
                >
                  <option value="">Select a currency...</option>
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date Format
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={localeForm.dateFormat}
                  onChange={(e) => setLocaleForm(prev => ({ ...prev, dateFormat: e.target.value }))}
                >
                  <option value="MM/dd/yyyy">MM/dd/yyyy (US format)</option>
                  <option value="dd/MM/yyyy">dd/MM/yyyy (EU format)</option>
                  <option value="yyyy-MM-dd">yyyy-MM-dd (ISO format)</option>
                  <option value="dd.MM.yyyy">dd.MM.yyyy (German format)</option>
                </select>
              </div>
              
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority in Country
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={localeForm.priority}
                  onChange={(e) => setLocaleForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers have higher priority (1 = primary locale)</p>
              </div>
            </div>
            
            {/* RTL Checkbox */}
            <div className="flex items-center">
              <input
                id="rtl-checkbox"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={localeForm.isRtl}
                onChange={(e) => setLocaleForm(prev => ({ ...prev, isRtl: e.target.checked }))}
              />
              <label htmlFor="rtl-checkbox" className="ml-2 block text-sm text-gray-900">
                Right-to-Left (RTL) language
              </label>
            </div>
          </form>
          
          <div className="mt-6 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreateLocale}
              disabled={createLocaleLoading || !localeForm.languageCode || !localeForm.countryId || !localeForm.currencyId}
            >
              {createLocaleLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {localeForm.editingLocaleId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {localeForm.editingLocaleId ? (
                    <PencilIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-2" />
                  )}
                  {localeForm.editingLocaleId ? 'Update Locale' : 'Create Locale'}
                </>
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => {
                setShowCreateLocaleModal(false)
                resetLocaleForm()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Data</h2>
          <p className="text-gray-600 mt-2">Failed to load hierarchical data: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapIcon className="h-8 w-8 text-blue-600 mr-3" />
            Regional Hierarchy Management
          </h1>
          <p className="text-gray-600 mt-2">
            View regions, countries, and manage locales with compliance integration
          </p>
        </div>
      </div>
      
      {/* Two-column layout - flex to fill remaining height */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 min-h-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Tree view */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Region / Country / Locale</h3>
              <p className="text-sm text-gray-600">
                {treeData.length} regions • Click to view details
              </p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              {treeData.map(node => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          </div>
          
          {/* Detail view */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col min-h-0">
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Node Details</h3>
              <p className="text-sm text-gray-600">
                {selectedNode ? `${selectedNode.type} information` : 'Select a node to view details'}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <NodeDetail node={selectedNode} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Locale Modal */}
      {showCreateLocaleModal && <CreateLocaleModal />}
    </div>
  )
}

export default RegionsPage