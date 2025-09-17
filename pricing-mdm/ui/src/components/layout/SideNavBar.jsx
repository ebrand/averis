import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useRole } from '../../contexts/RoleContext'
import { navigateToApp, navigateToDashboard, navigateToProductMdm, navigateToCustomerMdm } from '../../utils/crossAppNavigation'
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ShieldCheckIcon,
  KeyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeAmericasIcon,
  GlobeEuropeAfricaIcon,
  GlobeAsiaAustraliaIcon,
  GlobeAltIcon,
  BookOpenIcon,
  MapIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  UsersIcon,
  ShoppingCartIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline'

export const SideNavBar = ({ isOpen, onClose }) => {
  const { canAccessAdminFeatures, isUserAdmin, isAdmin, canViewCatalogs, canViewPricing, hasRegionAccess } = useRole()
  const location = useLocation()
  
  // Load expanded sections from localStorage or set defaults
  const getInitialExpandedSections = () => {
    try {
      const saved = localStorage.getItem('sideNavExpandedSections')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load navigation state from localStorage:', error)
    }
    // Default: always open Catalogs section for new users
    return { Catalogs: true }
  }
  
  const [expandedSections, setExpandedSections] = useState(getInitialExpandedSections)
  
  // Save expanded sections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sideNavExpandedSections', JSON.stringify(expandedSections))
    } catch (error) {
      console.warn('Failed to save navigation state to localStorage:', error)
    }
  }, [expandedSections])
  
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }
  
  // Helper function to get color classes for Bento cards
  const getCardColorClasses = (color, isActive = false) => {
    const colorMap = {
      teal: isActive 
        ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg' 
        : 'bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 dark:text-teal-300',
      blue: isActive 
        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
        : 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300',
      green: isActive 
        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
        : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300',
      indigo: isActive 
        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg' 
        : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300',
      purple: isActive 
        ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg' 
        : 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300',
      orange: isActive 
        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg' 
        : 'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300',
      emerald: isActive 
        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg' 
        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300'
    }
    return colorMap[color] || colorMap.green
  }
  
  // Bento-style platform buttons with grid layout
  const platformApps = [
    { 
      name: 'Home', 
      icon: HomeIcon, 
      href: 'http://localhost:3012', 
      external: true, 
      appKey: 'dashboard',
      description: 'Platform overview',
      current: false,
      size: 'normal',
      color: 'teal'
    },
    { 
      name: 'Product', 
      icon: CubeIcon, 
      href: 'http://localhost:3001', 
      external: true, 
      appKey: 'product',
      description: 'Product management',
      current: false,
      size: 'normal',
      color: 'blue'
    },
    { 
      name: 'Pricing', 
      icon: CurrencyDollarIcon, 
      href: '/catalogs', 
      external: false, 
      description: 'Pricing management',
      current: true,
      size: 'large', // Featured card for current app
      color: 'green'
    },
    { 
      name: 'Customer', 
      icon: UsersIcon, 
      href: 'http://localhost:3007', 
      external: true, 
      appKey: 'customer',
      description: 'Customer management',
      current: false,
      size: 'normal',
      color: 'indigo'
    },
    { 
      name: 'OMS', 
      icon: ClipboardDocumentListIcon, 
      href: 'http://localhost:3005', 
      external: true, 
      appKey: 'oms',
      description: 'Order management',
      current: false,
      size: 'normal',
      color: 'purple'
    },
    { 
      name: 'ERP', 
      icon: BriefcaseIcon, 
      href: 'http://localhost:3006', 
      external: true, 
      appKey: 'erp',
      description: 'Enterprise resource',
      current: false,
      size: 'normal',
      color: 'orange'
    },
    { 
      name: 'Store', 
      icon: ShoppingCartIcon, 
      href: 'http://localhost:3004', 
      external: true, 
      appKey: 'ecommerce',
      description: 'Customer-facing store',
      current: false,
      size: 'normal',
      color: 'emerald'
    }
  ]

  // Filter navigation items based on user permissions
  const buildNavigationItems = () => {
    const items = []

    // Add Catalogs section if user has catalog access
    if (canViewCatalogs()) {
      const catalogChildren = []
      
      catalogChildren.push(
        { name: 'Catalogs', href: '/catalogs', icon: BookOpenIcon },
        { name: 'Products', href: '/products', icon: CubeIcon }
      )
      
      if (catalogChildren.length > 0) {
        items.push({
          name: 'Pricing Info',
          href: '#',
          icon: BookOpenIcon,
          description: 'Product catalog management',
          children: catalogChildren
        })
      }
    }
    return items
  }

  const navigation = [
    ...buildNavigationItems(),
    // Jobs monitoring - available to all users
    { name: 'Background Jobs', href: '/jobs', icon: ClipboardDocumentListIcon, description: 'Monitor workflow progress' },
    ...(canAccessAdminFeatures() ? [{
      name: 'Administration',
      href: '#',
      icon: Cog6ToothIcon,
      description: 'System administration',
      children: [
        ...(isAdmin() ? [
          { name: 'Channels', href: '/admin/channels', icon: RectangleGroupIcon },
          { name: 'Regions', href: '/admin/regions', icon: MapIcon }
        ] : []),
        // Users page has been moved to the Dashboard app
      ]
    }] : [])
  ]

  const NavItem = ({ item, isChild = false, isExpanded, onToggle }) => {
    const baseClasses = isChild 
      ? 'group flex items-center px-10 py-2 text-sm font-medium rounded-md transition-colors duration-150'
      : 'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150'

    // Custom active check for "All Catalogs" - consider both "/" and "/catalogs" as active
    const isCustomActive = (href) => {
      if (href === '/catalogs') {
        return location.pathname === '/' || location.pathname === '/catalogs'
      }
      return false
    }

    const hasChildren = item.children && item.children.length > 0

    if (hasChildren && !isChild) {
      // Parent item with children - clickable to expand/collapse
      return (
        <button
          onClick={() => onToggle(item.name)}
          className={`${baseClasses} w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800`}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{item.name}</span>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
          )}
        </button>
      )
    }

    // Handle external links (like Dashboard Overview to port 3012, Product to port 3001)
    if (item.external) {
      return (
        <a
          href={item.href}
          onClick={(e) => {
            e.preventDefault()
            // Use cross-app navigation utilities
            if (item.href === 'http://localhost:3012') {
              navigateToDashboard('/')
            } else if (item.href === 'http://localhost:3001') {
              navigateToProductMdm('/')
            } else {
              window.location.href = item.href
            }
            // Close mobile menu when navigating
            if (window.innerWidth < 1024) {
              onClose?.()
            }
          }}
          className={`${baseClasses} text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800`}
        >
          {(!isChild || (isChild && item.icon)) && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
          <span className="flex-1">{item.name}</span>
        </a>
      )
    }

    // Regular navigation item (no children or child item)
    return (
      <NavLink
        to={item.href}
        end
        onClick={() => {
          // Close mobile menu when navigating
          if (window.innerWidth < 1024) {
            onClose?.()
          }
        }}
        className={({ isActive }) => {
          // Use custom active check for "All Catalogs", fallback to default for others
          const activeState = isCustomActive(item.href) || isActive
          return `${baseClasses} ${
            activeState
              ? isChild
                ? 'bg-green-50 dark:bg-green-900/20 border-r-2 border-green-800 text-green-800 dark:text-green-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
          }`
        }}
      >
        {(!isChild || (isChild && item.icon)) && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
        <span className="flex-1">{item.name}</span>
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 z-50 h-full w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: 'calc(1px)' }}
      >
        <div className="flex h-full flex-col">
          {/* Navigation header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise pricing mgmt</p>
          </div>

          {/* Bento Platform Grid */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform</span>
            </div>
            
            {/* Bento Grid - 3 columns, 2 rows */}
            <div className="grid grid-cols-3 gap-2">
              {platformApps.map((app, index) => {
                const handleClick = (e) => {
                  e.preventDefault()
                  if (app.external && app.appKey) {
                    navigateToApp(app.appKey, '/')
                  }
                  // Close mobile menu when navigating
                  if (window.innerWidth < 1024) {
                    onClose?.()
                  }
                }

                // Define grid span classes for Bento layout
                const gridClass = app.size === 'large' 
                  ? 'col-span-2 row-span-1' // Pricing button spans 2 columns
                  : 'col-span-1 row-span-1'

                const cardClasses = `${gridClass} group rounded-lg p-3 transition-all duration-200 transform hover:scale-105 cursor-pointer ${getCardColorClasses(app.color, app.current)}`

                if (app.external) {
                  return (
                    <a
                      key={app.name}
                      href={app.href}
                      onClick={handleClick}
                      className={cardClasses}
                      title={app.description}
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-1">
                        <app.icon className={`${app.size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                        <span className={`text-xs font-medium text-center leading-tight ${app.size === 'large' ? 'text-sm' : ''}`}>
                          {app.name}
                        </span>
                      </div>
                    </a>
                  )
                }
                
                return (
                  <NavLink
                    key={app.name}
                    to={app.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose?.()
                      }
                    }}
                    className={({ isActive }) => 
                      `${gridClass} group rounded-lg p-3 transition-all duration-200 transform hover:scale-105 cursor-pointer ${getCardColorClasses(app.color, isActive || app.current)}`
                    }
                    title={app.description}
                  >
                    <div className="flex flex-col items-center justify-center h-full space-y-1">
                      <app.icon className={`${app.size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                      <span className={`text-xs font-medium text-center leading-tight ${app.size === 'large' ? 'text-sm' : ''}`}>
                        {app.name}
                      </span>
                    </div>
                  </NavLink>
                )
              })}
            </div>
          </div>

          {/* Navigation items - scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-2 px-4 py-4">
            {navigation.map((item) => {
              const isExpanded = expandedSections[item.name] || false
              const hasChildren = item.children && item.children.length > 0
              
              return (
                <div key={item.name} className="space-y-1">
                  <div className="group">
                    <NavItem 
                      item={item} 
                      isExpanded={isExpanded}
                      onToggle={toggleSection}
                    />
                    {item.description && (
                      <p className="px-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Sub-navigation items - only show if expanded */}
                  {hasChildren && isExpanded && (
                    <div className="space-y-1 pb-2">
                      {item.children.map((child) => (
                        <NavItem key={child.name} item={child} isChild />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            </nav>
          </div>

          {/* Footer - sticky at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex items-center space-x-3 h-10">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg 
                    className="h-4 w-4 text-green-800" 
                    viewBox="0 0 300.000000 159.000000" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                      <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                      <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">
                  Averis Pricing v1.0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  Enterprise Edition
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SideNavBar