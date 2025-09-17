import React, { createContext, useContext, useState, useEffect } from 'react'
import productService from '../services/productService'

// Create context
const ShopContext = createContext()

// Simple Shop Provider that uses the e-commerce API with catalog integration
export function ShopProvider({ children }) {
  const [products, setProducts] = useState([])
  const [currentCatalog, setCurrentCatalog] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // User preferences with defaults
  const [region, setRegion] = useState('AMER')
  const [channel, setChannel] = useState('DIRECT')
  const [language, setLanguage] = useState('en')

  // Available regions and channels
  const regions = [
    { code: 'AMER', name: 'Americas' },
    { code: 'EMEA', name: 'Europe, Middle East & Africa' },
    { code: 'APAC', name: 'Asia Pacific' }
  ]

  const channels = [
    { code: 'DIRECT', name: 'Direct Sales' },
    { code: 'PARTNER', name: 'Partner Channel' },
    { code: 'ONLINE', name: 'Online Store' }
  ]

  // Load products with catalog pricing
  const loadProducts = async (options = {}) => {
    try {
      setLoading(true)
      setError(null)

      const result = await productService.getProducts({
        region,
        channel,
        search: searchQuery,
        ...options
      })

      setProducts(result.products)
      setPagination(result.pagination)
      setCurrentCatalog(result.catalog)

    } catch (err) {
      console.error('Error loading products:', err)
      setError(err.message)
      setProducts([])
      setPagination({ page: 1, limit: 50, total: 0, pages: 0 })
      setCurrentCatalog(null)
    } finally {
      setLoading(false)
    }
  }

  // Initialize and load products
  useEffect(() => {
    loadProducts()
  }, [region, channel, searchQuery])

  // Search products
  const searchProducts = (query) => {
    setSearchQuery(query)
  }

  // Change region and channel
  const changeRegionAndChannel = (newRegion, newChannel) => {
    setRegion(newRegion)
    setChannel(newChannel)
  }

  // Get single product
  const getProduct = async (productId) => {
    try {
      return await productService.getProduct(productId, { region, channel })
    } catch (err) {
      console.error('Error getting product:', err)
      throw err
    }
  }

  // Context value
  const value = {
    // Data
    products,
    currentCatalog,
    pagination,
    regions,
    channels,
    
    // State
    loading,
    error,
    searchQuery,
    region,
    channel,
    language,
    
    // Actions
    loadProducts,
    searchProducts,
    changeRegionAndChannel,
    getProduct,
    
    // UI helpers
    currency: currentCatalog?.currency || 'USD'
  }

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}

// Hook to use shop context
export const useShop = () => {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}

export default ShopContext