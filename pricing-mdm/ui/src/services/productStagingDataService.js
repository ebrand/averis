// Product Staging Data Service - dedicated service for consuming Product Staging API
// This service is specifically designed for the Pricing MDM "All Products" page
// to consume read-optimized product data from the Product Staging API (port 6002)

import { productStagingUtils } from './productStagingApiClient'
import { mockProducts, searchProducts as searchMockProducts, getProductStats as getMockStats } from '../data/mockProducts'
import databaseMockService from './databaseMockService'

// Configuration for Product Staging API
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const API_FALLBACK_ENABLED = import.meta.env.VITE_API_FALLBACK_ENABLED !== 'false'
const FORCE_STAGING_API_USAGE = import.meta.env.VITE_FORCE_STAGING_API_USAGE === 'true'

class ProductStagingDataService {
  constructor() {
    this.isUsingMockData = USE_MOCK_DATA
    this.apiAvailable = null // null = unknown, true = available, false = unavailable
    this.serviceName = 'ProductStagingDataService'
  }

  // Test Product Staging API availability
  async testApiConnection() {
    if (this.isUsingMockData && !FORCE_STAGING_API_USAGE) {
      this.apiAvailable = false
      return false
    }

    try {
      console.log(`🔍 Testing Product Staging API connection`)
      const isAvailable = await productStagingUtils.testConnection()
      this.apiAvailable = isAvailable
      
      if (isAvailable) {
        console.log(`✅ Product Staging API is available - using read-optimized staging data`)
      } else {
        console.log(`❌ Product Staging API is not available`)
      }
      
      return isAvailable
    } catch (error) {
      console.error('Product Staging API connection test failed:', error)
      this.apiAvailable = false
      return false
    }
  }

  // Get filtered products with search and pagination from Product Staging
  async getProducts(searchQuery = '', filters = {}, page = 1, limit = 20) {
    // Always try Product Staging API first when forcing usage
    if (FORCE_STAGING_API_USAGE) {
      try {
        const result = await productStagingUtils.getFilteredProducts(searchQuery, filters, page, limit)
        if (!result.error) {
          console.log('🔗 Using Product Staging API data for products (forced)')
          this.apiAvailable = true
          return { ...result, source: 'staging-api' }
        }
        console.error('Product Staging API error when forced:', result.error)
        return {
          products: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          source: 'staging-api',
          error: result.error || 'Product Staging API server returned an error.'
        }
      } catch (error) {
        console.error('Product Staging API failed when forced:', error)
        return {
          products: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 },
          source: 'staging-api',
          error: 'Product Staging API server not available. Please check if the API server is running on port 6002.'
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
          const result = await productStagingUtils.getFilteredProducts(searchQuery, filters, page, limit)
          if (!result.error) {
            console.log('🔗 Using Product Staging API data for products')
            return { ...result, source: 'staging-api' }
          }
          console.warn('Product Staging API error, falling back to mock data:', result.error)
        } catch (error) {
          console.warn('Product Staging API failed, falling back to mock data:', error)
          this.apiAvailable = false
        }
      }
    }

    // Fall back to database mock service (simulates direct database connection)
    console.log('🗄️ Using database simulation for products (Product Staging API not available)')
    const mockResult = await databaseMockService.getProducts(searchQuery, filters, page, limit)
    return { ...mockResult, source: 'mock' }
  }

  // Get product statistics from Product Staging
  async getProductStats() {
    // Always try Product Staging API first when forcing usage
    if (FORCE_STAGING_API_USAGE) {
      try {
        const result = await productStagingUtils.getProductStats()
        if (!result.error) {
          console.log('🔗 Using Product Staging API data for stats (forced)')
          this.apiAvailable = true
          return { ...result, source: 'staging-api' }
        }
        console.error('Product Staging API stats error when forced:', result.error)
        return {
          total: 0,
          available: 0,
          inactive: 0,
          webDisplayed: 0,
          source: 'staging-api',
          error: result.error || 'Product Staging API server returned an error.'
        }
      } catch (error) {
        console.error('Product Staging API stats failed when forced:', error)
        return {
          total: 0,
          available: 0,
          inactive: 0,
          webDisplayed: 0,
          source: 'staging-api',
          error: 'Product Staging API server not available. Please check if the API server is running on port 6002.'
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
          const result = await productStagingUtils.getProductStats()
          if (!result.error) {
            console.log('🔗 Using Product Staging API data for stats')
            return { ...result, source: 'staging-api' }
          }
        } catch (error) {
          console.warn('Product Staging API stats failed:', error)
          this.apiAvailable = false
        }
      }
    }

    // Fall back to database mock service
    console.log('🗄️ Using database simulation for stats (Product Staging API not available)')
    const mockResult = await databaseMockService.getProductStats()
    return { ...mockResult, source: 'mock' }
  }

  // Get single product by ID from Product Staging
  async getProduct(id) {
    // Force API usage if configured, or try API first (if not explicitly using mock data)
    if (FORCE_STAGING_API_USAGE || (!this.isUsingMockData && API_FALLBACK_ENABLED)) {
      if (this.apiAvailable === null) {
        await this.testApiConnection()
      }

      if (this.apiAvailable) {
        try {
          const result = await productStagingUtils.getProduct(id)
          if (!result.error) {
            console.log('🔗 Using Product Staging API data for product:', id)
            return { ...result, source: 'staging-api' }
          } else if (result.error === 'Product not found') {
            return { product: null, source: 'staging-api', error: 'Product not found' }
          }
        } catch (error) {
          console.warn('Product Staging API get product failed:', error)
          this.apiAvailable = false
        }
      }
      
      // If forcing API but it's not available, show error
      if (FORCE_STAGING_API_USAGE && !this.apiAvailable) {
        return {
          product: null,
          source: 'staging-api',
          error: 'Product Staging API server not available. Please check if the API server is running on port 6002.'
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

  // Get current data source info
  getDataSourceInfo() {
    return {
      isUsingMockData: this.isUsingMockData,
      apiAvailable: this.apiAvailable,
      source: this.apiAvailable ? 'staging-api' : 'mock',
      fallbackEnabled: API_FALLBACK_ENABLED,
      serviceName: this.serviceName,
      apiEndpoint: 'http://localhost:6002/api'
    }
  }

  // Force refresh API availability
  async refreshApiStatus() {
    return await this.testApiConnection()
  }
}

// Create singleton instance
const productStagingDataService = new ProductStagingDataService()

// Helper functions for easy use in components
export const getStagingProducts = (searchQuery, filters, page, limit) => 
  productStagingDataService.getProducts(searchQuery, filters, page, limit)

export const getStagingProductStats = () => 
  productStagingDataService.getProductStats()

export const getStagingProduct = (id) => 
  productStagingDataService.getProduct(id)

export const getStagingDataSourceInfo = () => 
  productStagingDataService.getDataSourceInfo()

export const refreshStagingApiStatus = () => 
  productStagingDataService.refreshApiStatus()

export default productStagingDataService