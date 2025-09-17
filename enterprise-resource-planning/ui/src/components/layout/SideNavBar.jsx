import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useRole } from '../../contexts/RoleContext'
import { navigateToApp, navigateToDashboard, navigateToProductMdm, navigateToPricingMdm } from '../../utils/crossAppNavigation'
import {
  HomeIcon,
  ArchiveBoxIcon,
  ScaleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CubeIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalculatorIcon,
  TruckIcon,
  BanknotesIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

export const SideNavBar = ({ isOpen, onClose }) => {
  const { canAccessAdminFeatures, isUserAdmin, isAdmin } = useRole()
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
    // Default: always open Inventory section for new users
    return { Inventory: true }
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
    return colorMap[color] || colorMap.orange
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
      href: 'http://localhost:3003', 
      external: true, 
      appKey: 'pricing',
      description: 'Pricing management',
      current: false,
      size: 'normal',
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
      href: '/inventory', 
      external: false, 
      description: 'Enterprise resource',
      current: true,
      size: 'large', // Featured card for current app
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

    // Add Inventory section
    items.push({
      name: 'Inventory',
      href: '#',
      icon: ArchiveBoxIcon,
      description: 'Inventory and warehouse management',
      children: [
        { name: 'All Items', href: '/inventory', icon: ArchiveBoxIcon },
        { name: 'Stock Levels', href: '/inventory/stock', icon: ScaleIcon },
        { name: 'Warehouses', href: '/inventory/warehouses', icon: BuildingOfficeIcon },
        { name: 'Suppliers', href: '/inventory/suppliers', icon: TruckIcon }
      ]
    })

    // Add Accounting section
    items.push({
      name: 'Accounting',
      href: '#',
      icon: CalculatorIcon,
      description: 'Financial management and reporting',
      children: [
        { name: 'General Ledger', href: '/accounting/ledger', icon: DocumentTextIcon },
        { name: 'Accounts Payable', href: '/accounting/payable', icon: BanknotesIcon },
        { name: 'Accounts Receivable', href: '/accounting/receivable', icon: CurrencyDollarIcon },
        { name: 'Financial Reports', href: '/accounting/reports', icon: ChartBarIcon }
      ]
    })

    return items
  }

  const navigation = [
    ...buildNavigationItems(),
    ...(canAccessAdminFeatures() ? [{
      name: 'Administration',
      href: '#',
      icon: Cog6ToothIcon,
      description: 'System administration',
      children: [
        ...(isUserAdmin() || isAdmin() ? [
          { name: 'Users', href: '/users' }
        ] : [])
      ]
    }] : [])
  ]

  const NavItem = ({ item, isChild = false, isExpanded, onToggle }) => {
    const baseClasses = isChild 
      ? 'group flex items-center px-10 py-2 text-sm font-medium rounded-md transition-colors duration-150'
      : 'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150'

    // Custom active check for "All Items" - consider both "/" and "/inventory" as active
    const isCustomActive = (href) => {
      if (href === '/inventory') {
        return location.pathname === '/' || location.pathname === '/inventory'
      }
      return false
    }

    const hasChildren = item.children && item.children.length > 0

    if (hasChildren && !isChild) {
      // Parent item with children - clickable to expand/collapse
      return (
        <button
          onClick={() => onToggle(item.name)}
          className={`${baseClasses} w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-orange-50 dark:hover:bg-gray-800`}
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
            } else if (item.href === 'http://localhost:3003') {
              navigateToPricingMdm('/')
            } else {
              window.location.href = item.href
            }
            // Close mobile menu when navigating
            if (window.innerWidth < 1024) {
              onClose?.()
            }
          }}
          className={`${baseClasses} text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-orange-50 dark:hover:bg-gray-800`}
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
          // Use custom active check for "All Items", fallback to default for others
          const activeState = isCustomActive(item.href) || isActive
          return `${baseClasses} ${
            activeState
              ? isChild
                ? 'bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-700 text-orange-700 dark:text-orange-300'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-orange-50 dark:hover:bg-gray-800'
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Inventory & accounting mgmt</p>
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
                  ? 'col-span-2 row-span-1' // ERP button spans 2 columns
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
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShieldCheckIcon className="h-4 w-4 text-orange-700" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">
                  Averis Enterprise Resource Planning v1.0
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