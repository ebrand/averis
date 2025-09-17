import React, { useState, useEffect } from 'react'
import { useShop } from '../contexts/SimpleShopContext'
import useRealTimeUpdates from '../hooks/useRealTimeUpdates'
import CatalogProductGrid from '../components/product/CatalogProductGrid'
import { 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const ShopPage = () => {
  const { currentCatalog, loading, error, products, pagination, refreshProducts } = useShop()
  const [lastUpdated, setLastUpdated] = useState(null)
  
  // Real-time updates for inventory changes
  const { isConnected, connectionStatus } = useRealTimeUpdates({
    onInventoryUpdate: ({ productId, stockStatus, stockQuantity }) => {
      console.log(`🛒 Shop: Inventory update for ${productId}:`, { stockStatus, stockQuantity })
      
      // Trigger a product refresh to get updated inventory
      if (refreshProducts && typeof refreshProducts === 'function') {
        refreshProducts()
      }
      
      setLastUpdated(new Date())
    },
    
    onProductUpdate: ({ product, eventType }) => {
      console.log(`🛒 Shop: Product ${eventType}:`, product)
      
      // Refresh the product catalog when products are updated
      if (refreshProducts && typeof refreshProducts === 'function') {
        refreshProducts()
      }
      
      setLastUpdated(new Date())
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Shop Products
            </h1>
            {currentCatalog && (
              <p className="text-gray-600">
                Browse our selection from the {currentCatalog.name} catalog
              </p>
            )}
          </div>
          
          {/* Real-time Status - Smaller for customer view */}
          <div className="flex flex-col items-end space-y-1">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {connectionStatus === 'connected' && <CheckCircleIcon className="h-3 w-3" />}
              {connectionStatus === 'connecting' && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
              {connectionStatus === 'disconnected' && <XCircleIcon className="h-3 w-3" />}
              <span>
                {connectionStatus === 'connected' && 'Live'}
                {connectionStatus === 'connecting' && '...'}
                {connectionStatus === 'disconnected' && 'Offline'}
                {connectionStatus === 'reconnecting' && 'Retry'}
              </span>
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-gray-400">
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Info */}
      {currentCatalog && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">
                {currentCatalog.name}
              </h3>
              <div className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Region:</span> {currentCatalog.region_code} • 
                <span className="font-medium ml-2">Channel:</span> {currentCatalog.channel_name} • 
                <span className="font-medium ml-2">Currency:</span> {currentCatalog.currency_code}
                {currentCatalog.is_default && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ⭐ Default
                  </span>
                )}
              </div>
            </div>
            {currentCatalog.effective_from && (
              <div className="text-sm text-blue-600">
                Effective from: {new Date(currentCatalog.effective_from).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <div className="text-sm text-gray-600">
            {pagination.total > 0 && (
              <span>{pagination.total} products found</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View:</span>
          <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md bg-white">
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md">
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !products.length && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading products...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !products.length && (
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">
            Unable to load products
          </div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* No Catalog State */}
      {!currentCatalog && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg font-medium mb-2">
            No catalog available
          </div>
          <div className="text-gray-500">
            Please select a region and channel to view products.
          </div>
        </div>
      )}

      {/* Products Grid */}
      {currentCatalog && !error && (
        <CatalogProductGrid products={products} loading={loading} />
      )}

      {/* Promotional Banner */}
      <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">
          Need Help Finding What You're Looking For?
        </h2>
        <p className="text-primary-100 mb-4">
          Our team is here to help you find the perfect solution for your needs.
        </p>
        <button className="bg-white text-primary-600 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
          Contact Sales
        </button>
      </div>
    </div>
  )
}

export default ShopPage