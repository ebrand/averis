import { useState, useEffect } from 'react'

/**
 * Custom hook to fetch and organize data dictionary fields for form rendering
 * Groups fields by maintenance role and provides field metadata
 */
export const useDataDictionaryFields = () => {
  const [fieldsByRole, setFieldsByRole] = useState({})
  const [fieldsById, setFieldsById] = useState({})
  const [fieldsByColumnName, setFieldsByColumnName] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDataDictionary = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/data-dictionary')
        if (!response.ok) {
          throw new Error('Failed to fetch data dictionary')
        }

        const data = await response.json()
        
        // Transform API data to match our needs
        const transformedFields = data.data_dictionary.map(field => ({
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

        setFieldsByRole(groupedByRole)
        setFieldsById(byId)
        setFieldsByColumnName(byColumnName)

      } catch (err) {
        console.error('Error fetching data dictionary:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDataDictionary()
  }, [])

  // Helper function to get field metadata by column name
  const getFieldMetadata = (columnName) => {
    return fieldsByColumnName[columnName] || null
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

  return {
    fieldsByRole,
    fieldsById,
    fieldsByColumnName,
    loading,
    error,
    getFieldMetadata,
    getInputType,
    getValidationRules
  }
}