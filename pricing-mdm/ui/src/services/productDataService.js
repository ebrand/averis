// Hybrid Product Data Service - supports both API and mock data with fallback
import { productUtils } from './apiClient'
import { mockProducts, searchProducts as searchMockProducts, getProductStats as getMockStats } from '../data/mockProducts'
import databaseMockService from './databaseMockService'

// Configuration - prefer API over mock data
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const API_FALLBACK_ENABLED = import.meta.env.VITE_API_FALLBACK_ENABLED !== 'false'
const FORCE_API_USAGE = import.meta.env.VITE_FORCE_API_USAGE === 'true'

class ProductDataService {
  constructor() {
    this.isUsingMockData = USE_MOCK_DATA
    this.apiAvailable = null // null = unknown, true = available, false = unavailable
  }

  // Test API availability
  async testApiConnection() {
    if (this.isUsingMockData && !FORCE_API_USAGE) {
      this.apiAvailable = false
      return false
    }

    // Use relative URL which will be proxied by Vite to the API server
    const endpoints = [
      '/api/products?page=1&limit=1'  // This will be proxied to the product API
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing API connection to ${endpoint}`)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          this.apiAvailable = true
          console.log(`✅ API is available at ${endpoint} - using real backend`)
          // Update the base URL for future requests
          if (endpoint.includes('127.0.0.1')) {
            console.log('📝 Using 127.0.0.1 instead of localhost for API requests')
          }
          return true
        }
      } catch (error) {
        console.warn(`⚠️ API test failed for ${endpoint}:`, error.message)
        if (error.name === 'AbortError') {
          console.warn('⏰ API request timed out')
        }
      }
    }
    
    this.apiAvailable = false
    console.error('❌ All API endpoints failed - API server may not be running')
    return false
  }

  // Get filtered products with search and pagination
  async getProducts(searchQuery = '', filters = {}, page = 1, limit = 20) {
    // Always try API first when forcing API usage
    if (FORCE_API_USAGE) {
      try {
        const result = await productUtils.getFilteredProducts(searchQuery, filters, page, limit)
        if (!result.error) {
          console.log('🔗 Using API data for products (forced)')
          this.apiAvailable = true
          return { ...result, source: 'api' }
        }
        console.error('API error when forced:', result.error)
        return {
          products: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          source: 'api',
          error: result.error || 'API server returned an error.'
        }
      } catch (error) {
        console.error('API failed when forced:', error)
        return {
          products: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          source: 'api',
          error: 'API server not available. Please check if the API server is running.'
        }
      }
    }

    // Standard flow for non-forced usage
    if (!this.isUsingMockData && API_FALLBACK_ENABLED) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const result = await productUtils.getFilteredProducts(searchQuery, filters, page, limit)
          if (!result.error) {
            console.log('🔗 Using API data for products')
            return { ...result, source: 'api' }
          }
          console.warn('API error, falling back to mock data:', result.error)
        } catch (error) {
          console.warn('API failed, falling back to mock data:', error)
          this.apiAvailable = false
        }
      }
    }

    // Fall back to database mock service (simulates direct database connection)
    console.log('🗄️ Using database simulation for products')
    return await databaseMockService.getProducts(searchQuery, filters, page, limit)
  }

  // Mock data implementation
  getMockProducts(searchQuery = '', filters = {}, page = 1, limit = 20) {
    let products = mockProducts

    // Apply search
    if (searchQuery.trim()) {
      products = searchMockProducts(searchQuery)
    }

    // Apply filters
    if (filters.type) {
      products = products.filter(p => p.type === filters.type)
    }
    if (filters.class) {
      products = products.filter(p => p.class === filters.class)
    }
    if (filters.available === 'true') {
      products = products.filter(p => p.available_flag === true)
    } else if (filters.available === 'false') {
      products = products.filter(p => p.available_flag === false)
    }
    if (filters.webDisplay === 'true') {
      products = products.filter(p => p.web_display_flag === true)
    } else if (filters.webDisplay === 'false') {
      products = products.filter(p => p.web_display_flag === false)
    }

    // Sort products
    products.sort((a, b) => {
      const aVal = a.name.toLowerCase()
      const bVal = b.name.toLowerCase()
      return aVal.localeCompare(bVal)
    })

    // Paginate
    const startIndex = (page - 1) * limit
    const paginatedProducts = products.slice(startIndex, startIndex + limit)
    const total = products.length
    const pages = Math.ceil(total / limit)

    return {
      products: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      },
      source: 'mock',
      error: null
    }
  }

  // Get product statistics
  async getProductStats() {
    // Always try API first when forcing API usage
    if (FORCE_API_USAGE) {
      try {
        const result = await productUtils.getProductStats()
        if (!result.error) {
          console.log('🔗 Using API data for stats (forced)')
          this.apiAvailable = true
          return { ...result, source: 'api' }
        }
        console.error('API stats error when forced:', result.error)
        return {
          total: 0,
          available: 0,
          inactive: 0,
          webDisplayed: 0,
          source: 'api',
          error: result.error || 'API server returned an error.'
        }
      } catch (error) {
        console.error('API stats failed when forced:', error)
        return {
          total: 0,
          available: 0,
          inactive: 0,
          webDisplayed: 0,
          source: 'api',
          error: 'API server not available. Please check if the API server is running.'
        }
      }
    }

    // Standard flow for non-forced usage
    if (!this.isUsingMockData && API_FALLBACK_ENABLED) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const result = await productUtils.getProductStats()
          if (!result.error) {
            console.log('🔗 Using API data for stats')
            return { ...result, source: 'api' }
          }
        } catch (error) {
          console.warn('API stats failed:', error)
          this.apiAvailable = false
        }
      }
    }

    // Fall back to database mock service
    console.log('🗄️ Using database simulation for stats')
    return await databaseMockService.getProductStats()
  }

  // Get single product by ID
  async getProduct(id) {
    // Force API usage if configured, or try API first (if not explicitly using mock data)
    if (FORCE_API_USAGE || (!this.isUsingMockData && API_FALLBACK_ENABLED)) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const response = await fetch(`/api/products/${id}`)
          if (response.ok) {
            const product = await response.json()
            console.log('🔗 Using API data for product:', id)
            return { product, source: 'api', error: null }
          } else if (response.status === 404) {
            return { product: null, source: 'api', error: 'Product not found' }
          }
        } catch (error) {
          console.warn('API get product failed:', error)
          this.apiAvailable = false
        }
      }
      
      // If forcing API but it's not available, show error
      if (FORCE_API_USAGE && !this.apiAvailable) {
        return {
          product: null,
          source: 'api',
          error: 'API server not available. Please check if the API server is running.'
        }
      }
    }

    // Fall back to mock data
    console.log('🗄️ Using mock data for product:', id)
    const product = mockProducts.find(p => p.id === parseInt(id) || p.id === id)
    return {
      product: product || null,
      source: 'mock',
      error: product ? null : 'Product not found'
    }
  }

  // Create new product
  async createProduct(productData) {
    // Force API usage if configured, or try API first (if not explicitly using mock data)
    if (FORCE_API_USAGE || (!this.isUsingMockData && API_FALLBACK_ENABLED)) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const result = await productUtils.createProduct(productData)
          if (!result.error) {
            return { ...result, source: 'api' }
          }
        } catch (error) {
          console.warn('API create product failed:', error)
          this.apiAvailable = false
        }
      }
      
      // If forcing API but it's not available, show error
      if (FORCE_API_USAGE && !this.apiAvailable) {
        return {
          product: null,
          source: 'api',
          error: 'API server not available. Please check if the API server is running.'
        }
      }
    }

    // Mock implementation (for demonstration)
    console.log('📝 Mock: Would create product:', productData)
    const newProduct = {
      ...productData,
      id: Math.max(...mockProducts.map(p => p.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // In a real implementation, you might save to localStorage
    return {
      product: newProduct,
      source: 'mock',
      error: null
    }
  }

  // Update product
  async updateProduct(id, productData) {
    // Force API usage if configured, or try API first (if not explicitly using mock data)
    if (FORCE_API_USAGE || (!this.isUsingMockData && API_FALLBACK_ENABLED)) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const result = await productUtils.updateProduct(id, productData)
          if (!result.error) {
            return { ...result, source: 'api' }
          }
        } catch (error) {
          console.warn('API update product failed:', error)
          this.apiAvailable = false
        }
      }
      
      // If forcing API but it's not available, show error
      if (FORCE_API_USAGE && !this.apiAvailable) {
        return {
          product: null,
          source: 'api',
          error: 'API server not available. Please check if the API server is running.'
        }
      }
    }

    // Mock implementation
    console.log('📝 Mock: Would update product:', id, productData)
    const updatedProduct = {
      ...productData,
      id,
      updated_at: new Date().toISOString()
    }

    return {
      product: updatedProduct,
      source: 'mock',
      error: null
    }
  }

  // Get current data source info
  getDataSourceInfo() {
    return {
      isUsingMockData: this.isUsingMockData,
      apiAvailable: this.apiAvailable,
      source: this.apiAvailable ? 'api' : 'mock',
      fallbackEnabled: API_FALLBACK_ENABLED
    }
  }

  // Force refresh API availability
  async refreshApiStatus() {
    return await this.testApiConnection()
  }
}

// Create singleton instance
const productDataService = new ProductDataService()

// Helper functions for easy use in components
export const getProducts = (searchQuery, filters, page, limit) => 
  productDataService.getProducts(searchQuery, filters, page, limit)

export const getProductStats = () => 
  productDataService.getProductStats()

export const getProduct = (id) => 
  productDataService.getProduct(id)

export const createProduct = (productData) => 
  productDataService.createProduct(productData)

export const updateProduct = (id, productData) => 
  productDataService.updateProduct(id, productData)

export const getDataSourceInfo = () => 
  productDataService.getDataSourceInfo()

export const refreshApiStatus = () => 
  productDataService.refreshApiStatus()

export default productDataService