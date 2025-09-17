// Service for communicating with the pricing-mdm API

const API_BASE_URL = 'http://localhost:6004/api'

class CatalogService {
  // Get all catalogs for a region
  async getCatalogsByRegion(region) {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogs?region=${region}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch catalogs: ${response.statusText}`)
      }
      const data = await response.json()
      return data.catalogs || []
    } catch (error) {
      console.error('Error fetching catalogs:', error)
      throw error
    }
  }

  // Get default catalog for a region and channel
  async getDefaultCatalog(region, channel) {
    try {
      const catalogs = await this.getCatalogsByRegion(region)
      
      // First, look for a catalog that matches both region and channel and is default
      const defaultCatalog = catalogs.find(catalog => 
        catalog.region_code === region && 
        catalog.channel_code === channel && 
        catalog.is_default === true
      )
      
      if (defaultCatalog) {
        return defaultCatalog
      }
      
      // If no default found, look for any catalog matching region and channel
      const matchingCatalog = catalogs.find(catalog => 
        catalog.region_code === region && 
        catalog.channel_code === channel
      )
      
      if (matchingCatalog) {
        return matchingCatalog
      }
      
      // If still no match, return the first catalog for the region
      const regionCatalog = catalogs.find(catalog => catalog.region_code === region)
      if (regionCatalog) {
        return regionCatalog
      }
      
      throw new Error(`No catalog found for region ${region} and channel ${channel}`)
    } catch (error) {
      console.error('Error getting default catalog:', error)
      throw error
    }
  }

  // Get products from a specific catalog
  async getCatalogProducts(catalogId, options = {}) {
    try {
      const { page = 1, limit = 50, search = '' } = options
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search) {
        params.append('search', search)
      }
      
      const response = await fetch(`${API_BASE_URL}/catalogs/${catalogId}/products?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch catalog products: ${response.statusText}`)
      }
      
      const data = await response.json()
      return {
        products: data.products || [],
        pagination: data.pagination || { page: 1, limit: 50, total: 0, pages: 0 }
      }
    } catch (error) {
      console.error('Error fetching catalog products:', error)
      throw error
    }
  }

  // Get available regions
  async getRegions() {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogs/regions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch regions: ${response.statusText}`)
      }
      const data = await response.json()
      return data.regions || []
    } catch (error) {
      console.error('Error fetching regions:', error)
      throw error
    }
  }

  // Get available channels/market segments
  async getChannels() {
    try {
      const response = await fetch(`${API_BASE_URL}/catalogs/channels`)
      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.statusText}`)
      }
      const data = await response.json()
      return data.channels || []
    } catch (error) {
      console.error('Error fetching channels:', error)
      throw error
    }
  }

  // Calculate product price based on catalog metadata
  calculateProductPrice(product, catalog) {
    let finalPrice = product.base_price || 0

    // Apply catalog-specific overrides
    if (product.override_base_price) {
      finalPrice = product.override_base_price
    }

    // Apply discount percentage if available
    if (product.discount_percentage && product.discount_percentage > 0) {
      const discountAmount = finalPrice * (product.discount_percentage / 100)
      finalPrice = finalPrice - discountAmount
    }

    return {
      basePrice: product.base_price || 0,
      finalPrice: Math.max(0, finalPrice), // Ensure price is not negative
      discountPercentage: product.discount_percentage || 0,
      hasDiscount: (product.discount_percentage || 0) > 0,
      currency: catalog?.currency_code || 'USD'
    }
  }

  // Format price for display
  formatPrice(price, currency = 'USD', locale = 'en-US') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(price)
    } catch (error) {
      console.warn('Failed to format price:', error)
      return `$${price.toFixed(2)}`
    }
  }
}

// Create a singleton instance
const catalogService = new CatalogService()
export default catalogService