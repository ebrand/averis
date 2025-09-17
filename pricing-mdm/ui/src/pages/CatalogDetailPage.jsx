import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import LocaleWorkflowModal from '../components/catalog/LocaleWorkflowModal'
import LocalizedContentRow from '../components/catalog/LocalizedContentRow'
import { signalRService } from '../services/signalRService'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  GlobeAmericasIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  LanguageIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const CatalogDetailPage = () => {
  const { catalogId, region } = useParams()
  const navigate = useNavigate()
  const { hasPermission, canViewCatalogs, canEditCatalogs, hasRegionAccess } = useRole()

  // Helper function to truncate text to specified length with ellipses
  const truncateText = (text, maxLength = 30) => {
    if (!text) return text
    return text.length > maxLength ? text.substring(0, (maxLength-3)) + '...' : text
  }
  
  const [catalog, setCatalog] = useState(null)
  const [products, setProducts] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [showLocaleWorkflowModal, setShowLocaleWorkflowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Search and filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [availableSearchQuery, setAvailableSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    availability: 'all', // all, available, unavailable
    featured: 'all', // all, featured, not_featured
    class: '',
    type: '',
    support_level: 'all'
  })
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [availablePage, setAvailablePage] = useState(1)
  const [availableTotalPages, setAvailableTotalPages] = useState(1)
  const pageSize = 25
  
  // Expanded rows state for localized content
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [localizationCounts, setLocalizationCounts] = useState(new Map())

  // Helper functions for pricing calculations
  const calculateFinalPrice = (basePrice, overridePrice, discountPercentage, pricingMode) => {
    if (pricingMode === 'override' && overridePrice) {
      // In override mode, use override price directly (no discounts applied)
      return parseFloat(overridePrice)
    } else {
      // In discount mode, apply discount to base price
      const discount = pricingMode === 'discount' ? parseFloat(discountPercentage || 0) : 0
      return parseFloat(basePrice || 0) * (100 - discount) / 100
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handlePricingModeChange = (newMode) => {
    console.log('=== PRICING MODE CHANGE ===')
    console.log('Previous mode:', productForm.pricing_mode)
    console.log('New mode:', newMode)
    console.log('Previous form state:', {
      override_base_price: productForm.override_base_price,
      discount_percentage: productForm.discount_percentage
    })
    
    setProductForm(prev => {
      const newForm = {
        ...prev,
        pricing_mode: newMode,
        // Clear the non-active pricing field when switching modes
        override_base_price: newMode === 'override' ? prev.override_base_price : '',
        discount_percentage: newMode === 'discount' ? prev.discount_percentage : '0'
      }
      
      console.log('New form state after mode change:', {
        pricing_mode: newForm.pricing_mode,
        override_base_price: newForm.override_base_price,
        discount_percentage: newForm.discount_percentage
      })
      
      return newForm
    })
  }
  
  // Product form state
  const [productForm, setProductForm] = useState({
    product_id: '',
    is_available: true,
    is_featured: false,
    custom_name: '',
    custom_description: '',
    override_base_price: '',
    discount_percentage: '',
    pricing_mode: 'discount', // 'override' or 'discount'
    minimum_quantity: 1,
    maximum_quantity: '',
    display_order: 0,
    local_sku_code: '',
    fulfillment_method: 'standard',
    delivery_timeframe: '',
    support_level: 'standard',
    export_classification: '',
    regulatory_notes: '',
    requires_approval: false
  })

  // Fetch localization count for a specific product
  const fetchLocalizationCount = useCallback(async (productId) => {
    try {
      const response = await fetch(`http://api.localhost/pricing/api/catalogproduct/${productId}/localized-content/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLocalizationCounts(prev => new Map(prev.set(productId, data.count || 0)))
        return data.count || 0
      }
    } catch (error) {
      console.error('Error fetching localization count:', error)
    }
    
    // Return 0 as fallback
    setLocalizationCounts(prev => new Map(prev.set(productId, 0)))
    return 0
  }, [])

  // Load catalog details
  useEffect(() => {
    loadCatalog()
  }, [catalogId])

  // Load products when search, filters, or page changes
  useEffect(() => {
    if (catalog) {
      loadCatalogProducts()
      loadAvailableProducts() // Load available products on catalog load
    }
  }, [catalog, searchQuery, filters, currentPage])

  // Listen for localization job completion events to refresh counts
  useEffect(() => {
    const handleJobComplete = (data) => {
      console.log(`🔄 CatalogDetailPage: Job completed, refreshing localization counts:`, data)
      
      // Refresh localization count for products that might have been affected
      // Since we don't know exactly which product was localized, refresh all visible products
      products.forEach(product => {
        fetchLocalizationCount(product.id)
      })
    }

    const connectAndListen = async () => {
      try {
        const connected = await signalRService.connect()
        if (connected) {
          console.log(`🔄 CatalogDetailPage: Connected to SignalR, listening for job completion events`)
          signalRService.subscribe('JobComplete', handleJobComplete)
        }
      } catch (error) {
        console.error('CatalogDetailPage: Failed to connect to SignalR:', error)
      }
    }

    connectAndListen()

    return () => {
      // Cleanup subscription
      signalRService.unsubscribe?.('JobComplete', handleJobComplete)
    }
  }, [products, fetchLocalizationCount])

  // Load available products when search or page changes
  useEffect(() => {
    if (catalog) {
      loadAvailableProducts()
    }
  }, [catalog, availableSearchQuery, availablePage])

  const loadCatalog = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/catalogs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      const foundCatalog = data.catalogs?.find(c => c.id === catalogId)
      
      if (foundCatalog) {
        setCatalog(foundCatalog)
      } else {
        setError('Catalog not found')
      }
    } catch (error) {
      console.error('Error loading catalog:', error)
      setError('Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }

  const loadCatalogProducts = async () => {
    try {
      console.log('loadCatalogProducts called for catalog:', catalogId)
      setProductsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString()
      })
      
      if (searchQuery) params.append('searchTerm', searchQuery)
      
      const response = await fetch(`/api/catalogproduct/catalog/${catalogId}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      console.log('loadCatalogProducts response:', data)
      
      // Get catalog products from the correct response field
      let catalogProducts = data.catalogProducts || []
      
      // Enhance with product details from Product Staging API (with timeout)
      const enhancedProducts = await Promise.all(catalogProducts.map(async (cp) => {
        try {
          // Create timeout controller (5 second timeout)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          // Fetch product details from Product Staging API
          const productResponse = await fetch(`/api/products/${cp.productId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          
          if (productResponse.ok) {
            const productData = await productResponse.json()
            console.log(`Enhanced product ${cp.productId}:`, productData.name)
            return {
              ...cp,
              productName: productData.name || cp.productName,
              productSku: productData.sku || cp.productSku,
              productBasePrice: productData.basePrice,
              productClass: productData.class,
              productType: productData.type
            }
          } else {
            console.warn(`Product Staging API returned ${productResponse.status} for product ${cp.productId}`)
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn(`Timeout fetching product details for ${cp.productId}`)
          } else {
            console.warn('Failed to fetch product details for', cp.productId, error)
          }
        }
        // Return original catalog product if enhancement fails
        console.log(`Using fallback data for product ${cp.productId}`)
        return {
          ...cp,
          productName: cp.productName || `Product ${cp.productId}`,
          productSku: cp.productSku || 'UNKNOWN-SKU'
        }
      }))
      
      // Apply client-side filters (including text search not handled by API)
      let filteredProducts = enhancedProducts
      
      // Apply text filtering client-side for enhanced product data  
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredProducts = filteredProducts.filter(p => 
          p.productName?.toLowerCase().includes(query) ||
          p.productSku?.toLowerCase().includes(query) ||
          p.customName?.toLowerCase().includes(query) ||
          p.localSkuCode?.toLowerCase().includes(query)
        )
      }
      
      if (filters.availability !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
          filters.availability === 'available' ? p.isActive : !p.isActive
        )
      }
      
      if (filters.featured !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
          filters.featured === 'featured' ? p.isFeatured : !p.isFeatured
        )
      }
      
      if (filters.class) {
        filteredProducts = filteredProducts.filter(p => 
          p.productClass?.toLowerCase().includes(filters.class.toLowerCase())
        )
      }
      
      if (filters.type) {
        filteredProducts = filteredProducts.filter(p => 
          p.productType?.toLowerCase().includes(filters.type.toLowerCase())
        )
      }
      
      if (filters.support_level !== 'all') {
        filteredProducts = filteredProducts.filter(p => 
          p.supportLevel === filters.support_level
        )
      }
      
      console.log('=== SETTING PRODUCTS STATE ===')
      console.log('Setting products to:', filteredProducts.length, 'items')
      console.log('First 3 products:', filteredProducts.slice(0, 3).map(p => ({ id: p.productId, name: p.productName })))
      
      setProducts(filteredProducts)
      setTotalPages(data.totalPages || 1)
      setTotalProducts(data.totalCount || 0)
      
      console.log('State updated - totalPages:', data.totalPages || 1, 'totalProducts:', data.totalCount || 0)
    } catch (error) {
      console.error('Error loading catalog products:', error)
      setError('Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }

  const loadAvailableProducts = async () => {
    try {
      console.log('loadAvailableProducts called')
      const params = new URLSearchParams({
        page: availablePage.toString(),
        limit: pageSize.toString()
      })
      
      if (availableSearchQuery) params.append('search', availableSearchQuery)
      
      // Use Product Staging API to get available products not already in catalog  
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      
      // Extract products from the response structure
      const allProducts = data.products || data || []
      
      // Get current catalog products to exclude them
      const catalogProductsResponse = await fetch(`/api/catalogproduct/catalog/${catalogId}/products?pageSize=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const catalogProductsData = await catalogProductsResponse.json()
      const existingProductIds = new Set((catalogProductsData.catalogProducts || catalogProductsData.data || []).map(cp => cp.productId))
      
      // Filter available products
      const availableProducts = allProducts.filter(product => !existingProductIds.has(product.id))
      
      setAvailableProducts(availableProducts)
      // Use pagination info from Product Staging API
      const totalPages = data.pagination?.pages || Math.ceil(availableProducts.length / pageSize)
      setAvailableTotalPages(totalPages)
    } catch (error) {
      console.error('Error loading available products:', error)
    }
  }

  // Quick add function with smart defaults
  const handleQuickAddProduct = async (product) => {
    try {
      console.log('Quick adding product to catalog:', { catalogId, productId: product.id })
      
      const requestData = {
        catalogId: catalogId,
        productId: product.id,
        isActive: true,
        overridePrice: null,
        discountPercentage: 0
      }
      
      const response = await fetch(`/api/catalogproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      console.log('Quick add response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Product quick-added successfully:', result)
        
        // Refresh both lists after successful add
        try {
          await loadCatalogProducts()
          await loadAvailableProducts()
          console.log('Lists refreshed successfully after quick-add')
        } catch (refreshError) {
          console.error('Error refreshing after quick-add:', refreshError)
        }
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        setError(error.error || 'Failed to add product')
      }
    } catch (error) {
      console.error('Error quick adding product:', error)
      setError('Failed to add product')
    }
  }

  // Quick remove function
  const handleQuickRemoveProduct = async (product) => {
    try {
      console.log('=== REMOVE PRODUCT START ===')
      console.log('Product object:', product)
      console.log('Product ID from object:', product.productId)
      console.log('Catalog ID:', catalogId)
      console.log('Current products.length:', products.length)
      console.log('API URL will be:', `/api/catalogproduct/catalog/${catalogId}/product/${product.productId}`)
      
      const response = await fetch(`/api/catalogproduct/catalog/${catalogId}/product/${product.productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Quick remove response status:', response.status)
      console.log('Quick remove response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const result = await response.text()
        console.log('Product quick-removed successfully:', result)
        
        // Immediately remove from UI for instant feedback
        setProducts(prevProducts => prevProducts.filter(p => p.productId !== product.productId))
        
        // Then refresh catalog products for server consistency (in background)
        try {
          await loadCatalogProducts()
          console.log('Catalog products refreshed successfully after removal')
        } catch (refreshError) {
          console.error('Error refreshing catalog products:', refreshError)
          // Revert the immediate removal if refresh fails
          await loadCatalogProducts()
        }
        
        // Refresh available products separately to avoid blocking the main refresh
        try {
          await loadAvailableProducts()
          console.log('Available products refreshed successfully')
        } catch (availableError) {
          console.error('Error refreshing available products (non-critical):', availableError)
          // This is non-critical since the main operation succeeded
        }
      } else {
        let errorMessage = 'Failed to remove product'
        try {
          const error = await response.json()
          console.error('Error response JSON:', error)
          errorMessage = error.error || error.message || errorMessage
        } catch (jsonError) {
          const textError = await response.text()
          console.error('Error response text:', textError)
          errorMessage = `HTTP ${response.status}: ${textError || 'Unknown error'}`
        }
        setError(errorMessage)
        console.log('=== REMOVE FAILED ===')
      }
    } catch (error) {
      console.error('Exception during remove:', error)
      setError('Failed to remove product from catalog')
      console.log('=== REMOVE EXCEPTION ===')
      throw error // Re-throw to be caught by onClick handler
    }
    console.log('=== REMOVE PRODUCT COMPLETED ===')
  }

  const handleAddProduct = async () => {
    try {
      console.log('Adding product to catalog:', { catalogId, productId: productForm.product_id })
      
      const requestData = {
        catalogId: catalogId,
        productId: productForm.product_id,
        isActive: productForm.is_available !== false // Default to true unless explicitly false
      }
      
      const response = await fetch(`/api/catalogproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Product added successfully:', result)
        setShowAddProductModal(false)
        resetProductForm()
        
        // Refresh both lists after successful add
        try {
          await loadCatalogProducts()
          await loadAvailableProducts()
          console.log('Lists refreshed successfully after add')
        } catch (refreshError) {
          console.error('Error refreshing after add:', refreshError)
        }
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        setError(error.error || 'Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      setError('Failed to add product')
    }
  }

  const handleEditProduct = async () => {
    try {
      console.log('💾 === SAVE OPERATION STARTED ===')
      console.log('📦 Selected product:', selectedProduct)
      console.log('📝 Form state at save time:', productForm)
      
      // Send all editable fields to the API based on pricing mode
      const requestData = {
        isActive: productForm.is_available,
        // Explicitly set override price or null based on pricing mode
        overridePrice: productForm.pricing_mode === 'override' ? 
          (productForm.override_base_price ? parseFloat(productForm.override_base_price) : null) : null,
        // Explicitly set discount percentage or 0 based on pricing mode  
        discountPercentage: productForm.pricing_mode === 'discount' ? 
          (productForm.discount_percentage ? parseFloat(productForm.discount_percentage) : 0) : 0
      }
      
      console.log('Request data being sent:', requestData)
      console.log('API endpoint:', `/api/catalogproduct/${selectedProduct.id}`)
      
      const response = await fetch(`/api/catalogproduct/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      console.log('Edit response status:', response.status)
      console.log('Edit response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Product updated successfully:', result)
        
        // Immediately update the local state with the edited values for instant feedback
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === selectedProduct.id 
              ? {
                  ...p,
                  isActive: productForm.is_available,
                  overridePrice: productForm.pricing_mode === 'override' ? 
                    (productForm.override_base_price ? parseFloat(productForm.override_base_price) : null) : null,
                  discountPercentage: productForm.pricing_mode === 'discount' ? 
                    (productForm.discount_percentage ? parseFloat(productForm.discount_percentage) : 0) : 0
                }
              : p
          )
        )
        
        setShowEditProductModal(false)
        setSelectedProduct(null)
        resetProductForm()
        
        // Refresh catalog products after successful edit (for server consistency)
        console.log('=== STARTING POST-EDIT REFRESH ===')
        try {
          await loadCatalogProducts()
          console.log('Catalog refreshed successfully after edit')
          console.log('=== EDIT REFRESH COMPLETED ===')
        } catch (refreshError) {
          console.error('Error refreshing catalog after edit:', refreshError)
          console.log('=== EDIT REFRESH FAILED ===')
          // If refresh fails, revert to server state
          await loadCatalogProducts()
        }
      } else {
        let errorMessage = 'Failed to update product'
        try {
          const error = await response.json()
          console.error('Edit error response:', error)
          errorMessage = error.error || error.message || errorMessage
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON')
          const textError = await response.text()
          console.error('Raw error response:', textError)
          errorMessage = `HTTP ${response.status}: ${textError || 'Unknown error'}`
        }
        setError(errorMessage)
        console.log('=== SAVE FAILED ===')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      setError('Failed to update product')
    }
  }

  const handleRemoveProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the catalog?')) {
      return
    }

    try {
      const response = await fetch(`/api/catalogproduct/catalog/${catalogId}/product/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        try {
          await loadCatalogProducts()
          console.log('Catalog refreshed successfully after remove')
        } catch (refreshError) {
          console.error('Error refreshing after remove:', refreshError)
        }
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to remove product')
      }
    } catch (error) {
      console.error('Error removing product:', error)
      setError('Failed to remove product')
    }
  }

  const handleProductSelection = (product) => {
    // Auto-populate form fields with sensible defaults from the selected product
    setProductForm(prevForm => ({
      ...prevForm,
      product_id: product.id,
      // Default custom name to the original product name
      custom_name: product.name || '',
      // Default local SKU to the original SKU
      local_sku_code: product.sku || '',
      // Default discount to 0% 
      discount_percentage: '0',
      // Default override price to the product's base price
      override_base_price: product.basePrice ? product.basePrice.toString() : '',
      // Keep other existing form values for availability, etc.
      is_available: prevForm.is_available,
      is_featured: prevForm.is_featured,
      minimum_quantity: prevForm.minimum_quantity,
      maximum_quantity: prevForm.maximum_quantity,
      display_order: prevForm.display_order,
      fulfillment_method: prevForm.fulfillment_method,
      delivery_timeframe: prevForm.delivery_timeframe,
      support_level: prevForm.support_level,
      export_classification: prevForm.export_classification,
      regulatory_notes: prevForm.regulatory_notes,
      requires_approval: prevForm.requires_approval,
      custom_description: prevForm.custom_description
    }))
  }

  const openAddProductModal = () => {
    resetProductForm()
    setShowAddProductModal(true)
    setAvailablePage(1)
    loadAvailableProducts()
  }

  const openEditProductModal = (product) => {
    console.log('🎯 === CATALOG PRODUCT EDIT MODAL OPENING ===')
    console.log('📦 Product to edit:', product)
    console.log('🔑 Can edit catalogs?', canEditCatalogs())
    setSelectedProduct(product)
    
    // Set default values and determine pricing mode
    const defaultOverridePrice = product.overridePrice || 0
    const defaultDiscount = product.discountPercentage || 0
    
    // Determine pricing mode based on existing values
    const pricingMode = defaultOverridePrice > 0 ? 'override' : 'discount'
    
    setProductForm({
      product_id: product.productId,
      is_available: product.isActive, // Use isActive from API response
      override_base_price: pricingMode === 'override' ? defaultOverridePrice.toString() : '',
      discount_percentage: pricingMode === 'discount' ? defaultDiscount.toString() : '0',
      pricing_mode: pricingMode,
      // Keep minimal form fields for pricing-focused editing
      is_featured: product.isFeatured || false,
      minimum_quantity: product.minimumQuantity || 1,
      maximum_quantity: product.maximumQuantity || '',
      display_order: product.displayOrder || 0,
      fulfillment_method: product.fulfillmentMethod || 'standard',
      delivery_timeframe: product.deliveryTimeframe || '',
      support_level: product.supportLevel || 'standard',
      export_classification: product.exportClassification || '',
      regulatory_notes: product.regulatoryNotes || '',
      requires_approval: product.requiresApproval || false
    })
    console.log('🎯 === SHOWING EDIT MODAL ===')
    console.log('⚙️ Default pricing mode:', pricingMode)
    console.log('💰 Override price:', defaultOverridePrice, 'Discount:', defaultDiscount)
    setShowEditProductModal(true)
  }

  const resetProductForm = () => {
    setProductForm({
      product_id: '',
      is_available: true,
      is_featured: false,
      custom_name: '',
      custom_description: '',
      override_base_price: '',
      discount_percentage: '',
      pricing_mode: 'discount',
      minimum_quantity: 1,
      maximum_quantity: '',
      display_order: 0,
      local_sku_code: '',
      fulfillment_method: 'standard',
      delivery_timeframe: '',
      support_level: 'standard',
      export_classification: '',
      regulatory_notes: '',
      requires_approval: false
    })
  }

  // Open locale workflow modal for a specific product
  const openLocaleWorkflowModal = (product) => {
    setSelectedProduct(product)
    setShowLocaleWorkflowModal(true)
  }

  // Handle workflow start - expand the product row to show real-time progress
  const handleWorkflowStarted = (product, workflowResult) => {
    console.log('🚀 Workflow started for product:', product, 'Result:', workflowResult)
    
    // Immediately expand the product row to show localization progress
    // Use product.id to match the LocalizedContentRow isExpanded check
    setExpandedRows(prev => new Set([...prev, product.id]))
    
    // Force reload the entire products list to refresh all workflow status
    // This is a more reliable approach than trying to match exact catalog/product IDs
    console.log('🚀 Product row expanded - triggering full page refresh to catch new workflows')
    setTimeout(() => {
      console.log('🚀 Executing products reload to refresh workflow status')
      loadProducts() // This will refresh all product data including workflow status
    }, 1000)
  }

  // Handle workflow completion
  const handleWorkflowComplete = (progressData) => {
    console.log('Workflow completed:', progressData)
    // Refresh the products list to show updated workflow status
    loadCatalogProducts()
    // Could show a success notification here
  }

  const clearFilters = () => {
    setFilters({
      availability: 'all',
      featured: 'all',
      class: '',
      type: '',
      support_level: 'all'
    })
  }

  const hasActiveFilters = () => {
    return filters.availability !== 'all' || 
           filters.featured !== 'all' || 
           filters.class || 
           filters.type || 
           filters.support_level !== 'all'
  }

  // Handle expandable rows for localized content
  const toggleExpandedRow = (productId, isExpanded) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (isExpanded) {
        newSet.add(productId)
      } else {
        newSet.delete(productId)
      }
      return newSet
    })
  }


  // Get localization count for display (with lazy loading)
  const getLocalizationCount = (productId) => {
    const cachedCount = localizationCounts.get(productId)
    if (cachedCount !== undefined) {
      return cachedCount
    }
    
    // Fetch count if not already cached
    fetchLocalizationCount(productId)
    return 0 // Return 0 while loading
  }

  if (!canViewCatalogs() || (region && !hasRegionAccess(region.toUpperCase()))) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to manage catalogs.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !catalog) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <Link 
            to="/catalogs" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Catalogs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/catalogs" 
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {catalog?.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {catalog?.code} • {catalog?.channel_name} • {catalog?.currency_code}
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Dual-Pane Catalog Management
          </div>
        </div>
        
        {catalog && (
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              catalog.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {catalog.status}
            </span>
            <span className="flex items-center">
              <TagIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
              {totalProducts} products
            </span>
            {catalog.effective_from && (
              <span>
                Effective from: {new Date(catalog.effective_from).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>


      {/* Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Panel - Available Products */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col min-h-0">
          <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <CubeIcon className="h-5 w-5 mr-2 text-green-600" />
                Available Products
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {availableProducts.length} available
              </span>
            </div>
            {/* Available Products Search */}
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search available products..."
                  value={availableSearchQuery}
                  onChange={(e) => {
                    setAvailableSearchQuery(e.target.value)
                    setAvailablePage(1)
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Available Products List */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{maxHeight: 'calc(100vh - 400px)'}}>
            {availableProducts.length === 0 ? (
              <div className="text-center py-12">
                <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All products are already in this catalog.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-8">
                      {/* Icon */}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-24">
                      SKU
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-40">
                      Name
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-20">
                      Price
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-16">
                      Add
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {availableProducts.map((product, index) => (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    }`}>
                      <td className="px-2 py-2 w-8">
                        <CubeIcon className="h-5 w-5 text-blue-500" />
                      </td>
                      <td className="px-2 py-2 text-sm font-mono text-gray-900 dark:text-white w-24">
                        <div className="truncate" title={product.sku}>
                          {truncateText(product.sku)}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm font-medium text-gray-900 dark:text-white">
                        <div title={product.name}>
                          {truncateText(product.name)}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm font-medium text-gray-900 dark:text-white text-right w-20">
                        {formatPrice(product.basePrice || 0)}
                      </td>
                      <td className="px-2 py-2 text-center w-16">
                        {canEditCatalogs() && (
                          <button
                            onClick={() => handleQuickAddProduct(product)}
                            className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Quick add to catalog"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Available Products Pagination */}
          {availableTotalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {availablePage} of {availableTotalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAvailablePage(Math.max(1, availablePage - 1))}
                    disabled={availablePage === 1}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setAvailablePage(Math.min(availableTotalPages, availablePage + 1))}
                    disabled={availablePage === availableTotalPages}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Catalog Products */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col min-h-0">
          
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-blue-600" />
                Catalog Products
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {totalProducts} products
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none ${
                    hasActiveFilters() ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                  Filter
                  {hasActiveFilters() && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {Object.values(filters).filter(v => v && v !== 'all').length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            {/* Catalog Products Search */}
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Availability
                    </label>
                    <select
                      value={filters.availability}
                      onChange={(e) => setFilters({...filters, availability: e.target.value})}
                      className="block w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Featured
                    </label>
                    <select
                      value={filters.featured}
                      onChange={(e) => setFilters({...filters, featured: e.target.value})}
                      className="block w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All</option>
                      <option value="featured">Featured</option>
                      <option value="not_featured">Not Featured</option>
                    </select>
                  </div>
                </div>
                {hasActiveFilters() && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Catalog Products List */}
          <div className="flex-1 overflow-y-scroll min-h-0" style={{maxHeight: 'calc(100vh - 400px)'}}>
            {productsLoading ? (
              <div className="px-4 py-8">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || hasActiveFilters() 
                    ? 'Try adjusting your search or filters.'
                    : 'This catalog doesn\'t have any products yet. Use the left panel to add products.'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-12">
                      Remove
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-8">
                      {/* Icon */}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-24">
                      SKU
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-40">
                      Name
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-20">
                      Base
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-24">
                      Price Type
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-20">
                      Cat. Price
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-16">
                      Status
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider w-20">
                      Localization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product, index) => (
                    <React.Fragment key={product.id}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                        }`}
                        onDoubleClick={() => canEditCatalogs() && openEditProductModal(product)}
                        title="🎯 Double-click this PRODUCT row to edit pricing and availability"
                      >
                        <td className="px-2 py-2 w-12">
                          {canEditCatalogs() ? (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                console.log('Remove button clicked for product:', product.productId)
                                try {
                                  await handleQuickRemoveProduct(product)
                                } catch (error) {
                                  console.error('Error in remove button handler:', error)
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Remove from catalog"
                            >
                              <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No edit permission</span>
                          )}
                        </td>
                        <td className="px-2 py-2 w-8">
                          <CubeIcon className="h-5 w-5 text-blue-500" />
                        </td>
                        <td className="px-2 py-2 text-sm font-mono text-gray-900 dark:text-white w-24">
                          <div className="truncate" title={product.productSku || product.skuCode}>
                            {truncateText(product.productSku) || truncateText(product.skuCode)}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          <div title={product.productName || product.name}>
                            {truncateText(product.productName || product.name)}
                            {product.isFeatured && (
                              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                ★
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right text-sm text-gray-700 dark:text-gray-300 w-20">
                          {formatPrice(product.productBasePrice)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm text-gray-700 dark:text-gray-300 w-20">
                          {(() => {
                            const overridePrice = product.overridePrice || 0
                            const discountPercentage = product.discountPercentage || 0
                            
                            if (overridePrice > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                  Override
                                </span>
                              )
                            } else if (discountPercentage > 0) {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                  {discountPercentage}% Disc.
                                </span>
                              )
                            } else {
                              return (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Base
                                </span>
                              )
                            }
                          })()}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-900 dark:text-white text-right w-20">
                          {(() => {
                            const basePrice = product.productBasePrice || product.basePrice || 0
                            const overridePrice = product.overridePrice || 0
                            const discountPercentage = product.discountPercentage || 0
                            
                            // Determine pricing mode - override takes precedence if it exists
                            const pricingMode = overridePrice > 0 ? 'override' : 'discount'
                            const finalPrice = calculateFinalPrice(basePrice, overridePrice, discountPercentage, pricingMode)
                            
                            return formatPrice(finalPrice)
                          })()}
                        </td>
                        <td className="px-2 py-2 text-center w-16">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="flex px-2 py-2 text-center w-20">
                          {canEditCatalogs() && (
                            <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openLocaleWorkflowModal(product)
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="Configure locale-specific pricing and content"
                            >
                              <GlobeAmericasIcon className="h-3 w-3 mr-1" />
                              Localize
                            </button>
                            &nbsp;
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpandedRow(product.id, !expandedRows.has(product.id))
                              }}
                              className="inline-flex items-center pl-2 pr-1 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                              title="Show/hide localization information">
                              {getLocalizationCount(product.id)} {expandedRows.has(product.id) ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </button>
                            </>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expandable Localized Content Row */}
                      <LocalizedContentRow
                        catalogProduct={product}
                        isExpanded={expandedRows.has(product.id)}
                        onToggle={(isExpanded) => toggleExpandedRow(product.id, isExpanded)}
                      />
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Catalog Products Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalProducts)} of {totalProducts}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex-shrink-0">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Add Product to {catalog?.name}
                </h3>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Available Products Search */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search available products..."
                    value={availableSearchQuery}
                    onChange={(e) => {
                      setAvailableSearchQuery(e.target.value)
                      setAvailablePage(1)
                    }}
                    onKeyUp={() => loadAvailableProducts()}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Available Products List */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Product
                </h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                  {availableProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No available products found.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {availableProducts.map((product) => (
                        <div 
                          key={product.id} 
                          className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            productForm.product_id === product.id ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : ''
                          }`}
                          onClick={() => handleProductSelection(product)}
                        >
                          <input
                            type="radio"
                            name="selectedProduct"
                            checked={productForm.product_id === product.id}
                            onChange={() => handleProductSelection(product)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              SKU: {product.sku} • {formatPrice(product.basePrice || 0)} • {product.type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Available Products Pagination */}
                {availableTotalPages > 1 && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Page {availablePage} of {availableTotalPages}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setAvailablePage(Math.max(1, availablePage - 1))
                          loadAvailableProducts()
                        }}
                        disabled={availablePage === 1}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setAvailablePage(Math.min(availableTotalPages, availablePage + 1))
                          loadAvailableProducts()
                        }}
                        disabled={availablePage === availableTotalPages}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Configuration Form */}
              {productForm.product_id && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Product Configuration
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Form fields have been automatically filled with product defaults. You can modify any values as needed.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Custom Name
                        {productForm.custom_name && (
                          <span className="ml-1 text-green-600 text-xs">✓ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={productForm.custom_name}
                        onChange={(e) => setProductForm({...productForm, custom_name: e.target.value})}
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter custom product name..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Local SKU
                        {productForm.local_sku_code && (
                          <span className="ml-1 text-green-600 text-xs">✓ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={productForm.local_sku_code}
                        onChange={(e) => setProductForm({...productForm, local_sku_code: e.target.value})}
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter local SKU..."
                      />
                    </div>
                    {/* Pricing Mode Toggle */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pricing Method
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pricingMode"
                            value="discount"
                            checked={productForm.pricing_mode === 'discount'}
                            onChange={(e) => handlePricingModeChange(e.target.value)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Discount %</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="pricingMode"
                            value="override"
                            checked={productForm.pricing_mode === 'override'}
                            onChange={(e) => handlePricingModeChange(e.target.value)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Override Price</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Discount %
                        {productForm.discount_percentage === '0' && (
                          <span className="ml-1 text-green-600 text-xs">✓ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={productForm.discount_percentage}
                        onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                        disabled={productForm.pricing_mode !== 'discount'}
                        className={`mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500 ${productForm.pricing_mode !== 'discount' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Override Price
                        {productForm.override_base_price && (
                          <span className="ml-1 text-green-600 text-xs">✓ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.override_base_price}
                        onChange={(e) => setProductForm({...productForm, override_base_price: e.target.value})}
                        disabled={productForm.pricing_mode !== 'override'}
                        className={`mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500 ${productForm.pricing_mode !== 'override' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Enter override price..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={productForm.minimum_quantity}
                        onChange={(e) => setProductForm({...productForm, minimum_quantity: parseInt(e.target.value) || 1})}
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Support Level
                      </label>
                      <select
                        value={productForm.support_level}
                        onChange={(e) => setProductForm({...productForm, support_level: e.target.value})}
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="available"
                        checked={productForm.is_available}
                        onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="available" className="ml-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Available
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={productForm.is_featured}
                        onChange={(e) => setProductForm({...productForm, is_featured: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="featured" className="ml-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Add Product button clicked');
                    console.log('Product form state:', productForm);
                    console.log('Catalog ID:', catalogId);
                    handleAddProduct();
                  }}
                  disabled={!productForm.product_id}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Edit Catalog Pricing: {selectedProduct.productName || selectedProduct.name}
                </h3>
                <button
                  onClick={() => setShowEditProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Product Information (Read-Only) */}
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Product Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedProduct.productName || selectedProduct.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedProduct.productSku || selectedProduct.sku}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Base Price:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{formatPrice(selectedProduct.productBasePrice || selectedProduct.basePrice || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Product ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">{selectedProduct.productId}</span>
                  </div>
                </div>
              </div>

              {/* Catalog Pricing Settings (Editable) */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600 mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Catalog Pricing Settings</h4>
                
                {/* Pricing Mode Toggle */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Pricing Method
                  </label>
                  <div className="flex space-x-6">
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editPricingMode"
                        value="override"
                        checked={productForm.pricing_mode === 'override'}
                        onChange={(e) => handlePricingModeChange(e.target.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Override Price</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editPricingMode"
                        value="discount"
                        checked={productForm.pricing_mode === 'discount'}
                        onChange={(e) => handlePricingModeChange(e.target.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Discount Percentage</span>
                    </label>
                    
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Override Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.override_base_price}
                      onChange={(e) => setProductForm({...productForm, override_base_price: e.target.value})}
                      disabled={productForm.pricing_mode !== 'override'}
                      className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 ${productForm.pricing_mode !== 'override' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter override price"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {productForm.pricing_mode === 'override' 
                        ? `Override the base price of ${formatPrice(selectedProduct.productBasePrice || selectedProduct.basePrice || 0)}` 
                        : 'Switch to Override mode to set custom price'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={productForm.discount_percentage}
                      onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                      disabled={productForm.pricing_mode !== 'discount'}
                      className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500 ${productForm.pricing_mode !== 'discount' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {productForm.pricing_mode === 'discount' 
                        ? `Discount applied to base price of ${formatPrice(selectedProduct.productBasePrice || selectedProduct.basePrice || 0)}`
                        : 'Switch to Discount mode to set percentage discount'
                      }
                    </p>
                  </div>
                </div>

                {/* Price Preview */}
                {((productForm.pricing_mode === 'override' && productForm.override_base_price) || 
                  (productForm.pricing_mode === 'discount' && productForm.discount_percentage > 0)) && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Price Preview</h5>
                    <div className="text-sm">
                      {(() => {
                        const basePrice = selectedProduct.productBasePrice || selectedProduct.basePrice || 0
                        const finalPrice = calculateFinalPrice(
                          basePrice,
                          productForm.override_base_price,
                          productForm.discount_percentage,
                          productForm.pricing_mode
                        )
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                              <span className="text-gray-600 dark:text-gray-400">{formatPrice(basePrice)}</span>
                            </div>
                            
                            {productForm.pricing_mode === 'override' && productForm.override_base_price && (
                              <div className="flex items-center justify-between">
                                <span className="text-blue-600 dark:text-blue-400">Override Price:</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {formatPrice(productForm.override_base_price)}
                                </span>
                              </div>
                            )}
                            
                            {productForm.pricing_mode === 'discount' && productForm.discount_percentage > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-red-600 dark:text-red-400">Discount ({productForm.discount_percentage}%):</span>
                                <span className="text-red-600 dark:text-red-400">
                                  -{formatPrice(parseFloat(basePrice) * parseFloat(productForm.discount_percentage) / 100)}
                                </span>
                              </div>
                            )}
                            
                            <div className="border-t border-green-200 dark:border-green-700 mt-2 pt-2 flex items-center justify-between">
                              <span className="font-medium text-green-800 dark:text-green-200">Final Price:</span>
                              <span className="font-bold text-lg text-green-800 dark:text-green-200">
                                {formatPrice(finalPrice)}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Catalog Status Settings */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Catalog Status</h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-available"
                    checked={productForm.is_available}
                    onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-available" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product is active in this catalog
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Inactive products remain in the catalog but are not shown to customers.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditProductModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProduct}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700"
                >
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locale Workflow Modal */}
      <LocaleWorkflowModal
        isOpen={showLocaleWorkflowModal}
        onClose={() => {
          setShowLocaleWorkflowModal(false)
          setSelectedProduct(null)
        }}
        catalogProduct={selectedProduct}
        catalog={catalog}
        onWorkflowComplete={handleWorkflowComplete}
        onWorkflowStarted={handleWorkflowStarted}
      />
    </div>
  )
}

export default CatalogDetailPage