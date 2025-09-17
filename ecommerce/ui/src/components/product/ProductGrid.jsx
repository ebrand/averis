import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../../contexts/ShopContext'
import { 
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  EyeIcon 
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartSolid,
  StarIcon as StarSolid 
} from '@heroicons/react/24/solid'

const ProductCard = ({ product }) => {
  const { calculatePrice, formatPrice, currentCatalog } = useShop()
  const navigate = useNavigate()
  
  const pricing = calculatePrice(product)
  
  // Generate a mock rating for demo purposes
  const rating = 4 + Math.random()
  const reviewCount = Math.floor(Math.random() * 500) + 10
  
  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="aspect-w-1 aspect-h-1 bg-gray-200 relative">
        <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Product Image</span>
        </div>
        
        {/* Discount badge */}
        {pricing.hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{pricing.discountPercentage}%
          </div>
        )}
        
        {/* Featured badge */}
        {product.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
            Featured
          </div>
        )}
        
        {/* Wishlist button */}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
          <HeartIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {product.custom_name || product.display_name || product.product_name}
        </h3>
        
        {/* SKU */}
        <p className="text-sm text-gray-500 mb-2">
          SKU: {product.local_sku_code || product.sku_code}
        </p>
        
        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              star <= Math.floor(rating) ? (
                <StarSolid key={star} className="h-4 w-4 text-yellow-400" />
              ) : (
                <StarIcon key={star} className="h-4 w-4 text-gray-300" />
              )
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount})
          </span>
        </div>
        
        {/* Description */}
        {(product.custom_description || product.description) && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.custom_description || product.description}
          </p>
        )}
        
        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {product.class || 'Product'}
          </span>
          {product.type && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {product.type}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(pricing.finalPrice)}
            </span>
            {pricing.hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(pricing.basePrice)}
              </span>
            )}
          </div>
          {pricing.hasDiscount && (
            <div className="text-sm text-green-600 font-medium">
              Save {formatPrice(pricing.basePrice - pricing.finalPrice)}
            </div>
          )}
        </div>

        {/* Availability */}
        {product.is_available ? (
          <div className="text-sm text-green-600 mb-3">✓ In Stock</div>
        ) : (
          <div className="text-sm text-red-600 mb-3">✗ Out of Stock</div>
        )}

        {/* Quantity limits */}
        {(product.minimum_quantity > 1 || product.maximum_quantity) && (
          <div className="text-xs text-gray-500 mb-3">
            {product.minimum_quantity > 1 && `Min: ${product.minimum_quantity}`}
            {product.minimum_quantity > 1 && product.maximum_quantity && ' • '}
            {product.maximum_quantity && `Max: ${product.maximum_quantity}`}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
              product.is_available 
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!product.is_available}
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            {product.is_available ? 'Add to Cart' : 'Out of Stock'}
          </button>
          
          <button 
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </button>
        </div>
        
        {/* Approval required notice */}
        {product.requires_approval && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            ⚠️ Requires approval
          </div>
        )}
      </div>
    </div>
  )
}

const ProductGrid = () => {
  const { products, loading, error, pagination, loadProducts } = useShop()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="product-card animate-pulse">
            <div className="w-full h-48 bg-gray-300"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">Error Loading Products</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button 
          onClick={() => loadProducts()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg mb-2">No products found</div>
        <div className="text-gray-500">Try adjusting your search or check back later.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadProducts(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => loadProducts(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pagination.page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => loadProducts(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
      </div>
    </div>
  )
}

export default ProductGrid