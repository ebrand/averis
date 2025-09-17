/**
 * Simplified Product Form with Approval Workflow
 * Includes role-based "Go for Launch" approval buttons for each section
 */
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../contexts/RoleContext'
import DynamicProductForm from './DynamicProductForm'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const SimplifiedProductFormWithApprovals = ({ 
  formData, 
  setFormData, 
  errors = {}, 
  isEditing = false,
  onSubmit,
  loading = false,
  productId = null,
  navigate = null // Optional navigate function from parent
}) => {
  const { userProfile } = useAuth()
  const { currentRole, canApproveTab, canLaunchProducts } = useRole()
  
  // Launch loading state
  const [isLaunching, setIsLaunching] = useState(false)
  
  // Approval state management - now using actual database approval fields
  const [approvals, setApprovals] = useState({
    marketing: { approved: false, approvedBy: null, approvedAt: null },
    finance: { approved: false, approvedBy: null, approvedAt: null },
    legal: { approved: false, approvedBy: null, approvedAt: null },
    salesops: { approved: false, approvedBy: null, approvedAt: null },
    contracts: { approved: false, approvedBy: null, approvedAt: null }
  })
  
  // Load approval state from actual product data (database fields)
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      const updatedApprovals = {
        marketing: { 
          approved: Boolean(formData.marketing_approved), 
          approvedBy: formData.marketing_approved_by || null, 
          approvedAt: formData.marketing_approved_at || null 
        },
        finance: { 
          approved: Boolean(formData.finance_approved), 
          approvedBy: formData.finance_approved_by || null, 
          approvedAt: formData.finance_approved_at || null 
        },
        legal: { 
          approved: Boolean(formData.legal_approved), 
          approvedBy: formData.legal_approved_by || null, 
          approvedAt: formData.legal_approved_at || null 
        },
        salesops: { 
          approved: Boolean(formData.salesops_approved), 
          approvedBy: formData.salesops_approved_by || null, 
          approvedAt: formData.salesops_approved_at || null 
        },
        contracts: { 
          approved: Boolean(formData.contracts_approved), 
          approvedBy: formData.contracts_approved_by || null, 
          approvedAt: formData.contracts_approved_at || null 
        }
      }
      setApprovals(updatedApprovals)
    }
  }, [formData])
  
  // Save approval state to actual database fields
  const saveApprovals = (newApprovals) => {
    setApprovals(newApprovals)
    
    // Update form data with actual database approval fields
    const approvalFieldUpdates = {}
    
    // Map approval state to database field names
    Object.entries(newApprovals).forEach(([section, approval]) => {
      const sectionPrefix = section === 'salesops' ? 'salesops' : section
      approvalFieldUpdates[`${sectionPrefix}Approved`] = approval.approved
      approvalFieldUpdates[`${sectionPrefix}ApprovedBy`] = approval.approvedBy
      approvalFieldUpdates[`${sectionPrefix}ApprovedAt`] = approval.approvedAt
    })
    
    // Update form data with database fields
    setFormData(prev => ({ 
      ...prev, 
      ...approvalFieldUpdates,
      // Also keep the legacy approvals array for any components that still use it
      approvals: Object.entries(newApprovals).map(([key, value]) => ({ section: key, ...value }))
    }))
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
  
  // Handle section approval
  const handleApproval = async (sectionKey, approved) => {
    const newApprovals = {
      ...approvals,
      [sectionKey]: {
        approved,
        approvedBy: approved ? (userProfile?.id || userProfile?.email || 'Current User') : null,
        approvedAt: approved ? new Date().toISOString() : null
      }
    }
    saveApprovals(newApprovals)
    
    // Immediately save the approval to the database if we're editing an existing product
    if (isEditing && productId) {
      try {
        const { updateProduct } = await import('../../services/productDataService')
        const approvalUpdate = {}
        
        // Map to database field names (snake_case)
        const sectionPrefix = sectionKey === 'salesops' ? 'salesops' : sectionKey
        approvalUpdate[`${sectionPrefix}_approved`] = approved
        approvalUpdate[`${sectionPrefix}_approved_by`] = approved ? (userProfile?.id || userProfile?.email || 'Current User') : null
        approvalUpdate[`${sectionPrefix}_approved_at`] = approved ? new Date().toISOString() : null
        
        console.log(`Saving ${sectionKey} approval to database:`, approvalUpdate)
        const result = await updateProduct(productId, approvalUpdate)
        
        if (result.error) {
          console.error('Failed to save approval:', result.error)
          // Revert the approval state change on error
          setApprovals(prev => ({ ...prev, [sectionKey]: approvals[sectionKey] }))
          alert('Failed to save approval: ' + result.error)
        } else {
          console.log(`✅ ${sectionKey} approval saved successfully`)
        }
      } catch (error) {
        console.error('Error saving approval:', error)
        // Revert the approval state change on error
        setApprovals(prev => ({ ...prev, [sectionKey]: approvals[sectionKey] }))
        alert('Error saving approval: ' + error.message)
      }
    }
  }
  
  // Check if user can approve a specific section
  const canApproveSection = (sectionKey) => {
    const roleMapping = {
      marketing: 'marketing',
      finance: 'finance',
      legal: 'legal',
      salesops: 'sales',
      contracts: 'contracts'
    }
    return canApproveTab(roleMapping[sectionKey])
  }
  
  // Check if all sections are approved for launch
  const canLaunch = () => {
    return Object.values(approvals).every(approval => approval.approved)
  }
  
  // Handle product launch (set status to active and save)
  const handleLaunch = async () => {
    if (!canLaunch() || !canLaunchProducts()) {
      console.warn('Cannot launch product: not all sections approved or user lacks permission')
      return
    }

    setIsLaunching(true)

    try {
      // Create launch data with active status and launch metadata
      const launchData = { 
        ...formData, 
        status: 'active',
        launchedBy: userProfile?.id || userProfile?.email || 'Current User',
        launchedAt: new Date().toISOString()
      }
      
      console.log('Launching product with data:', launchData)
      
      if (isEditing && productId) {
        // Directly update the product via API
        const { updateProduct } = await import('../../services/productDataService')
        const result = await updateProduct(productId, launchData)
        
        if (result.error) {
          console.error('Failed to launch product:', result.error)
          alert('Failed to launch product: ' + result.error)
          setIsLaunching(false)
          return
        }
        
        console.log('✅ Product successfully launched:', result)
        
        // Update local state to reflect the change
        setFormData(launchData)
        
        // Navigate back to product list
        if (navigate && typeof navigate === 'function') {
          navigate('/products')
        } else if (typeof window !== 'undefined') {
          window.location.href = '/products'
        }
        
      } else {
        // For new products, update form data and trigger save
        setFormData(launchData)
        if (onSubmit) {
          const syntheticEvent = { preventDefault: () => {} }
          await onSubmit(syntheticEvent)
        }
        setIsLaunching(false)
      }
    } catch (error) {
      console.error('Error launching product:', error)
      alert('Error launching product: ' + error.message)
      setIsLaunching(false)
    }
  }

  // Note: Form sections are now dynamically rendered via DynamicProductForm component
  // Legacy formSections array has been removed in favor of data dictionary-driven approach

  const renderApprovalButton = (section) => {
    if (!section.approvalSection || !isEditing) return null
    
    const sectionApproval = approvals[section.approvalSection]
    const canApprove = canApproveSection(section.approvalSection)
    
    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        {sectionApproval.approved ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Go for Launch Approved</span>
              <span className="text-xs text-gray-500">
                by {sectionApproval.approvedBy} on {new Date(sectionApproval.approvedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending Go for Launch Approval</span>
          </div>
        )}
        
        {canApprove && (
          <div className="flex space-x-2">
            {sectionApproval.approved ? (
              <button
                onClick={() => handleApproval(section.approvalSection, false)}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors"
              >
                Revoke Approval
              </button>
            ) : (
              <button
                onClick={() => handleApproval(section.approvalSection, true)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Go for Launch
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Legacy renderField function - now using DynamicProductForm
  /* const renderField = (field, sectionId) => {
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
  } */

  // Don't render form until we have essential data (for edit mode)
  // Check for key fields that should always be present when editing
  if (isEditing && (!formData || !formData.sku || !formData.name)) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Launch Status Banner */}
        {isEditing && canLaunch() && formData.status === 'draft' && canLaunchProducts() && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RocketLaunchIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Ready for Launch!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-200">
                    All sections have been approved. You can now launch this product.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isLaunching}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLaunching ? 'Launching...' : 'Launch Product'}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Form Fields */}
        <DynamicProductForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          readOnly={false}
          onApproval={handleApproval}
          isEditing={isEditing}
        />

        {/* Note: Now using DynamicProductForm above for field rendering */}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isEditing && (
              <span>
                Approved: {Object.values(approvals).filter(a => a.approved).length} of {Object.keys(approvals).length} sections
              </span>
            )}
          </div>
          
          <div className="flex space-x-4">
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
        </div>
      </form>
    </div>
  )
}

export default SimplifiedProductFormWithApprovals