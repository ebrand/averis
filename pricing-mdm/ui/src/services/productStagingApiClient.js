// API Client for Product Staging Backend (Read-only product data)
// This client is specifically designed to consume data from the Product Staging API (port 6002)
// which provides read-optimized product data for consumer systems

const PRODUCT_STAGING_API_BASE_URL = import.meta.env.VITE_PRODUCT_STAGING_API_BASE_URL || '/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class ProductStagingApiClient {
  constructor(baseURL = PRODUCT_STAGING_API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  // Set authentication token for requests
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`
    } else {
      delete this.defaultHeaders['Authorization']
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: response.statusText }
        }
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      // Handle empty responses (e.g., DELETE requests)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`Network error: ${error.message}`, 0, { originalError: error })
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }
}

// Product Staging-specific API methods (read-only)
class ProductStagingApi {
  constructor(apiClient) {
    this.client = apiClient
  }

  // Get all staged products with filtering and pagination
  async getProducts(params = {}) {
    return this.client.get('/products', params)
  }

  // Get staged product by ID
  async getProduct(id) {
    return this.client.get(`/products/${id}`)
  }

  // Get product analytics/summary
  async getProductAnalytics() {
    return this.client.get('/products/analytics/summary')
  }

  // Search staged products
  async searchProducts(query, filters = {}) {
    return this.client.get('/products', { 
      search: query, 
      ...filters 
    })
  }

  // Health check endpoint
  async healthCheck() {
    return this.client.get('/health')
  }
}

// Create singleton instances
const productStagingApiClient = new ProductStagingApiClient()
const productStagingApi = new ProductStagingApi(productStagingApiClient)

// Helper function to transform backend product data to frontend format
// This matches the format expected by the Pricing MDM UI
export const transformProductFromStagingApi = (apiProduct) => {
  return {
    id: apiProduct.id,
    skuCode: apiProduct.sku || apiProduct.skuCode,
    name: apiProduct.name,
    displayName: apiProduct.displayName || apiProduct.name,
    description: apiProduct.description || '',
    license_description: apiProduct.licenseDescription || '',
    type: apiProduct.type || apiProduct.category,
    subType: apiProduct.subType || '',
    class: apiProduct.class || apiProduct.category,
    categorization: apiProduct.categorization || [apiProduct.category || 'Uncategorized'],
    basePrice: apiProduct.base_price || apiProduct.basePrice || apiProduct.listPrice || apiProduct.costBasis || 0,
    listPrice: apiProduct.listPrice || 0,
    costPrice: apiProduct.cost_price || apiProduct.costPrice || 0,
    catalogCount: apiProduct.catalog_count || 0,
    availableFlag: apiProduct.available_flag !== undefined ? apiProduct.available_flag : (apiProduct.availabilityStatus === 'available'),
    webDisplayFlag: apiProduct.web_display_flag !== undefined ? apiProduct.web_display_flag : true,
    inactiveFlag: apiProduct.inactive_flag || (apiProduct.lifecycleStatus === 'inactive') || !apiProduct.isActive,
    includeChildrenFlag: apiProduct.include_children_flag || false,
    licenseRequiredFlag: apiProduct.license_required_flag !== undefined ? apiProduct.license_required_flag : false,
    licenseCount: apiProduct.licenseCount || 0,
    licenseKeyType: apiProduct.licenseKeyType || '',
    seatBasedPricingFlag: apiProduct.seat_based_pricing_flag !== undefined ? apiProduct.seat_based_pricing_flag : false,
    contractItemFlag: apiProduct.contract_item_flag !== undefined ? apiProduct.contract_item_flag : false,
    createdAt: apiProduct.created_at || apiProduct.createdAt,
    updatedAt: apiProduct.updated_at || apiProduct.updatedAt,
    status: apiProduct.status || 'active',
    // Add other fields as needed for the UI
    revenueCategory: apiProduct.revenueCategory || '',
    changeCode: apiProduct.changeCode || '',
    upgradeType: apiProduct.upgradeType || '',
    baseProduct: apiProduct.baseProduct || '',
    subsidiary: apiProduct.subsidiary || '',
    // Lifecycle and availability status
    availabilityStatus: apiProduct.availabilityStatus,
    lifecycleStatus: apiProduct.lifecycleStatus,
    isActive: apiProduct.isActive !== undefined ? apiProduct.isActive : (apiProduct.status === 'active')
  }
}

// Utility functions for common Product Staging operations
export const productStagingUtils = {
  // Get products with search and filters
  async getFilteredProducts(searchQuery = '', filters = {}, page = 1, limit = 20) {
    try {
      const params = {
        search: searchQuery,
        page,
        limit,
        ...filters
      }
      
      console.log('🔍 Fetching products from Product Staging API:', params)
      const response = await productStagingApi.getProducts(params)
      
      // Handle different response formats from the API
      let products = []
      let pagination = { page: 1, limit: 20, total: 0, pages: 0 }
      
      if (response.products && Array.isArray(response.products)) {
        // Standard format with products array and pagination
        products = response.products.map(transformProductFromStagingApi)
        pagination = response.pagination || pagination
      } else if (response.data && Array.isArray(response.data)) {
        // Alternative format with data array
        products = response.data.map(transformProductFromStagingApi)
        pagination = response.meta || response.pagination || pagination
      } else if (Array.isArray(response)) {
        // Direct array response
        products = response.map(transformProductFromStagingApi)
        pagination = {
          page: parseInt(page),
          limit: parseInt(limit),
          total: response.length,
          pages: Math.ceil(response.length / limit)
        }
      } else {
        console.warn('Unexpected response format from Product Staging API:', response)
      }
      
      return {
        products,
        pagination,
        error: null
      }
    } catch (error) {
      console.error('Error fetching products from Product Staging API:', error)
      return {
        products: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        error: error.message || 'Failed to fetch products from staging'
      }
    }
  },

  // Get product statistics
  async getProductStats() {
    try {
      console.log('📊 Fetching product stats from Product Staging API')
      
      // Try the health endpoint first which includes stats
      try {
        const healthResponse = await productStagingApi.healthCheck()
        if (healthResponse.stats) {
          const stats = healthResponse.stats
          return {
            total: stats.TotalProducts || stats.total || 0,
            available: stats.AvailableProducts || stats.available || 0,
            inactive: (stats.TotalProducts || 0) - (stats.ActiveProducts || 0),
            webDisplayed: stats.WebDisplayProducts || stats.webDisplayed || 0,
            source: 'staging-api',
            error: null
          }
        }
      } catch (healthError) {
        console.warn('Health endpoint failed, trying analytics endpoint:', healthError.message)
      }

      // Fallback to analytics endpoint
      try {
        const analyticsResponse = await productStagingApi.getProductAnalytics()
        return {
          total: analyticsResponse.total || 0,
          available: analyticsResponse.available || 0,
          inactive: analyticsResponse.inactive || 0,
          webDisplayed: analyticsResponse.webDisplayed || 0,
          source: 'staging-api',
          error: null
        }
      } catch (analyticsError) {
        console.warn('Analytics endpoint also failed:', analyticsError.message)
      }

      // Final fallback: get a sample of products and calculate basic stats
      const result = await this.getFilteredProducts('', {}, 1, 1000) // Get a large batch
      if (result.error) {
        throw new Error(result.error)
      }
      
      const products = result.products || []
      const total = result.pagination?.total || products.length
      const available = products.filter(p => p.availableFlag || p.available_flag).length
      const inactive = products.filter(p => p.inactiveFlag || p.inactive_flag || p.status !== 'active').length
      const webDisplayed = products.filter(p => p.webDisplayFlag || p.web_display_flag).length
      
      return {
        total,
        available,
        inactive,
        webDisplayed,
        source: 'staging-api',
        error: null
      }
    } catch (error) {
      console.error('Error fetching product stats from Product Staging API:', error)
      return {
        total: 0,
        available: 0,
        inactive: 0,
        webDisplayed: 0,
        source: 'staging-api',
        error: error.message || 'Failed to fetch product statistics from staging'
      }
    }
  },

  // Get single product by ID
  async getProduct(id) {
    try {
      console.log(`🔍 Fetching product ${id} from Product Staging API`)
      const product = await productStagingApi.getProduct(id)
      return {
        product: transformProductFromStagingApi(product),
        error: null
      }
    } catch (error) {
      console.error(`Error fetching product ${id} from Product Staging API:`, error)
      return {
        product: null,
        error: error.message || 'Failed to fetch product from staging'
      }
    }
  },

  // Test API connection
  async testConnection() {
    try {
      console.log('🔍 Testing Product Staging API connection')
      // Test with direct fetch since the health endpoint might not be at /api/health
      const response = await fetch('http://localhost:6002/health')
      if (response.ok) {
        console.log('✅ Product Staging API is available')
        return true
      } else {
        console.warn('⚠️ Product Staging API health check failed with status:', response.status)
        return false
      }
    } catch (error) {
      console.warn('⚠️ Product Staging API connection test failed:', error.message)
      return false
    }
  }
}

// Export the main instances and utilities
export { ProductStagingApiClient, ProductStagingApi, ApiError, productStagingApiClient, productStagingApi }
export default productStagingApi