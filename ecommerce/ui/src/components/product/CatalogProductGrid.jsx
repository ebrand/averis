import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShoppingCartIcon,
  EyeIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  
  const handleViewProduct = () => {
    navigate(`/product/${product.id}`)
  }

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="aspect-w-1 aspect-h-1 bg-gray-200 relative rounded-t-lg overflow-hidden">
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          {product.images?.primary ? (
            <img 
              src={product.images.primary} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-gray-400 text-sm font-medium">
                {product.name}
              </div>
              <div className="text-gray-300 text-xs mt-1">
                SKU: {product.sku}
              </div>
            </div>
          )}
        </div>
        
        {/* Pricing Badge */}
        {product.pricing && product.pricing.hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.pricing.discountPercentage}% OFF
          </div>
        )}

        {/* Stock Status Badge */}
        {product.stock?.status === 'out_of_stock' && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {product.displayName || product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            SKU: {product.sku}
          </p>
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}

        {/* Pricing */}
        <div className="mb-3">
          {product.pricing && !product.pricing.error ? (
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-semibold text-gray-900">
                  {formatPrice(product.pricing.finalPrice, product.pricing.currency)}
                </span>
                {product.pricing.hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.pricing.basePrice, product.pricing.currency)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {product.pricing.available ? (
                  <span className="text-green-600">✓ Available in catalog</span>
                ) : (
                  <span className="text-yellow-600">⚠ Not available for purchase</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-xs text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Pricing not available</span>
            </div>
          )}
        </div>

        {/* Stock Information */}
        <div className="mb-4 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Stock:</span>
            <span className={`font-medium ${
              product.stock?.status === 'in_stock' ? 'text-green-600' : 
              product.stock?.status === 'low_stock' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {product.stock?.status === 'in_stock' ? 'In Stock' :
               product.stock?.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </span>
          </div>
          {product.stock?.quantity > 0 && (
            <div className="flex justify-between mt-1">
              <span>Quantity:</span>
              <span>{product.stock.quantity}</span>
            </div>
          )}
        </div>

        {/* Ratings */}
        {product.ratings && product.ratings.count > 0 && (
          <div className="flex items-center space-x-1 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon 
                  key={i} 
                  className={`h-3 w-3 ${
                    i < Math.floor(product.ratings.average) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({product.ratings.count})
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewProduct}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View Details</span>
          </button>
          {product.pricing && product.pricing.available && product.stock?.status !== 'out_of_stock' && (
            <button className="bg-green-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-green-700 transition-colors duration-200 flex items-center justify-center">
              <ShoppingCartIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const CatalogProductGrid = ({ products = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <ShoppingCartIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default CatalogProductGrid