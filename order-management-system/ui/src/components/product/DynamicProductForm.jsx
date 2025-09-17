/**
 * Dynamic Product Form Component
 * Uses data dictionary to dynamically render form fields with proper labels and validation
 */
import React, { useState } from 'react'
import { useDataDictionaryFields } from '../../hooks/useDataDictionaryFields'
import {
  UsersIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

const DynamicProductForm = ({ formData, setFormData, errors = {}, readOnly = false }) => {
  const { 
    fieldsByRole, 
    loading: fieldsLoading, 
    error: fieldsError, 
    isUsingFallback,
    getInputType, 
    getValidationRules 
  } = useDataDictionaryFields()

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    marketing: true,
    finance: false,
    legal: false,
    salesops: false,
    contracts: false,
    system: false
  })
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Helper function to convert snake_case to camelCase for field lookups
  const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
  }

  const handleInputChange = (field, value) => {
    // Use the original field name (might be snake_case from data dictionary)
    // but also set camelCase version for API compatibility
    const camelCaseField = toCamelCase(field)
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Also set camelCase version if different
      ...(field !== camelCaseField ? { [camelCaseField]: value } : {})
    }))
  }

  const handleArrayChange = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, [field]: arrayValue }))
  }

  const getBooleanValue = (value) => {
    if (typeof value === 'boolean') return value
    return value === 'true' || value === true
  }

  const formatArrayForInput = (array) => {
    return Array.isArray(array) ? array.join(', ') : ''
  }

  // Section configuration
  const sectionConfig = {
    'product_marketing': {
      id: 'marketing',
      title: 'Marketing',
      icon: UsersIcon,
      description: 'Product information, branding, and market positioning',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    },
    'product_finance': {
      id: 'finance',
      title: 'Finance',
      icon: CurrencyDollarIcon,
      description: 'Pricing, costs, and financial modeling',
      color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    },
    'product_legal': {
      id: 'legal',
      title: 'Legal',
      icon: ShieldCheckIcon,
      description: 'Legal requirements, licensing, and compliance',
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
    },
    'product_salesops': {
      id: 'salesops',
      title: 'SalesOps',
      icon: EyeIcon,
      description: 'Sales enablement and operational configuration',
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
    },
    'product_contracts': {
      id: 'contracts',
      title: 'Contracts',
      icon: DocumentTextIcon,
      description: 'Contract management and terms',
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
    },
    'system': {
      id: 'system',
      title: 'System',
      icon: CogIcon,
      description: 'System configuration and status management',
      color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
    }
  }

  const renderField = (field) => {
    const fieldId = `field-${field.columnName}`
    const hasError = errors[field.columnName]
    const fieldType = getInputType(field.dataType, field.allowedValues)
    const validationRules = getValidationRules(field)
    
    // Try both snake_case and camelCase field names for lookups
    const snakeCaseKey = field.columnName
    const camelCaseKey = toCamelCase(field.columnName)
    const value = formData[snakeCaseKey] !== undefined ? formData[snakeCaseKey] : 
                  formData[camelCaseKey] !== undefined ? formData[camelCaseKey] : ''
    
    const hasValue = typeof value === 'boolean' ? true : (value !== null && value !== undefined && value !== '')
    
    const baseInputClasses = `block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
      hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : field.required && !hasValue
          ? 'border-amber-300 dark:border-amber-600 focus:border-blue-500 focus:ring-blue-500'
          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
    } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`

    const fieldWrapper = (content) => (
      <div key={field.columnName} className="space-y-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.displayName}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {content}
        {field.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
        )}
        {field.required && !hasValue && !hasError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">This field is required</p>
        )}
        {hasError && (
          <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
        )}
      </div>
    )

    switch (fieldType) {
      case 'textarea':
        return fieldWrapper(
          <textarea
            id={fieldId}
            rows={3}
            value={value}
            onChange={(e) => handleInputChange(field.columnName, e.target.value)}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            disabled={readOnly || !field.isEditable}
            className={baseInputClasses}
          />
        )

      case 'select':
        const options = field.allowedValues || []
        return fieldWrapper(
          <select
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(field.columnName, e.target.value)}
            disabled={readOnly || !field.isEditable}
            className={baseInputClasses}
          >
            <option value="">Select {field.displayName}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'checkbox':
        return fieldWrapper(
          <div className="flex items-start space-x-3">
            <input
              id={fieldId}
              type="checkbox"
              checked={getBooleanValue(value)}
              onChange={(e) => handleInputChange(field.columnName, e.target.checked)}
              disabled={readOnly || !field.isEditable}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {getBooleanValue(value) ? 'Yes' : 'No'}
            </span>
          </div>
        )

      case 'number':
      case 'currency':
        return fieldWrapper(
          <input
            id={fieldId}
            type="number"
            step={fieldType === 'currency' ? '0.01' : '1'}
            value={value}
            onChange={(e) => handleInputChange(field.columnName, fieldType === 'currency' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            disabled={readOnly || !field.isEditable}
            className={baseInputClasses}
          />
        )

      default: // text input
        // Special handling for system fields that are read-only
        if (field.maintenanceRole === 'system' && ['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(field.columnName)) {
          // Format the display value based on field type
          let displayValue = 'Not set'
          
          if (value) {
            // Handle timestamp fields
            if (field.columnName === 'created_at' || field.columnName === 'updated_at') {
              try {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                  displayValue = date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              } catch (e) {
                displayValue = 'Invalid date'
              }
            }
            // Handle user fields (JSON strings)
            else if (field.columnName === 'created_by' || field.columnName === 'updated_by') {
              try {
                if (typeof value === 'string' && value.startsWith('{')) {
                  const userObj = JSON.parse(value)
                  if (userObj.first_name && userObj.last_name) {
                    displayValue = `${userObj.first_name} ${userObj.last_name}`
                  } else if (userObj.name) {
                    displayValue = userObj.name
                  } else {
                    displayValue = value // fallback to original string
                  }
                } else {
                  displayValue = value
                }
              } catch (e) {
                displayValue = value // fallback to original value if JSON parse fails
              }
            }
            // Handle other system fields (like id)
            else {
              displayValue = value
            }
          }
          
          return fieldWrapper(
            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-md border">
              {displayValue}
            </div>
          )
        }
        
        return fieldWrapper(
          <input
            id={fieldId}
            type="text"
            value={field.columnName === 'categorization' ? formatArrayForInput(value) : value}
            onChange={(e) => {
              if (field.columnName === 'categorization') {
                handleArrayChange(field.columnName, e.target.value)
              } else {
                handleInputChange(field.columnName, e.target.value)
              }
            }}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            disabled={readOnly || !field.isEditable}
            className={baseInputClasses}
            maxLength={field.maxLength}
            minLength={field.minLength}
            pattern={field.validationPattern}
          />
        )
    }
  }

  if (fieldsLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading form fields...</p>
      </div>
    )
  }

  // Only show error if NOT using fallback (complete failure)
  if (fieldsError && !isUsingFallback) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error loading form fields: {fieldsError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Data Dictionary Fallback Warning */}
      {isUsingFallback && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ChevronUpIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                Using Essential Fields Only
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                Data dictionary service is temporarily unavailable. Some field labels may appear generic, but all functionality is preserved.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {Object.entries(sectionConfig).map(([roleKey, config]) => {
        const fields = fieldsByRole[roleKey] || []
        if (fields.length === 0) return null
        
        const isExpanded = expandedSections[config.id]
        const Icon = config.icon
        
        return (
          <div key={config.id} className={`border rounded-lg ${config.color}`}>
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection(config.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {config.title} ({fields.length})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {/* Section Content */}
            {isExpanded && (
              <div className="px-6 py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map(renderField)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DynamicProductForm