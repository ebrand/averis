// API Client for Product MDM Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
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

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// Product-specific API methods
class ProductApi {
  constructor(apiClient) {
    this.client = apiClient
  }

  // Get all products with filtering and pagination
  async getProducts(params = {}) {
    return this.client.get('/products', params)
  }

  // Get product by ID
  async getProduct(id) {
    return this.client.get(`/products/${id}`)
  }

  // Create new product
  async createProduct(productData) {
    return this.client.post('/products', productData)
  }

  // Update product
  async updateProduct(id, productData) {
    return this.client.put(`/products/${id}`, productData)
  }

  // Soft delete product (set inactive)
  async deleteProduct(id) {
    return this.client.delete(`/products/${id}`)
  }

  // Get product analytics/summary
  async getProductAnalytics() {
    return this.client.get('/products/analytics/summary')
  }

  // Search products
  async searchProducts(query, filters = {}) {
    return this.client.get('/products', { 
      search: query, 
      ...filters 
    })
  }
}

// User-specific API methods
class UserApi {
  constructor(apiClient) {
    this.client = apiClient
  }

  // Get all users with filtering and pagination
  async getUsers(params = {}) {
    return this.client.get('/users', params)
  }

  // Get user by ID
  async getUser(id) {
    return this.client.get(`/users/${id}`)
  }

  // Create new user
  async createUser(userData) {
    return this.client.post('/users', userData)
  }

  // Update user
  async updateUser(id, userData) {
    return this.client.put(`/users/${id}`, userData)
  }

  // Delete user (soft delete)
  async deleteUser(id, updatedBy = null) {
    return this.client.request(`/users/${id}`, { 
      method: 'DELETE',
      body: JSON.stringify({ updated_by: updatedBy })
    })
  }

  // Activate user
  async activateUser(id, updatedBy = null) {
    return this.client.put(`/users/${id}/activate`, { updated_by: updatedBy })
  }

  // Update last login
  async updateLastLogin(id) {
    return this.client.put(`/users/${id}/last-login`)
  }

  // Get user statistics
  async getUserAnalytics() {
    return this.client.get('/users/analytics/summary')
  }
}

// Create singleton instances
const apiClient = new ApiClient()
const productApi = new ProductApi(apiClient)
const userApi = new UserApi(apiClient)

// Helper function to transform backend product data to frontend format
export const transformProductFromApi = (apiProduct) => {
  return {
    id: apiProduct.id,
    skuCode: apiProduct.skuCode,
    name: apiProduct.name,
    displayName: apiProduct.displayName || apiProduct.name,
    description: apiProduct.description || '',
    license_description: apiProduct.licenseDescription || '',
    type: apiProduct.type || apiProduct.category,
    subType: apiProduct.subType || '',
    class: apiProduct.class || apiProduct.category,
    categorization: apiProduct.categorization || [apiProduct.category || 'Uncategorized'],
    basePrice: apiProduct.basePrice || apiProduct.listPrice || apiProduct.costBasis || 0,
    listPrice: apiProduct.listPrice || 0,
    costPrice: apiProduct.costPrice || 0,
    catalogCount: apiProduct.catalog_count || 0,
    availableFlag: apiProduct.availableFlag || (apiProduct.availabilityStatus === 'available'),
    webDisplayFlag: apiProduct.webDisplayFlag !== undefined ? apiProduct.webDisplayFlag : true,
    inactiveFlag: apiProduct.inactiveFlag || (apiProduct.lifecycleStatus === 'inactive') || !apiProduct.isActive,
    includeChildrenFlag: apiProduct.includeChildrenFlag || false,
    licenseRequiredFlag: apiProduct.licenseRequiredFlag || false,
    licenseCount: apiProduct.licenseCount || 0,
    licenseKeyType: apiProduct.licenseKeyType || '',
    seatBasedPricingFlag: apiProduct.seatBasedPricingFlag || false,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
    // Add other fields as needed for the UI
    revenueCategory: apiProduct.revenueCategory || '',
    changeCode: apiProduct.changeCode || '',
    upgradeType: apiProduct.upgradeType || '',
    baseProduct: apiProduct.baseProduct || '',
    subsidiary: apiProduct.subsidiary || '',
    // Lifecycle and availability status
    availabilityStatus: apiProduct.availabilityStatus,
    lifecycleStatus: apiProduct.lifecycleStatus,
    isActive: apiProduct.isActive
  }
}

// Helper function to transform frontend product data to backend format
export const transformProductToApi = (uiProduct) => {
  return {
    id: uiProduct.id,
    skuCode: uiProduct.sku_code,
    name: uiProduct.name,
    displayName: uiProduct.display_name,
    description: uiProduct.description,
    licenseDescription: uiProduct.license_description,
    type: uiProduct.type,
    subType: uiProduct.sub_type,
    class: uiProduct.class,
    categorization: uiProduct.categorization || [],
    basePrice: parseFloat(uiProduct.base_price) || 0,
    availableFlag: uiProduct.available_flag,
    webDisplayFlag: uiProduct.web_display_flag,
    inactiveFlag: uiProduct.inactive_flag,
    includeChildrenFlag: uiProduct.include_children_flag,
    licenseRequiredFlag: uiProduct.license_required_flag,
    licenseCount: parseInt(uiProduct.license_count) || 0,
    licenseKeyType: uiProduct.license_key_type,
    seatBasedPricingFlag: uiProduct.seat_based_pricing_flag,
    // Add required fields with defaults
    revenueCategory: uiProduct.revenue_category || 'Standard',
    changeCode: uiProduct.change_code || 'New',
    upgradeType: uiProduct.upgrade_type || 'None',
    baseProduct: uiProduct.base_product || '',
    subsidiary: uiProduct.subsidiary || 'Main'
  }
}

// Utility functions for common product operations
export const productUtils = {
  // Get products with search and filters
  async getFilteredProducts(searchQuery = '', filters = {}, page = 1, limit = 20) {
    try {
      const params = {
        search: searchQuery,
        page,
        limit,
        ...filters
      }
      
      const response = await productApi.getProducts(params)
      
      return {
        products: response.products.map(transformProductFromApi),
        pagination: response.pagination,
        error: null
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      return {
        products: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        error: error.message || 'Failed to fetch products'
      }
    }
  },

  // Get product statistics
  async getProductStats() {
    try {
      // Get all products and calculate stats from them
      const result = await this.getFilteredProducts('', {}, 1, 1000) // Get a large batch
      if (result.error) {
        throw new Error(result.error)
      }
      
      const products = result.products || []
      const total = result.pagination?.total || products.length
      const available = products.filter(p => p.availableFlag || p.available_flag).length
      const inactive = products.filter(p => p.inactiveFlag || p.inactive_flag).length
      const webDisplayed = products.filter(p => p.webDisplayFlag || p.web_display_flag).length
      
      return {
        total,
        available,
        inactive,
        webDisplayed,
        source: 'api',
        error: null
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
      return {
        total: 0,
        available: 0,
        inactive: 0,
        webDisplayed: 0,
        source: 'api',
        error: error.message || 'Failed to fetch product statistics'
      }
    }
  },

  // Create a new product
  async createProduct(productData) {
    try {
      const apiData = transformProductToApi(productData)
      const newProduct = await productApi.createProduct(apiData)
      return {
        product: transformProductFromApi(newProduct),
        error: null
      }
    } catch (error) {
      console.error('Error creating product:', error)
      return {
        product: null,
        error: error.message || 'Failed to create product'
      }
    }
  },

  // Update an existing product
  async updateProduct(id, productData) {
    try {
      const apiData = transformProductToApi(productData)
      const updatedProduct = await productApi.updateProduct(id, apiData)
      return {
        product: transformProductFromApi(updatedProduct),
        error: null
      }
    } catch (error) {
      console.error('Error updating product:', error)
      return {
        product: null,
        error: error.message || 'Failed to update product'
      }
    }
  }
}

// Utility functions for common user operations
export const userUtils = {
  // Get users with search and filters
  async getFilteredUsers(searchQuery = '', filters = {}, page = 1, limit = 20) {
    try {
      const params = {
        search: searchQuery,
        page,
        limit,
        ...filters
      }
      
      const response = await userApi.getUsers(params)
      
      return {
        users: response.users || [],
        pagination: response.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
        source: response.source || 'api',
        error: null
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return {
        users: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        source: 'api',
        error: error.message || 'Failed to fetch users'
      }
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const stats = await userApi.getUserAnalytics()
      return {
        total: parseInt(stats.total_users) || 0,
        active: parseInt(stats.active_users) || 0,
        inactive: parseInt(stats.inactive_users) || 0,
        pending: parseInt(stats.pending_users) || 0,
        suspended: parseInt(stats.suspended_users) || 0,
        admins: parseInt(stats.admin_users) || 0,
        userAdmins: parseInt(stats.user_admin_users) || 0,
        activeLast30Days: parseInt(stats.active_last_30_days) || 0,
        source: stats.source || 'api',
        error: null
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        admins: 0,
        userAdmins: 0,
        activeLast30Days: 0,
        source: 'api',
        error: error.message || 'Failed to fetch user statistics'
      }
    }
  },

  // Create a new user
  async createUser(userData) {
    try {
      const newUser = await userApi.createUser(userData)
      return {
        user: newUser.user || newUser,
        source: newUser.source || 'api',
        error: null
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return {
        user: null,
        source: 'api',
        error: error.message || 'Failed to create user'
      }
    }
  },

  // Update an existing user
  async updateUser(id, userData) {
    try {
      const updatedUser = await userApi.updateUser(id, userData)
      return {
        user: updatedUser.user || updatedUser,
        source: updatedUser.source || 'api',
        error: null
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return {
        user: null,
        source: 'api',
        error: error.message || 'Failed to update user'
      }
    }
  },

  // Delete a user (soft delete)
  async deleteUser(id, updatedBy = null) {
    try {
      const result = await userApi.deleteUser(id, updatedBy)
      return {
        user: result.user || result,
        message: result.message || 'User deactivated successfully',
        source: result.source || 'api',
        error: null
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        user: null,
        message: null,
        source: 'api',
        error: error.message || 'Failed to delete user'
      }
    }
  }
}

// Export the main instances and utilities
export { ApiClient, ProductApi, UserApi, ApiError, apiClient, productApi, userApi }
export default productApi