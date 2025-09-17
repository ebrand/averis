import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { useAuth } from '../contexts/AuthContext'
import { getProduct, updateProduct } from '../services/productDataService'
import { 
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayCircleIcon,
  MinusCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

// Tab components
import MarketingTab from '../components/product/tabs/MarketingTab'
import LegalTab from '../components/product/tabs/LegalTab'
import FinanceTab from '../components/product/tabs/FinanceTab'
import SalesTab from '../components/product/tabs/SalesTab'
import ContractsTab from '../components/product/tabs/ContractsTab'
import LaunchTab from '../components/product/tabs/LaunchTab'

const UpdateProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { roleConfig, getTabAccess, canViewProducts, canEditProducts, canLaunchProducts, canApproveTab, currentRole } = useRole()
  const { userProfile } = useAuth()
  
  // Determine the default active tab based on user's role
  const getDefaultTab = () => {
    const roleTabMapping = {
      'Marketing': 'marketing',
      'Legal': 'legal',
      'Finance': 'finance',
      'SalesOps': 'sales',
      'Contracts': 'contracts'
    }
    return roleTabMapping[currentRole] || 'marketing'
  }
  
  const [activeTab, setActiveTab] = useState(getDefaultTab())
  const [productData, setProductData] = useState({
    sku_code: '',
    name: '',
    display_name: '',
    description: '',
    license_description: '',
    type: '',
    sub_type: '',
    class: '',
    categorization: [],
    base_price: '',
    available_flag: true,
    web_display_flag: false,
    inactive_flag: false,
    include_children_flag: false,
    license_required_flag: false,
    license_count: 0,
    license_key_type: '',
    seat_based_pricing_flag: false,
    revenue_category: 'Standard',
    change_code: 'Updated',
    upgrade_type: 'None',
    base_product: '',
    subsidiary: 'Main',
    status: 'active'
  })
  const [approvals, setApprovals] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)

  const tabs = [
    {
      id: 'marketing',
      name: roleConfig.tabs?.marketing?.label || 'Marketing & Product Info',
      icon: '📱',
      component: MarketingTab,
      access: getTabAccess('marketing', approvals)
    },
    {
      id: 'legal',
      name: roleConfig.tabs?.legal?.label || 'Legal',
      icon: '⚖️',
      component: LegalTab,
      access: getTabAccess('legal', approvals)
    },
    {
      id: 'finance',
      name: roleConfig.tabs?.finance?.label || 'Finance',
      icon: '💰',
      component: FinanceTab,
      access: getTabAccess('finance', approvals)
    },
    {
      id: 'sales',
      name: roleConfig.tabs?.sales?.label || 'Sales Ops',
      icon: '📊',
      component: SalesTab,
      access: getTabAccess('sales', approvals)
    },
    {
      id: 'contracts',
      name: roleConfig.tabs?.contracts?.label || 'Contracts & Services',
      icon: '📋',
      component: ContractsTab,
      access: getTabAccess('contracts', approvals)
    },
    {
      id: 'launch',
      name: 'Launch',
      icon: '🚀',
      component: LaunchTab,
      access: 'read' // Everyone can view launch status
    }
  ]

  // Check authorization
  useEffect(() => {
    if (!canViewProducts()) {
      navigate('/products')
      return
    }
  }, [canViewProducts, navigate])

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setSaveError('Product ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await getProduct(id)
        
        if (result.error) {
          setSaveError(result.error)
        } else if (result.product) {
          // Transform API data to match component expectations
          const transformedProduct = {
            ...result.product,
            // Map camelCase API fields to snake_case component fields
            sku_code: result.product.skuCode || result.product.sku_code || '',
            display_name: result.product.displayName || result.product.display_name || '',
            license_description: result.product.licenseDescription || result.product.license_description || '',
            sub_type: result.product.subType || result.product.sub_type || '',
            base_price: result.product.basePrice || result.product.base_price || '',
            available_flag: result.product.availableFlag !== undefined ? result.product.availableFlag : result.product.available_flag,
            web_display_flag: result.product.webDisplayFlag !== undefined ? result.product.webDisplayFlag : result.product.web_display_flag,
            inactive_flag: result.product.inactiveFlag !== undefined ? result.product.inactiveFlag : result.product.inactive_flag,
            include_children_flag: result.product.includeChildrenFlag !== undefined ? result.product.includeChildrenFlag : result.product.include_children_flag,
            license_required_flag: result.product.licenseRequiredFlag !== undefined ? result.product.licenseRequiredFlag : result.product.license_required_flag,
            license_count: result.product.licenseCount || result.product.license_count || 0,
            license_key_type: result.product.licenseKeyType || result.product.license_key_type || '',
            seat_based_pricing_flag: result.product.seatBasedPricingFlag !== undefined ? result.product.seatBasedPricingFlag : result.product.seat_based_pricing_flag,
            revenue_category: result.product.revenueCategory || result.product.revenue_category || 'Standard',
            change_code: result.product.changeCode || result.product.change_code || 'Updated',
            upgrade_type: result.product.upgradeType || result.product.upgrade_type || 'None',
            base_product: result.product.baseProduct || result.product.base_product || '',
            status: result.product.status || 'active',
          }
          setProductData(transformedProduct)
          // Load approvals (for now, stored in localStorage as a simple solution)
          const savedApprovals = localStorage.getItem(`product_approvals_${id}`)
          if (savedApprovals) {
            try {
              setApprovals(JSON.parse(savedApprovals))
            } catch (e) {
              console.warn('Failed to parse saved approvals:', e)
            }
          }
          setSaveError(null)
        } else {
          setSaveError('Product not found')
        }
      } catch (err) {
        setSaveError('Failed to load product: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const handleInputChange = (field, value) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear any existing errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleSave = async () => {
    if (!canEditProducts()) {
      setSaveError('You do not have permission to edit products')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    
    try {
      const result = await updateProduct(id, productData)
      
      if (result.error) {
        setSaveError(result.error)
        return
      }
      
      // Success
      setSaveSuccess(`Product updated successfully! Using ${result.source} data.`)
      
      // Redirect to products list after delay
      setTimeout(() => {
        navigate('/products', { 
          state: { 
            message: 'Product updated successfully!',
            updatedProductId: result.product.id 
          }
        })
      }, 2000)
      
    } catch (error) {
      console.error('Error updating product:', error)
      setSaveError('Unexpected error updating product. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprove = async (tabId) => {
    if (!canApproveTab(tabId)) {
      setSaveError(`You do not have permission to approve ${tabId} section`)
      return
    }

    try {
      // First save the current product data
      const saveResult = await updateProduct(id, productData)
      
      if (saveResult.error) {
        setSaveError(`Failed to save product before approval: ${saveResult.error}`)
        return
      }

      // Then create the approval
      const newApproval = {
        approved: true,
        approvedBy: userProfile?.name || userProfile?.email || 'Unknown User',
        approvedAt: new Date().toISOString(),
        role: currentRole
      }

      const updatedApprovals = {
        ...approvals,
        [tabId]: newApproval
      }

      setApprovals(updatedApprovals)
      
      // Save approvals to localStorage (in production, this would be saved to the database)
      localStorage.setItem(`product_approvals_${id}`, JSON.stringify(updatedApprovals))
      
      const departmentName = tabId.charAt(0).toUpperCase() + tabId.slice(1)
      setSaveSuccess(`✅ Product saved and ${departmentName} section approved for launch!`)
      setTimeout(() => setSaveSuccess(null), 5000)
      
    } catch (error) {
      console.error('Error approving section:', error)
      setSaveError('Unexpected error during approval process. Please try again.')
    }
  }

  const handleScrub = async (tabId) => {
    if (!canApproveTab(tabId)) {
      setSaveError(`You do not have permission to scrub ${tabId} section approval`)
      return
    }

    try {
      // Remove the approval for this tab
      const updatedApprovals = { ...approvals }
      delete updatedApprovals[tabId]

      setApprovals(updatedApprovals)
      
      // Save updated approvals to localStorage
      localStorage.setItem(`product_approvals_${id}`, JSON.stringify(updatedApprovals))
      
      const departmentName = tabId.charAt(0).toUpperCase() + tabId.slice(1)
      setSaveSuccess(`🔄 ${departmentName} launch approval has been scrubbed. Tab is now unlocked for editing.`)
      setTimeout(() => setSaveSuccess(null), 5000)
      
    } catch (error) {
      console.error('Error scrubbing approval:', error)
      setSaveError('Unexpected error scrubbing approval. Please try again.')
    }
  }

  const handleLaunch = async () => {
    if (!canLaunchProducts()) {
      setSaveError('You do not have permission to launch products')
      return
    }

    try {
      // Update product status to 'active' to launch it
      const launchData = {
        ...productData,
        status: 'active',
        web_display_flag: true,  // Make visible online
        available_flag: true     // Make available to customers
      }
      
      const result = await updateProduct(id, launchData)
      
      if (result.error) {
        setSaveError(result.error)
        return
      }
      
      // Update local state to reflect the launch
      setProductData(launchData)
      setSaveSuccess('Product launched successfully! It is now live and available to customers.')
      
    } catch (error) {
      console.error('Error launching product:', error)
      setSaveError('Unexpected error launching product. Please try again.')
    }
  }

  const handleCancel = () => {
    navigate('/products')
  }

  const getTabStatusIcon = (tabId) => {
    // Logic to show validation status for each tab
    const tabErrors = Object.keys(errors).filter(key => {
      // Map errors to tabs (simplified for now)
      return false
    })
    
    if (tabErrors.length > 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
    
    return null
  }

  if (!canViewProducts()) {
    return null // Will redirect
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <PencilIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Update Product</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {productData.sku_code} - {productData.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {canEditProducts() ? 'Cancel' : 'Back to Products'}
              </button>
              
              {canEditProducts() && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(saveSuccess || saveError) && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-green-800 dark:text-green-200">{saveSuccess}</span>
              </div>
            </div>
          )}
          
          {saveError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200">{saveError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="rounded-lg">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              const canAccess = tab.access !== 'none'
              const isReadOnly = tab.access === 'read'
              const isApproved = approvals[tab.id]?.approved === true
              const isLastTab = index === tabs.length - 1
              const isFirstTab = index === 0
              
              return (
                <button
                  key={tab.id}
                  onClick={() => canAccess && setActiveTab(tab.id)}
                  disabled={!canAccess}
                  className={`
                    group flex items-center justify-between py-4 px-2 font-medium text-sm whitespace-nowrap transition-all duration-200
                    w-1/6
                    ${!isLastTab ? 'border-r border-gray-200 dark:border-gray-600' : ''}
                    ${isFirstTab ? 'rounded-tl-lg rounded-bl-lg' : ''}
                    ${isLastTab ? 'rounded-tr-lg rounded-br-lg' : ''}
                    ${isActive
                      ? `bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border-t border-l border-r border-b-2 border-t-gray-300 border-l-gray-300 border-r-gray-300 border-b-green-500 dark:border-t-gray-600 dark:border-l-gray-600 dark:border-r-gray-600 -mb-px ${isFirstTab ? 'rounded-tl-lg rounded-bl-lg' : ''} ${isLastTab ? 'rounded-tr-lg rounded-br-lg' : ''}`
                      : canAccess
                        ? 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                        : 'text-gray-400 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-base">{tab.icon}</span>
                    {tab.name}
                  </div>
                  <div className="flex items-center space-x-1">
                    {isReadOnly ? (
                      <MinusCircleIcon className="h-4 w-4 text-red-500" title="Read Only" />
                    ) : (
                      <PlayCircleIcon className="h-4 w-4 text-green-500" title="Read Write" />
                    )}
                    {isApproved && (
                      <RocketLaunchIcon className="h-4 w-4 text-green-500" title="Approved for Launch" />
                    )}
                    <span>
                      {getTabStatusIcon(tab.id)}
                    </span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {tabs.map((tab) => {
            if (activeTab !== tab.id) return null
            
            const TabComponent = tab.component
            const isReadOnly = tab.access === 'read'
            
            return (
              <div key={tab.id}>
                {isReadOnly && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Read-only access:</strong> You can view these fields but cannot edit them. 
                        Contact a user with {tab.name} permissions to make changes.
                      </div>
                    </div>
                  </div>
                )}
                
                <TabComponent
                  formData={productData}
                  onChange={handleInputChange}
                  errors={errors}
                  readOnly={isReadOnly}
                  approvals={approvals}
                  onApprove={handleApprove}
                  onScrub={handleScrub}
                  onLaunch={tab.id === 'launch' ? handleLaunch : undefined}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UpdateProductPage