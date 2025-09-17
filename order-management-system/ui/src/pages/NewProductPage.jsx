import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { useAuth } from '../contexts/AuthContext'
import { createProduct, getDataSourceInfo } from '../services/productDataService'
import { 
  PlusIcon,
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
import SystemInfoSection from '../components/product/SystemInfoSection'

const NewProductPage = () => {
  const navigate = useNavigate()
  const { roleConfig, getTabAccess, hasPermission, currentRole } = useRole()
  const { userProfile } = useAuth()
  
  // Helper function to get filled field count for a section
  const getFilledFieldCount = (fields, formData) => {
    return fields.filter(field => {
      const value = formData[field.key];
      // For boolean fields, both true and false are valid values
      if (typeof value === 'boolean') return true;
      // For other fields, check if they have meaningful content
      return value !== null && value !== undefined && value !== '';
    }).length;
  }
  
  // Define field groups by tab for progress calculation (matching TabSpecificFormSection.jsx)
  const getTabFieldGroups = (tabId) => {
    const allFieldGroups = [
      {
        title: 'Core Product Information',
        key: 'core',
        tabs: ['marketing'],
        fields: [
          { key: 'sku_code' }, { key: 'name' }, { key: 'display_name' }, 
          { key: 'description' }, { key: 'brand' }, { key: 'manufacturer' },
          { key: 'base_product' }, { key: 'change_code' }
        ]
      },
      {
        title: 'Product Classification',
        key: 'classification',
        tabs: ['marketing'],
        fields: [
          { key: 'type' }, { key: 'sub_type' }, { key: 'class' }, { key: 'upgrade_type' }
        ]
      },
      {
        title: 'E-commerce & Customer Experience',
        key: 'averis_ecomm',
        tabs: ['marketing'],
        fields: [
          { key: 'sku' }, { key: 'category' }, { key: 'slug' },
          { key: 'short_description' }, { key: 'long_description' }
        ]
      },
      {
        title: 'Sales & Marketing Flags',
        key: 'sales_marketing',
        tabs: ['marketing'],
        fields: [
          { key: 'available_flag' }, { key: 'web_display_flag' }, { key: 'sales_quotable_flag' },
          { key: 'channel_quotable_flag' }, { key: 'web_quotable_flag' }, { key: 'team_approval_needed_flag' },
          { key: 'availability_status' }, { key: 'lifecycle_status' }
        ]
      },
      {
        title: 'License & Permissions',
        key: 'licensing',
        tabs: ['legal'],
        fields: [
          { key: 'license_required_flag' }, { key: 'license_key_type' }, { key: 'license_count' },
          { key: 'license_description' }, { key: 'app_id' }, { key: 'app_key' },
          { key: 'renewal_required_flag' }, { key: 'portal_renewal_flag' }, { key: 'grouped_license_flag' },
          { key: 'additional_license_flag' }, { key: 'additional_licenses_to_provision' }, { key: 'term_license_flag' }
        ]
      },
      {
        title: 'Tax & Accounting',
        key: 'accounting',
        tabs: ['legal'],
        fields: [
          { key: 'ava_tax_code' }, { key: 'tax_schedule' }, { key: 'income_account' },
          { key: 'deferred_revenue_account' }, { key: 'rev_rec_rule' }, { key: 'rev_rec_forecast_rule' },
          { key: 'rev_allocation_group' }, { key: 'maintenance_item' }, { key: 'renewal_item' }
        ]
      },
      {
        title: 'Pricing & Financial',
        key: 'pricing',
        tabs: ['finance'],
        fields: [
          { key: 'base_price' }, { key: 'list_price' }, { key: 'cost_price' }, { key: 'cost_basis' },
          { key: 'unit_of_measure' }, { key: 'weight' }, { key: 'revenue_category' }, { key: 'item_revenue_category' }
        ]
      },
      {
        title: 'Seat-Based Pricing',
        key: 'seating',
        tabs: ['finance'],
        fields: [
          { key: 'seat_based_pricing_flag' }, { key: 'seat_adjustment_flag' },
          { key: 'seat_min_price_break_level' }, { key: 'seat_max_price_break_level' }
        ]
      },
      {
        title: 'Operations & Fulfillment',
        key: 'operations',
        tabs: ['sales'],
        fields: [
          { key: 'can_be_fulfilled_flag' }, { key: 'exclude_from_autoprocess_flag' }, { key: 'create_revenue_plans_on' },
          { key: 'allocation_type' }, { key: 'subsidiary' }, { key: 'inactive_flag' },
          { key: 'include_children_flag' }, { key: 'direct_revenue_posting_flag' }
        ]
      },
      {
        title: 'Contract & Billing',
        key: 'contracts',
        tabs: ['contracts'],
        fields: [
          { key: 'contract_item_flag' }, { key: 'contract_item_type' }, { key: 'contract_billing_frequency' },
          { key: 'contract_term_months' }, { key: 'contract_end_of_term_action' }, { key: 'initial_contract_line_status_code' }
        ]
      }
    ];
    
    return allFieldGroups.filter(group => group.tabs.includes(tabId));
  }
  
  // Calculate completion percentage for a specific tab
  const getTabCompletionPercentage = (tabId) => {
    const tabGroups = getTabFieldGroups(tabId);
    
    if (tabGroups.length === 0) return 0;
    
    let totalFields = 0;
    let filledFields = 0;
    
    tabGroups.forEach(group => {
      totalFields += group.fields.length;
      filledFields += getFilledFieldCount(group.fields, formData);
    });
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }
  
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
  const [formData, setFormData] = useState({
    // Core identification
    sku_code: '',
    name: '',
    display_name: '',
    description: '',
    license_description: '',
    change_code: '',
    base_product: '',
    
    // Brand and manufacturer
    brand: '',
    manufacturer: '',
    
    // Product classification
    categorization: [],
    class: '',
    type: '',
    sub_type: '',
    upgrade_type: '',
    
    // Status flags
    inactive_flag: false,
    available_flag: true,
    web_display_flag: false,
    include_children_flag: false,
    
    // Licensing configuration
    license_count: 0,
    license_key_type: '',
    license_required_flag: false,
    app_id: 0,
    app_key: 0,
    seat_based_pricing_flag: false,
    seat_adjustment_flag: false,
    seat_min_price_break_level: '',
    seat_max_price_break_level: '',
    renewal_required_flag: false,
    portal_renewal_flag: false,
    grouped_license_flag: false,
    additional_license_flag: false,
    additional_licenses_to_provision: '',
    term_license_flag: false,
    
    // Sales and quotation
    sales_quotable_flag: false,
    channel_quotable_flag: false,
    web_quotable_flag: false,
    team_approval_needed_flag: false,
    
    // Pricing
    base_price: 0,
    pricing: [],
    list_price: 0,
    cost_price: 0,
    cost_basis: 0,
    unit_of_measure: 'each',
    weight: 0,
    availability_status: 'available',
    lifecycle_status: 'draft',
    
    // Tax and accounting
    ava_tax_code: '',
    tax_schedule: '',
    income_account: '',
    deferred_revenue_account: '',
    revenue_category: '',
    item_revenue_category: '',
    rev_rec_rule: '',
    rev_rec_forecast_rule: '',
    rev_allocation_group: '',
    maintenance_item: '',
    renewal_item: '',
    direct_revenue_posting_flag: false,
    
    // Fulfillment and processing
    exclude_from_autoprocess_flag: false,
    can_be_fulfilled_flag: false,
    create_revenue_plans_on: '',
    allocation_type: '',
    subsidiary: '',
    
    // Contract configuration
    contract_item_flag: false,
    contract_billing_frequency: '',
    contract_item_type: '',
    contract_term_months: 0,
    contract_end_of_term_action: '',
    initial_contract_line_status_code: '',
    
    // E-commerce fields
    sku: '',
    category: '',
    slug: '',
    short_description: '',
    long_description: '',
    tags: [],
    specifications: {},
    features: [],
    images: { primary: null, gallery: [] },
    seo: { meta_title: null, meta_description: null, search_keywords: [] },
    ratings: { average: 0, count: 0, review_count: 0 },
    stock: { status: 'in_stock', quantity: 0, low_stock_threshold: 10, backorder_allowed: false },
    dimensions: { weight: null, length: null, width: null, height: null, weight_unit: 'kg', dimension_unit: 'cm' },
    
    // System and sync fields
    source_system: 'product-mdm',
    last_sync_at: null,
    sync_version: 1,
    is_active: true,
    status: 'draft',
    approvals: []
  })
  const [approvals, setApprovals] = useState({})
  const [errors, setErrors] = useState({})
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Basic required fields
    if (!formData.sku_code.trim()) {
      newErrors.sku_code = 'SKU Code is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product Name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    
    try {
      // Prepare product data
      const productData = {
        ...formData,
        status: 'draft', // All new products start as draft, not launched
        created_by: userProfile?.id || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Use hybrid data service to create product
      const result = await createProduct(productData)
      
      if (result.error) {
        setSaveError(result.error)
        return
      }
      
      // Success - show message and redirect
      const successMessage = `Product saved successfully! Using ${result.source} data.`
      
      setSaveSuccess(successMessage)
      
      // Redirect to products list after delay
      setTimeout(() => {
        navigate('/products', { 
          state: { 
            message: 'Product saved successfully!',
            newProductId: result.product.id 
          }
        })
      }, 2000)
      
    } catch (error) {
      console.error('Error saving product:', error)
      setSaveError('Unexpected error saving product. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getTabStatusIcon = (tabId) => {
    // Logic to show validation status for each tab
    const tabErrors = Object.keys(errors).filter(key => {
      // Map errors to tabs (you'd implement this based on your field mapping)
      return false // Simplified for now
    })
    
    if (tabErrors.length > 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
    
    return null
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Product</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add a new product to the master data management system
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/products')}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Product'}
              </button>
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
                <div className="text-sm text-green-800 dark:text-green-200">
                  {saveSuccess}
                </div>
                <button
                  onClick={() => setSaveSuccess(null)}
                  className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {saveError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <strong>Error:</strong> {saveError}
                </div>
                <button
                  onClick={() => setSaveError(null)}
                  className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
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
                    group flex flex-col py-4 px-2 font-medium text-sm whitespace-nowrap transition-all duration-200
                    w-1/6
                    ${!isLastTab ? 'border-r border-gray-200 dark:border-gray-600' : ''}
                    ${isFirstTab ? 'rounded-tl-lg rounded-bl-lg' : ''}
                    ${isLastTab ? 'rounded-tr-lg rounded-br-lg' : ''}
                    ${isActive
                      ? `bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border-t border-l border-r border-b-2 border-t-gray-300 border-l-gray-300 border-r-gray-300 border-b-blue-500 dark:border-t-gray-600 dark:border-l-gray-600 dark:border-r-gray-600 -mb-px ${isFirstTab ? 'rounded-tl-lg rounded-bl-lg' : ''} ${isLastTab ? 'rounded-tr-lg rounded-br-lg' : ''}`
                      : canAccess
                        ? 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                        : 'text-gray-400 cursor-not-allowed bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  {/* Top section: Icon, name, and status icons */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center">
                      <span className="mr-2 text-base">{tab.icon}</span>
                      {tab.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      {isReadOnly ? (
                        <MinusCircleIcon className="h-4 w-4 text-red-500" title="Read Only" />
                      ) : (
                        <PlayCircleIcon className="h-4 w-4 text-blue-500" title="Read Write" />
                      )}
                      {isApproved && (
                        <RocketLaunchIcon className="h-4 w-4 text-green-500" title="Approved for Launch" />
                      )}
                      <span>
                        {getTabStatusIcon(tab.id)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar section */}
                  {tab.id !== 'launch' && (
                    <div className="w-full flex items-center space-x-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                          style={{ width: `${getTabCompletionPercentage(tab.id)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[2rem] text-right">
                        {getTabCompletionPercentage(tab.id)}%
                      </span>
                    </div>
                  )}
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
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
                      <div className="text-sm text-amber-800">
                        <strong>Read-only access:</strong> You can view these fields but cannot edit them. 
                        Contact a user with {tab.name} permissions to make changes.
                      </div>
                    </div>
                  </div>
                )}
                
                <TabComponent
                  formData={formData}
                  onChange={handleInputChange}
                  errors={errors}
                  readOnly={isReadOnly}
                  approvals={approvals}
                  onApprove={() => {
                    // For new products, show message that they need to be saved first
                    alert('Please save the product first before approvals can be given.')
                  }}
                  onLaunch={tab.id === 'launch' ? () => {
                    // For new products, show message that they need to be saved first
                    alert('Please save the product first before launching.')
                  } : undefined}
                />
              </div>
            )
          })}
        </div>
        
        {/* System Information Section */}
        <SystemInfoSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          readOnly={!hasPermission('system_info')}
        />
      </div>
    </div>
  )
}

export default NewProductPage