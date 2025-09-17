import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useShop } from '../../contexts/SimpleShopContext'
import { handleDashboardNavigation } from '../../utils/crossAppNavigation'
import {
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
  CogIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const Header = () => {
  const location = useLocation()
  const { 
    region, 
    channel, 
    language, 
    searchQuery, 
    searchProducts, 
    changeRegionAndChannel,
    regions,
    channels 
  } = useShop()
  
  const [showRegionSelector, setShowRegionSelector] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  
  const isAdminPage = location.pathname.startsWith('/admin')

  const handleSearch = (e) => {
    e.preventDefault()
    searchProducts(localSearchQuery)
  }

  const handleRegionChange = (newRegion, newChannel) => {
    changeRegionAndChannel(newRegion, newChannel)
    setShowRegionSelector(false)
  }

  const getRegionLabel = () => {
    const regionObj = regions.find(r => r.code === region)
    const channelObj = channels.find(c => c.code === channel)
    
    if (regionObj && channelObj) {
      return `${regionObj.name} - ${channelObj.name}`
    }
    return `${region} - ${channel}`
  }

  const getSiteLabel = () => {
    switch (region) {
      case 'AMER':
        return language === 'en' ? 'United States (English)' : 'Estados Unidos (English)'
      case 'EMEA':
        return 'France (Français)'
      default:
        return `${region} Site`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Top bar with region selector */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome to our store</span>
            </div>
            
            {/* Region/Site Selector */}
            <div className="relative">
              <button
                onClick={() => setShowRegionSelector(!showRegionSelector)}
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900"
              >
                <GlobeAltIcon className="h-4 w-4" />
                <span>{getSiteLabel()}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              
              {showRegionSelector && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-64 z-50">
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 mb-2">Select Your Region</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleRegionChange('AMER', 'DIRECT')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                          region === 'AMER' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        🇺🇸 United States (English)
                        <div className="text-xs text-gray-500">Direct Sales</div>
                      </button>
                      <button
                        onClick={() => handleRegionChange('EMEA', 'DIRECT')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                          region === 'EMEA' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        🇫🇷 France (Français)
                        <div className="text-xs text-gray-500">Ventes directes</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Averis Store
              </h1>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleDashboardNavigation}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Return to Dashboard"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Dashboard
              </button>
              <Link 
                to="/" 
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isAdminPage 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Shop
              </Link>
              <Link 
                to="/admin" 
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isAdminPage 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </nav>
          </div>

          {/* Search bar - only show on shop pages */}
          {!isAdminPage && (
            <div className="flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
              </form>
            </div>
          )}
          
          {/* Spacer for admin pages */}
          {isAdminPage && <div className="flex-1" />}

          {/* Right side actions - only show cart on shop pages */}
          {!isAdminPage && (
            <div className="flex items-center space-x-4">
              {/* Cart icon */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <ShoppingCartIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current region/channel indicator - only show on shop pages */}
      {!isAdminPage && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-2 text-sm text-blue-800">
              <span className="font-medium">Current catalog:</span> {getRegionLabel()}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showRegionSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowRegionSelector(false)}
        />
      )}
    </header>
  )
}

export default Header