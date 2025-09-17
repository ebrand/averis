// API Client for Product MDM Backend - Updated for .NET Services

const PRODUCT_API_BASE_URL = import.meta.env.VITE_PRODUCT_API_BASE_URL || 'http://localhost:6001/api'
const USER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || 'http://localhost:6007/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class ApiClient {
  constructor(baseURL = PRODUCT_API_BASE_URL) {
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
  async updateLastLogin(id, lastLoginAt = null) {
    return this.client.put(`/users/${id}/last-login`, { 
      lastLoginAt: lastLoginAt || new Date().toISOString() 
    })
  }

  // Get user statistics
  async getUserAnalytics() {
    return this.client.get('/users/analytics/summary')
  }
}

// Create singleton instances with appropriate base URLs
const productApiClient = new ApiClient(PRODUCT_API_BASE_URL)
const userApiClient = new ApiClient(USER_API_BASE_URL)
const productApi = new ProductApi(productApiClient)
const userApi = new UserApi(userApiClient)

// Legacy support - use product API client as default
const apiClient = productApiClient

// Helper function to transform simplified API product data to frontend format
export const transformProductFromApi = (apiProduct) => {
  // For the simplified schema, the API already returns camelCase
  // so we can use it directly with minimal transformation
  return {
    // Core Product Information
    id: apiProduct.id,
    sku: apiProduct.sku,
    name: apiProduct.name,
    description: apiProduct.description,
    
    // Product Classification
    type: apiProduct.type,
    categorization: apiProduct.categorization || [],
    
    // Pricing & Financial
    basePrice: apiProduct.basePrice,
    costPrice: apiProduct.costPrice,
    
    // License & Permissions
    licenseRequiredFlag: apiProduct.licenseRequiredFlag,
    
    // Seat-Based Pricing
    seatBasedPricingFlag: apiProduct.seatBasedPricingFlag,
    
    // Sales & Marketing Flags (salesops section)
    webDisplayFlag: apiProduct.webDisplayFlag,
    
    // Tax & Accounting
    avaTaxCode: apiProduct.avaTaxCode,
    
    // Operations & Fulfillment (salesops section)
    canBeFulfilledFlag: apiProduct.canBeFulfilledFlag,
    
    // Contract Management (contracts section)
    contractItemFlag: apiProduct.contractItemFlag,
    
    // E-commerce Specific (contracts section)
    slug: apiProduct.slug,
    longDescription: apiProduct.longDescription,
    
    // System & Audit
    status: apiProduct.status,
    availableFlag: apiProduct.availableFlag,
    pricing: apiProduct.pricing || [],
    approvals: apiProduct.approvals || [],
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
    createdBy: apiProduct.createdBy,
    updatedBy: apiProduct.updatedBy
  }
}

// Helper function to transform frontend product data to simplified API format
export const transformProductToApi = (uiProduct) => {
  // For the simplified schema, we use direct field mapping with no transformation
  // The UI sends camelCase, which matches our simplified API expectations
  return {
    // Core Product Information
    id: uiProduct.id,
    sku: uiProduct.sku || '',
    name: uiProduct.name || '',
    description: uiProduct.description || '',
    
    // Product Classification
    type: uiProduct.type || '',
    categorization: uiProduct.categorization || [],
    
    // Pricing & Financial
    basePrice: parseFloat(uiProduct.basePrice) || 0,
    costPrice: parseFloat(uiProduct.costPrice) || 0,
    
    // License & Permissions
    licenseRequiredFlag: Boolean(uiProduct.licenseRequiredFlag),
    
    // Seat-Based Pricing
    seatBasedPricingFlag: Boolean(uiProduct.seatBasedPricingFlag),
    
    // Sales & Marketing Flags (salesops section)
    webDisplayFlag: Boolean(uiProduct.webDisplayFlag),
    
    // Tax & Accounting
    avaTaxCode: uiProduct.avaTaxCode || '',
    
    // Operations & Fulfillment (salesops section)
    canBeFulfilledFlag: Boolean(uiProduct.canBeFulfilledFlag),
    
    // Contract Management (contracts section)
    contractItemFlag: Boolean(uiProduct.contractItemFlag),
    
    // E-commerce Specific (contracts section)
    slug: uiProduct.slug || '',
    longDescription: uiProduct.longDescription || '',
    
    // System & Audit
    status: uiProduct.status || 'draft',
    availableFlag: Boolean(uiProduct.availableFlag !== false), // Default to true
    pricing: uiProduct.pricing || [],
    approvals: uiProduct.approvals || [],
    createdAt: uiProduct.createdAt,
    updatedAt: uiProduct.updatedAt,
    createdBy: uiProduct.createdBy,
    updatedBy: uiProduct.updatedBy
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
      const stats = await productApi.getProductAnalytics()
      return {
        total: parseInt(stats.total_products) || 0,
        available: parseInt(stats.available_products) || 0,
        inactive: parseInt(stats.total_products) - parseInt(stats.active_products) || 0,
        webDisplayed: parseInt(stats.web_display_products) || 0,
        source: 'dotnet-api',
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
      
      // Handle validation errors specifically
      if (error.status === 400 && error.data && error.data.validation_errors) {
        return {
          product: null,
          error: error.data.error || 'Validation failed',
          validation_errors: error.data.validation_errors
        }
      }
      
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
      
      // Handle validation errors specifically
      if (error.status === 400 && error.data && error.data.validation_errors) {
        return {
          product: null,
          error: error.data.error || 'Validation failed',
          validation_errors: error.data.validation_errors
        }
      }
      
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
        pagination: {
          page: response.page || 1,
          limit: response.limit || 20,
          total: response.totalCount || 0,
          pages: response.totalPages || 0,
          hasNextPage: response.hasNextPage || false,
          hasPreviousPage: response.hasPreviousPage || false
        },
        source: 'dotnet-api',
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
        total: parseInt(stats.totalUsers) || 0,
        active: parseInt(stats.activeUsers) || 0,
        inactive: parseInt(stats.inactiveUsers) || 0,
        pending: parseInt(stats.pendingUsers) || 0,
        suspended: parseInt(stats.suspendedUsers) || 0,
        admins: parseInt(stats.usersByRole?.admin) || 0,
        userAdmins: parseInt(stats.usersByRole?.user_admin) || 0,
        activeLast30Days: parseInt(stats.usersWithRecentActivity) || 0,
        source: 'dotnet-api',
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
        source: 'dotnet-api',
        error: error.message || 'Failed to fetch user statistics'
      }
    }
  },

  // Create a new user
  async createUser(userData) {
    try {
      const newUser = await userApi.createUser(userData)
      return {
        user: newUser,
        source: 'dotnet-api',
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
        user: updatedUser,
        source: 'dotnet-api',
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
        user: result,
        message: result.message || 'User deleted successfully',
        source: 'dotnet-api',
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
export { ApiClient, ProductApi, UserApi, ApiError, apiClient, productApi, userApi, productApiClient, userApiClient }
export default productApi