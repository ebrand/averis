// Service for fetching products with catalog pricing integration
const API_BASE_URL = 'http://localhost:6004/api'

class ProductService {
  
  /**
   * Get products with catalog pricing for customer view
   */
  async getProducts(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      brand = '',
      region = 'AMER',
      channel = 'DIRECT',
      status = 'active'
    } = options

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        region,
        channel,
        status
      })

      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (brand) params.append('brand', brand)

      const response = await fetch(`${API_BASE_URL}/products?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return {
          products: result.data.products || [],
          pagination: result.data.pagination || {},
          catalog: result.data.catalog || null
        }
      } else {
        throw new Error(result.error || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  /**
   * Get single product with catalog pricing
   */
  async getProduct(productId, options = {}) {
    const {
      region = 'AMER',
      channel = 'DIRECT'
    } = options

    try {
      const params = new URLSearchParams({ region, channel })
      const response = await fetch(`${API_BASE_URL}/products/${productId}?${params}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch product: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  /**
   * Search products with catalog pricing
   */
  async searchProducts(searchTerm, options = {}) {
    return this.getProducts({
      ...options,
      search: searchTerm
    })
  }

  /**
   * Get product categories
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result.data || []
      } else {
        throw new Error(result.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

const productService = new ProductService()
export default productService