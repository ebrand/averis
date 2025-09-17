/**
 * Simplified New Product Page - Only includes the 24 essential fields
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createProduct } from '../services/productDataService'
import SimplifiedProductFormWithApprovals from '../components/product/SimplifiedProductFormWithApprovals'
import { 
  PlusIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const SimplifiedNewProductPage = () => {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  
  // Initialize form data with simplified schema defaults
  const [formData, setFormData] = useState({
    // Core Product Information (required)
    sku: '',
    name: '',
    description: '',
    
    // Product Classification
    type: '',
    categorization: [],
    
    // Pricing & Financial
    basePrice: 0,
    costPrice: 0,
    
    // License & Permissions
    licenseRequiredFlag: false,
    
    // Seat-Based Pricing
    seatBasedPricingFlag: false,
    
    // Sales & Marketing Flags
    webDisplayFlag: false,
    
    // Tax & Accounting
    avaTaxCode: '',
    
    // Operations & Fulfillment
    canBeFulfilledFlag: false,
    
    // Contract Management
    contractItemFlag: false,
    
    // E-commerce Specific
    slug: '',
    longDescription: '',
    
    // System & Audit
    status: 'draft',
    availableFlag: true,
    pricing: [],
    approvals: []
  })

  // Validation function for required fields
  const validateForm = () => {
    const newErrors = {}
    
    // Required fields
    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required'
    } else if (!/^[A-Z0-9\-_]+$/i.test(formData.sku)) {
      newErrors.sku = 'SKU can only contain letters, numbers, hyphens, and underscores'
    }
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }
    
    // Price validation
    if (formData.basePrice < 0) {
      newErrors.basePrice = 'Base price cannot be negative'
    }
    
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSubmitError('')
    
    try {
      // Validate form
      const validationErrors = validateForm()
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setLoading(false)
        return
      }
      
      console.log('Creating product with simplified data:', formData)
      
      // Create product
      const result = await createProduct(formData)
      
      if (result.error) {
        setSubmitError(result.error)
        setLoading(false)
        return
      }
      
      console.log('Product created successfully:', result)
      
      // Navigate to product list or edit page
      const productId = result.product?.id || result.id
      
      if (productId) {
        navigate(`/products/${productId}/edit`)
      } else {
        console.error('No product ID found in result:', result)
        setSubmitError('Product created but unable to navigate - missing product ID')
        setLoading(false)
      }
      
    } catch (error) {
      console.error('Error creating product:', error)
      setSubmitError(error.message || 'Failed to create product')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/products')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Create New Product
                    </h1>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      draft
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Submit Error */}
        {submitError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Failed to Create Product
                </h3>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  {submitError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <SimplifiedProductFormWithApprovals
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isEditing={false}
          onSubmit={handleSubmit}
          loading={loading}
          productId={null}
          navigate={navigate}
        />
      </div>
    </div>
  )
}

export default SimplifiedNewProductPage