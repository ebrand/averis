/**
 * Simplified Product Form - Only includes the 24 essential fields
 * Organized by the simplified data dictionary categories
 */
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  CubeIcon,
  TagIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UsersIcon,
  EyeIcon,
  DocumentTextIcon,
  CogIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const SimplifiedProductForm = ({ 
  formData, 
  setFormData, 
  errors = {}, 
  isEditing = false,
  onSubmit,
  loading = false
}) => {
  const { userProfile } = useAuth()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field, value) => {
    // Handle categorization array input (comma-separated)
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

  // Form sections based on the 24 essential fields
  const formSections = [
    {
      id: 'core',
      title: 'Core Product Information',
      icon: CubeIcon,
      description: 'Essential product details',
      fields: [
        {
          key: 'sku',
          label: 'SKU Code',
          type: 'text',
          required: true,
          placeholder: 'e.g., PROD-001',
          description: 'Unique product identifier'
        },
        {
          key: 'name',
          label: 'Product Name',
          type: 'text',
          required: true,
          placeholder: 'Enter product name',
          description: 'Primary product name'
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          placeholder: 'Detailed product description...',
          description: 'Comprehensive product description'
        }
      ]
    },
    {
      id: 'classification',
      title: 'Product Classification',
      icon: TagIcon,
      description: 'Product categorization and type',
      fields: [
        {
          key: 'type',
          label: 'Product Type',
          type: 'select',
          options: [
            { value: '', label: 'Select type...' },
            { value: 'Software', label: 'Software' },
            { value: 'Hardware', label: 'Hardware' },
            { value: 'Cloud Service', label: 'Cloud Service' },
            { value: 'Professional Services', label: 'Professional Services' },
            { value: 'Training', label: 'Training' },
            { value: 'Mobile App', label: 'Mobile App' },
            { value: 'Platform', label: 'Platform' }
          ],
          description: 'Primary product classification'
        },
        {
          key: 'categorization',
          label: 'Categories',
          type: 'text',
          placeholder: 'e.g., Software, Enterprise, Security',
          description: 'Comma-separated categories',
          isArray: true
        }
      ]
    },
    {
      id: 'pricing',
      title: 'Pricing & Financial',
      icon: CurrencyDollarIcon,
      description: 'Price and cost information',
      fields: [
        {
          key: 'basePrice',
          label: 'Base Price',
          type: 'number',
          placeholder: '0.00',
          step: '0.01',
          min: '0',
          description: 'Base product price'
        },
        {
          key: 'costPrice',
          label: 'Cost Price',
          type: 'number',
          placeholder: '0.00',
          step: '0.01',
          min: '0',
          description: 'Internal cost basis'
        }
      ]
    },
    {
      id: 'features',
      title: 'Product Features',
      icon: ShieldCheckIcon,
      description: 'Product capabilities and flags',
      fields: [
        {
          key: 'licenseRequiredFlag',
          label: 'License Required',
          type: 'checkbox',
          description: 'Product requires licensing'
        },
        {
          key: 'seatBasedPricingFlag',
          label: 'Seat-Based Pricing',
          type: 'checkbox',
          description: 'Uses per-seat pricing model'
        },
        {
          key: 'webDisplayFlag',
          label: 'Web Display',
          type: 'checkbox',
          description: 'Show on website'
        },
        {
          key: 'canBeFulfilledFlag',
          label: 'Can Be Fulfilled',
          type: 'checkbox',
          description: 'Product can be delivered/fulfilled'
        },
        {
          key: 'contractItemFlag',
          label: 'Contract Item',
          type: 'checkbox',
          description: 'Requires contract management'
        }
      ]
    },
    {
      id: 'metadata',
      title: 'Additional Information',
      icon: DocumentTextIcon,
      description: 'Tax, commerce, and metadata',
      fields: [
        {
          key: 'avaTaxCode',
          label: 'Avalara Tax Code',
          type: 'text',
          placeholder: 'e.g., SW001',
          description: 'Tax classification code'
        },
        {
          key: 'slug',
          label: 'URL Slug',
          type: 'text',
          placeholder: 'product-url-slug',
          description: 'SEO-friendly URL identifier'
        },
        {
          key: 'longDescription',
          label: 'Long Description',
          type: 'textarea',
          placeholder: 'Detailed description for e-commerce...',
          description: 'Extended product description'
        }
      ]
    },
    {
      id: 'system',
      title: 'System Settings',
      icon: CogIcon,
      description: 'Status and system configuration',
      fields: [
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'deprecated', label: 'Deprecated' },
            { value: 'archived', label: 'Archived' }
          ],
          description: 'Product lifecycle status'
        },
        {
          key: 'availableFlag',
          label: 'Available',
          type: 'checkbox',
          description: 'Product is available for use',
          defaultValue: true
        }
      ]
    }
  ]

  const renderField = (field, sectionId) => {
    const fieldId = `${sectionId}-${field.key}`
    const hasError = errors[field.key]
    
    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={fieldId}
              rows={3}
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={fieldId}
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {field.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-start space-x-3">
              <input
                id={fieldId}
                type="checkbox"
                checked={getBooleanValue(formData[field.key] || field.defaultValue)}
                onChange={(e) => handleInputChange(field.key, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.description}</p>
                )}
              </div>
            </div>
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={fieldId}
              type="number"
              step={field.step}
              min={field.min}
              max={field.max}
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
            )}
          </div>
        )

      default: // text input
        return (
          <div key={field.key} className="space-y-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={fieldId}
              type="text"
              value={field.isArray ? formatArrayForInput(formData[field.key]) : (formData[field.key] || '')}
              onChange={(e) => field.isArray ? handleArrayChange(field.key, e.target.value) : handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{hasError}</p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-8">
        {formSections.map((section) => (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center space-x-3">
                <section.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map(field => renderField(field, section.id))}
              </div>
            </div>
          </div>
        ))}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SimplifiedProductForm