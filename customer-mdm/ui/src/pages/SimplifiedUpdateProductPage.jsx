/**
 * Simplified Update Product Page - Only includes the 24 essential fields
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProduct, updateProduct } from '../services/productDataService'
import SimplifiedProductFormWithApprovals from '../components/product/SimplifiedProductFormWithApprovals'
import { 
  PencilIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const SimplifiedUpdateProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loadError, setLoadError] = useState('')
  
  // Initialize form data
  const [formData, setFormData] = useState({})
  const [originalData, setOriginalData] = useState({})

  // Load existing product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setInitialLoading(true)
        const product = await getProduct(id)
        
        if (product.error) {
          setLoadError(product.error)
          return
        }
        
        // Extract the actual product data from the API response
        const productData = product.product || product
        
        // Map the product data to form fields
        const mappedData = {
          // Core Product Information
          sku: productData.sku || '',
          name: productData.name || '',
          description: productData.description || '',
          
          // Product Classification
          type: productData.type || '',
          categorization: Array.isArray(productData.categorization) ? productData.categorization : [],
          
          // Pricing & Financial
          basePrice: productData.basePrice || 0,
          costPrice: productData.costPrice || 0,
          
          // License & Permissions
          licenseRequiredFlag: Boolean(productData.licenseRequiredFlag),
          
          // Seat-Based Pricing
          seatBasedPricingFlag: Boolean(productData.seatBasedPricingFlag),
          
          // Sales & Marketing Flags
          webDisplayFlag: Boolean(productData.webDisplayFlag),
          
          // Tax & Accounting
          avaTaxCode: productData.avaTaxCode || '',
          
          // Operations & Fulfillment
          canBeFulfilledFlag: Boolean(productData.canBeFulfilledFlag),
          
          // Contract Management
          contractItemFlag: Boolean(productData.contractItemFlag),
          
          // E-commerce Specific
          slug: productData.slug || '',
          longDescription: productData.longDescription || '',
          
          // System & Audit
          status: productData.status || 'draft',
          availableFlag: Boolean(productData.availableFlag !== false), // Default to true
          pricing: Array.isArray(productData.pricing) ? productData.pricing : [],
          approvals: Array.isArray(productData.approvals) ? productData.approvals : [],
          
          // System fields for audit information display
          id: productData.id || '',
          createdAt: productData.createdAt || null,
          updatedAt: productData.updatedAt || null,
          createdBy: productData.createdBy || '',
          updatedBy: productData.updatedBy || ''
        }
        
        setFormData(mappedData)
        setOriginalData(mappedData)
        
      } catch (error) {
        console.error('Error loading product:', error)
        setLoadError(error.message || 'Failed to load product')
      } finally {
        setInitialLoading(false)
      }
    }
    
    if (id) {
      loadProduct()
    }
  }, [id])

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
      
      console.log('Updating product with simplified data:', formData)
      
      // Update product
      const result = await updateProduct(id, formData)
      
      if (result.error) {
        setSubmitError(result.error)
        setLoading(false)
        return
      }
      
      console.log('Product updated successfully:', result)
      
      // Navigate back to product list
      navigate('/products')
      
    } catch (error) {
      console.error('Error updating product:', error)
      setSubmitError(error.message || 'Failed to update product')
      setLoading(false)
    }
  }

  // Show loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Failed to Load Product
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{loadError}</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
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
                <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Edit Product
                    </h1>
                    {formData.sku && (
                      <span className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {formData.sku}
                      </span>
                    )}
                  </div>
                  {formData.status && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        formData.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {formData.status}
                      </span>
                    </div>
                  )}
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
                {loading ? 'Saving...' : 'Save Changes'}
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
                  Failed to Update Product
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
          isEditing={true}
          onSubmit={handleSubmit}
          loading={loading}
          productId={id}
          navigate={navigate}
        />
      </div>
    </div>
  )
}

export default SimplifiedUpdateProductPage