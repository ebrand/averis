import { useState, useEffect } from 'react'

// In-memory cache for data dictionary
let dataDictionaryCache = null
let cacheTimestamp = null
let isCurrentlyFetching = false
let pendingRequests = []
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Fallback data dictionary for essential fields (prevents UI failure)
const FALLBACK_DATA_DICTIONARY = [
  {
    id: 'sku',
    columnName: 'sku',
    displayName: 'SKU Code',
    dataType: 'varchar',
    requiredForActive: true,
    maintenanceRole: 'product_marketing',
    description: 'Stock Keeping Unit identifier',
    maxLength: 50,
    isSystemField: false,
    isEditable: true,
    sortOrder: 1
  },
  {
    id: 'name',
    columnName: 'name',
    displayName: 'Product Name',
    dataType: 'varchar',
    requiredForActive: true,
    maintenanceRole: 'product_marketing',
    description: 'Product display name',
    maxLength: 255,
    isSystemField: false,
    isEditable: true,
    sortOrder: 2
  },
  {
    id: 'description',
    columnName: 'description',
    displayName: 'Description',
    dataType: 'text',
    requiredForActive: true,
    maintenanceRole: 'product_marketing',
    description: 'Product description',
    isSystemField: false,
    isEditable: true,
    sortOrder: 3
  },
  {
    id: 'status',
    columnName: 'status',
    displayName: 'Status',
    dataType: 'varchar',
    requiredForActive: true,
    maintenanceRole: 'product_marketing',
    description: 'Product lifecycle status',
    allowedValues: ['draft', 'active', 'deprecated', 'archived'],
    isSystemField: false,
    isEditable: true,
    sortOrder: 4
  },
  {
    id: 'type',
    columnName: 'type',
    displayName: 'Product Type',
    dataType: 'varchar',
    requiredForActive: false,
    maintenanceRole: 'product_marketing',
    description: 'Product classification type',
    isSystemField: false,
    isEditable: true,
    sortOrder: 5
  },
  {
    id: 'basePrice',
    columnName: 'base_price',
    displayName: 'Base Price',
    dataType: 'decimal',
    requiredForActive: false,
    maintenanceRole: 'product_finance',
    description: 'Base selling price',
    isSystemField: false,
    isEditable: true,
    sortOrder: 6
  },
  {
    id: 'costPrice',
    columnName: 'cost_price',
    displayName: 'Cost Price',
    dataType: 'decimal',
    requiredForActive: false,
    maintenanceRole: 'product_finance',
    description: 'Cost basis price',
    isSystemField: false,
    isEditable: true,
    sortOrder: 7
  }
]

/**
 * Enhanced Custom hook to fetch and organize data dictionary fields for form rendering
 * Features:
 * - In-memory caching (5 minutes)
 * - Fallback data dictionary prevents UI failure
 * - Graceful degradation when API unavailable
 * - Groups fields by maintenance role and provides field metadata
 */
export const useDataDictionaryFields = () => {
  const [fieldsByRole, setFieldsByRole] = useState({})
  const [fieldsById, setFieldsById] = useState({})
  const [fieldsByColumnName, setFieldsByColumnName] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  // Helper function to transform and process data dictionary
  const processDataDictionary = (rawFields) => {
    // Transform API data to match our needs
    const transformedFields = rawFields.map(field => ({
      id: field.id,
      columnName: field.columnName,
      displayName: field.displayName,
      dataType: field.dataType,
      required: field.requiredForActive,
      maintenanceRole: field.maintenanceRole,
      description: field.description,
      maxLength: field.maxLength,
      minLength: field.minLength,
      validationPattern: field.validationPattern,
      allowedValues: field.allowedValues,
      sortOrder: field.sortOrder,
      isSystemField: field.isSystemField,
      isEditable: field.isEditable
    }))

    // Group fields by maintenance role
    const groupedByRole = transformedFields.reduce((acc, field) => {
      const role = field.maintenanceRole
      if (!acc[role]) {
        acc[role] = []
      }
      acc[role].push(field)
      return acc
    }, {})

    // Sort fields within each role by sortOrder
    Object.keys(groupedByRole).forEach(role => {
      groupedByRole[role].sort((a, b) => a.sortOrder - b.sortOrder)
    })

    // Create lookup maps
    const byId = transformedFields.reduce((acc, field) => {
      acc[field.id] = field
      return acc
    }, {})

    const byColumnName = transformedFields.reduce((acc, field) => {
      acc[field.columnName] = field
      return acc
    }, {})

    return { groupedByRole, byId, byColumnName, transformedFields }
  }

  useEffect(() => {
    const fetchDataDictionary = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsUsingFallback(false)

        // Check cache first
        const now = Date.now()
        if (dataDictionaryCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
          console.log('📊 Using cached data dictionary')
          const processed = processDataDictionary(dataDictionaryCache)
          setFieldsByRole(processed.groupedByRole)
          setFieldsById(processed.byId)
          setFieldsByColumnName(processed.byColumnName)
          setLoading(false)
          return
        }

        // If already fetching, wait for the existing request
        if (isCurrentlyFetching) {
          console.log('🔄 Joining existing data dictionary request')
          return new Promise((resolve, reject) => {
            pendingRequests.push({ resolve, reject, setFieldsByRole, setFieldsById, setFieldsByColumnName, setIsUsingFallback, setError, setLoading })
          })
        }

        // Mark as currently fetching to prevent duplicate requests
        isCurrentlyFetching = true
        console.log('🔄 Fetching fresh data dictionary from API')
        
        const response = await fetch('/api/data-dictionary')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.data_dictionary || !Array.isArray(data.data_dictionary)) {
          throw new Error('Invalid data dictionary format received from API')
        }

        // Cache the successful response
        dataDictionaryCache = data.data_dictionary
        cacheTimestamp = now
        
        const processed = processDataDictionary(data.data_dictionary)
        
        // Update current component
        setFieldsByRole(processed.groupedByRole)
        setFieldsById(processed.byId)
        setFieldsByColumnName(processed.byColumnName)
        
        // Update all pending requests
        pendingRequests.forEach(req => {
          req.setFieldsByRole(processed.groupedByRole)
          req.setFieldsById(processed.byId)  
          req.setFieldsByColumnName(processed.byColumnName)
          req.setLoading(false)
          req.resolve()
        })
        pendingRequests = []
        
        console.log('✅ Data dictionary loaded from API and cached')

      } catch (err) {
        console.warn('⚠️ Data dictionary API failed, using fallback:', err.message)
        
        // Use fallback data dictionary
        setIsUsingFallback(true)
        const processed = processDataDictionary(FALLBACK_DATA_DICTIONARY)
        
        // Update current component
        setFieldsByRole(processed.groupedByRole)
        setFieldsById(processed.byId)
        setFieldsByColumnName(processed.byColumnName)
        
        // Update all pending requests
        pendingRequests.forEach(req => {
          req.setFieldsByRole(processed.groupedByRole)
          req.setFieldsById(processed.byId)
          req.setFieldsByColumnName(processed.byColumnName)
          req.setIsUsingFallback(true)
          req.setError(`Data dictionary service unavailable (using essential fields only): ${err.message}`)
          req.setLoading(false)
          req.resolve()
        })
        pendingRequests = []
        
        // Set a warning rather than error to allow UI to continue
        setError(`Data dictionary service unavailable (using essential fields only): ${err.message}`)
        
        console.log('📝 Using fallback data dictionary with essential fields')
      } finally {
        setLoading(false)
        isCurrentlyFetching = false
      }
    }

    fetchDataDictionary()
  }, [])

  // Helper function to get field metadata by column name with graceful fallback
  const getFieldMetadata = (columnName) => {
    const field = fieldsByColumnName[columnName]
    if (field) {
      return field
    }
    
    // Graceful fallback - return basic metadata for unknown fields
    return {
      columnName,
      displayName: columnName.charAt(0).toUpperCase() + columnName.slice(1).replace(/([A-Z])/g, ' $1'),
      dataType: 'varchar',
      required: false,
      maintenanceRole: 'product_marketing',
      description: `Field: ${columnName}`,
      isSystemField: false,
      isEditable: true,
      sortOrder: 999
    }
  }

  // Helper function to determine field type based on dataType
  const getInputType = (dataType, allowedValues) => {
    if (allowedValues && allowedValues.length > 0) {
      return 'select'
    }
    
    switch (dataType?.toLowerCase()) {
      case 'boolean':
        return 'checkbox'
      case 'integer':
      case 'bigint':
        return 'number'
      case 'decimal':
      case 'numeric':
        return 'currency'
      case 'text':
        return 'textarea'
      case 'uuid':
      case 'varchar':
      case 'string':
      default:
        return 'text'
    }
  }

  // Helper function to get validation rules
  const getValidationRules = (field) => {
    const rules = {}
    
    if (field.required) {
      rules.required = true
    }
    
    if (field.maxLength) {
      rules.maxLength = field.maxLength
    }
    
    if (field.minLength) {
      rules.minLength = field.minLength
    }
    
    if (field.validationPattern) {
      rules.pattern = field.validationPattern
    }
    
    return rules
  }

  // Clear cache function (useful for testing or forcing refresh)
  const clearCache = () => {
    dataDictionaryCache = null
    cacheTimestamp = null
    isCurrentlyFetching = false
    pendingRequests = []
    console.log('🗑️ Data dictionary cache cleared')
  }

  return {
    fieldsByRole,
    fieldsById,
    fieldsByColumnName,
    loading,
    error,
    isUsingFallback,
    getFieldMetadata,
    getInputType,
    getValidationRules,
    clearCache
  }
}