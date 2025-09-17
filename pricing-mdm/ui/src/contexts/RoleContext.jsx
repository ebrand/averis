import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const RoleContext = createContext({})

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Map Stytch roles to our internal role system (simplified like Dashboard)
const STYTCH_ROLE_MAPPING = {
  // Core access roles
  'admin': 'SystemAdmin',
  'user_admin': 'UserAdmin',
  'averis_pricing': 'PricingViewer', // Access gate role, maps to basic viewer
  'averis_product': 'ProductViewer', // Access gate role for cross-reference
  
  // Regional catalog roles (unique names like Dashboard)
  'catalog_amer': 'CatalogAmericas',
  'catalog_emea': 'CatalogEMEA',
  'catalog_apj': 'CatalogAPAC',
  
  // Regional pricing roles (deprecated - now using catalog roles)
  // 'pricing_amer': 'PricingAmer', // DEPRECATED: Use catalog_amer instead
  // 'pricing_amer_approve': 'PricingAmerApproval', // DEPRECATED
  // 'pricing_emea': 'PricingEmea', // DEPRECATED: Use catalog_emea instead
  // 'pricing_emea_approve': 'PricingEmeaApproval', // DEPRECATED
  
  // Product workflow roles (for cross-app compatibility)
  'product_marketing': 'ProductMarketing',
  'product_marketing_approve': 'ProductMarketingApproval',
  'product_legal': 'ProductLegal',
  'product_legal_approve': 'ProductLegalApproval',
  'product_finance': 'ProductFinance',
  'product_finance_approve': 'ProductFinanceApproval',
  'product_salesops': 'ProductSalesOps',
  'product_salesops_approve': 'ProductSalesOpsApproval',
  'product_contracts': 'ProductContracts',
  'product_contracts_approve': 'ProductContractsApproval',
  'product_launch': 'ProductLaunch'
}

// Define role groups - simplified approach like Dashboard
const ROLE_GROUPS = {
  // Remove complex optional role groups that were causing duplicates
  // Individual roles will be shown directly
}

// Define role capabilities
const ROLE_PERMISSIONS = {
  PricingViewer: {
    name: 'Pricing Viewer',
    stytchRole: 'averis_pricing',
    color: 'bg-gray-100 text-gray-800',
    icon: '👁️',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['pricing_view', 'catalog_view'],
    regions: []
  },
  ProductViewer: {
    name: 'Product Viewer',
    stytchRole: 'averis_product',
    color: 'bg-gray-100 text-gray-800',
    icon: '📦',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' }
    },
    permissions: ['catalog_view'],
    regions: []
  },
  // DEPRECATED: Pricing roles replaced by catalog roles
  // PricingAmer, PricingAmerApproval, PricingEmea, PricingEmeaApproval removed
  // Pricing functionality is now handled by CatalogAmer, CatalogEmea, etc.
  CatalogAmericas: {
    name: 'Catalog - Americas',
    stytchRole: 'catalog_amer',
    color: 'bg-blue-100 text-blue-800',
    icon: '🌎',
    tabs: {
      catalogs: { access: 'write', label: 'AMER Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_amer_edit', 'catalog_amer_create', 'catalog_amer_delete', 'pricing_view', 'catalog_view'],
    regions: ['AMER']
  },
  CatalogEMEA: {
    name: 'Catalog - EMEA',
    stytchRole: 'catalog_emea',
    color: 'bg-green-100 text-green-800',
    icon: '🌍',
    tabs: {
      catalogs: { access: 'write', label: 'EMEA Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_emea_edit', 'catalog_emea_create', 'catalog_emea_delete', 'pricing_view', 'catalog_view'],
    regions: ['EMEA']
  },
  CatalogAPAC: {
    name: 'Catalog - APAC',
    stytchRole: 'catalog_apj',
    color: 'bg-purple-100 text-purple-800',
    icon: '🌏',
    tabs: {
      catalogs: { access: 'write', label: 'APAC Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_apj_edit', 'catalog_apj_create', 'catalog_apj_delete', 'pricing_view', 'catalog_view'],
    regions: ['APAC']  // Fixed: Database uses APAC, not APJ
  },
  // CatalogLa removed - LA region doesn't exist in database
  SystemAdmin: {
    name: 'System Administrator',
    stytchRole: 'admin',
    color: 'bg-gray-900 text-white',
    icon: '⚡',
    tabs: {
      catalogs: { access: 'write', label: 'Catalog Management' },
      pricing: { access: 'write', label: 'Pricing Management' }
    },
    permissions: ['*'],
    regions: ['AMER', 'EMEA', 'APAC']  // Fixed: Only use actual database regions
  },
  UserAdmin: {
    name: 'User Administrator',
    stytchRole: 'user_admin',
    color: 'bg-green-900 text-white',
    icon: '👥',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['user_management', 'user_create', 'user_edit', 'user_delete', 'role_assignment'],
    regions: ['AMER', 'EMEA', 'APAC']  // Fixed: Only use actual database regions
  },
  // Product roles - these users can view but not edit pricing/catalogs
  ProductMarketing: {
    name: 'Product Marketing',
    stytchRole: 'product_marketing',
    color: 'bg-purple-100 text-purple-800',
    icon: '📱',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductMarketingApproval: {
    name: 'Product Marketing Approval',
    stytchRole: 'product_marketing_approve',
    color: 'bg-purple-200 text-purple-900',
    icon: '✅',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductLegal: {
    name: 'Product Legal',
    stytchRole: 'product_legal',
    color: 'bg-blue-100 text-blue-800',
    icon: '⚖️',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductLegalApproval: {
    name: 'Product Legal Approval',
    stytchRole: 'product_legal_approve',
    color: 'bg-blue-200 text-blue-900',
    icon: '✅',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductFinance: {
    name: 'Product Finance',
    stytchRole: 'product_finance',
    color: 'bg-green-100 text-green-800',
    icon: '💰',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductFinanceApproval: {
    name: 'Product Finance Approval',
    stytchRole: 'product_finance_approve',
    color: 'bg-green-200 text-green-900',
    icon: '✅',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductSalesOps: {
    name: 'Product Sales Ops',
    stytchRole: 'product_salesops',
    color: 'bg-orange-100 text-orange-800',
    icon: '📊',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductSalesOpsApproval: {
    name: 'Product Sales Ops Approval',
    stytchRole: 'product_salesops_approve',
    color: 'bg-orange-200 text-orange-900',
    icon: '✅',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductContracts: {
    name: 'Product Contracts',
    stytchRole: 'product_contracts',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '📋',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductContractsApproval: {
    name: 'Product Contracts Approval',
    stytchRole: 'product_contracts_approve',
    color: 'bg-indigo-200 text-indigo-900',
    icon: '✅',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  },
  ProductLaunch: {
    name: 'Product Launch',
    stytchRole: 'product_launch',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚀',
    tabs: {
      catalogs: { access: 'read', label: 'Catalog Management' },
      pricing: { access: 'read', label: 'Pricing Management' }
    },
    permissions: ['catalog_view', 'pricing_view'],
    regions: []
  }
}

export const RoleProvider = ({ children }) => {
  const { user, dbUser } = useAuth()
  
  // Load current role from localStorage or set default
  const getInitialRole = () => {
    try {
      const saved = localStorage.getItem('currentRole')
      return saved || 'SystemAdmin' // Default to SystemAdmin first, fallback in useEffect
    } catch (error) {
      console.warn('Failed to load role from localStorage:', error)
      return 'SystemAdmin'
    }
  }
  
  const [currentRole, setCurrentRole] = useState(getInitialRole)
  const [availableRoles, setAvailableRoles] = useState(['CatalogMaintainer'])
  const [currentRoleGroup, setCurrentRoleGroup] = useState(null)
  const [activeRoles, setActiveRoles] = useState(['CatalogAmer'])

  useEffect(() => {
    if (user && dbUser) {
      const { individualRoles, availableRoles: userAvailableRoles } = determineUserRoles(dbUser)
      setAvailableRoles(userAvailableRoles)
      
      // Determine which role to use
      let roleToUse = currentRole
      
      // Only auto-switch to SystemAdmin if no valid role is currently selected
      if (userAvailableRoles.includes('SystemAdmin') && !userAvailableRoles.includes(currentRole)) {
        roleToUse = 'SystemAdmin'
        setCurrentRole(roleToUse)
        try {
          localStorage.setItem('currentRole', roleToUse)
        } catch (error) {
          console.warn('Failed to save role to localStorage:', error)
        }
      } else if (userAvailableRoles.length > 0 && !userAvailableRoles.includes(currentRole)) {
        // If not admin, use first available role
        roleToUse = userAvailableRoles[0]
        setCurrentRole(roleToUse)
        try {
          localStorage.setItem('currentRole', roleToUse)
        } catch (error) {
          console.warn('Failed to save role to localStorage:', error)
        }
      }
      
      // Use the correct role for updating active roles
      updateActiveRoles(roleToUse, individualRoles)
    }
  }, [user, dbUser, currentRole])
  
  const updateActiveRoles = (selectedRole, userIndividualRoles) => {
    if (ROLE_GROUPS[selectedRole]) {
      const group = ROLE_GROUPS[selectedRole]
      const combinedRoles = [...group.requiredRoles]
      
      // Add any optional roles the user has
      group.optionalRoles.forEach(optionalRole => {
        if (userIndividualRoles.includes(optionalRole)) {
          combinedRoles.push(optionalRole)
        }
      })
      
      setActiveRoles(combinedRoles)
      setCurrentRoleGroup(group)
    } else {
      setActiveRoles([selectedRole])
      setCurrentRoleGroup(null)
    }
  }

  const determineUserRoles = (dbUserOrStytchUser) => {
    // Prioritize direct Stytch user roles over database user roles for cross-app navigation
    const stytchUser = user // Get the current Stytch user from AuthContext
    const stytchRoles = stytchUser?.roles || []
    const dbUserRoles = dbUserOrStytchUser?.roles || []
    
    // Use Stytch roles if available and non-empty, otherwise fall back to dbUser roles
    const rolesToProcess = stytchRoles.length > 0 ? stytchRoles : dbUserRoles
    const userIndividualRoles = []
    
    rolesToProcess.forEach(role => {
      const mappedRole = STYTCH_ROLE_MAPPING[role]
      if (mappedRole && !userIndividualRoles.includes(mappedRole)) {
        userIndividualRoles.push(mappedRole)
      }
    })
    
    // Special handling: Admin users should always have access, even without averis_pricing
    const hasAdminRole = rolesToProcess.includes('admin')
    const hasSystemAdmin = userIndividualRoles.includes('SystemAdmin')
    
    // Ensure admin role mapping is always applied
    if (hasAdminRole && !hasSystemAdmin) {
      userIndividualRoles.push('SystemAdmin')
    }
    
    // SIMPLIFIED: Just return unique individual roles, no complex grouping
    const uniqueRoles = [...new Set(userIndividualRoles)]
    
    // Filter out any roles that don't have valid configurations
    const validRoles = uniqueRoles.filter(role => {
      const hasConfig = ROLE_PERMISSIONS[role] !== undefined
      if (!hasConfig) {
        console.warn(`Role ${role} found in user roles but no configuration exists in ROLE_PERMISSIONS`)
      }
      return hasConfig
    })
    
    // Filter to only show roles relevant to Pricing MDM application
    const pricingRelevantRoles = [
      'SystemAdmin',
      'UserAdmin', 
      'PricingViewer',
      'CatalogAmericas',
      'CatalogEMEA', 
      'CatalogAPAC'
    ]
    
    const pricingFilteredRoles = validRoles.filter(role => 
      pricingRelevantRoles.includes(role)
    )
    
    return { individualRoles: userIndividualRoles, availableRoles: pricingFilteredRoles }
  }

  const switchRole = (newRole) => {
    if (availableRoles.includes(newRole)) {
      setCurrentRole(newRole)
      
      // Save to localStorage
      try {
        localStorage.setItem('currentRole', newRole)
      } catch (error) {
        console.warn('Failed to save role to localStorage:', error)
      }
      
      if (user && dbUser) {
        const { individualRoles } = determineUserRoles(dbUser)
        updateActiveRoles(newRole, individualRoles)
      }
    }
  }

  const hasPermission = (tab, permission = 'read') => {
    return activeRoles.some(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      if (!roleConfig || !roleConfig.tabs[tab]) return false
      
      const tabAccess = roleConfig.tabs[tab].access
      if (permission === 'read') return true
      if (permission === 'write') return tabAccess === 'write'
      
      return false
    })
  }

  const getTabAccess = (tab, approvals = {}) => {
    const isTabApproved = approvals[tab]?.approved === true
    
    if (isTabApproved) {
      return 'read'
    }
    
    let highestAccess = 'none'
    
    activeRoles.forEach(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      const access = roleConfig?.tabs[tab]?.access
      
      if (access === 'write') highestAccess = 'write'
      else if (access === 'read' && highestAccess === 'none') highestAccess = 'read'
    })
    
    return highestAccess
  }

  const getRoleConfig = (roleName = currentRole) => {
    if (ROLE_GROUPS[roleName]) {
      const group = ROLE_GROUPS[roleName]
      
      const combinedTabs = {}
      const allGroupRoles = [...group.requiredRoles, ...group.optionalRoles]
      
      allGroupRoles.forEach(role => {
        if (activeRoles.includes(role)) {
          const roleConfig = ROLE_PERMISSIONS[role]
          if (roleConfig && roleConfig.tabs) {
            Object.entries(roleConfig.tabs).forEach(([tabId, tabConfig]) => {
              if (!combinedTabs[tabId] || combinedTabs[tabId].access === 'read') {
                combinedTabs[tabId] = tabConfig
              }
            })
          }
        }
      })
      
      return {
        ...group,
        tabs: combinedTabs
      }
    }
    const roleConfig = ROLE_PERMISSIONS[roleName]
    if (roleConfig) {
      return roleConfig
    }
    // Fallback to first available role if currentRole is invalid
    if (availableRoles.length > 0) {
      const fallbackRole = availableRoles[0]
      return ROLE_PERMISSIONS[fallbackRole]
    }
    // Last resort fallback - should never happen
    return {
      name: 'No Access',
      stytchRole: 'none',
      color: 'bg-gray-100 text-gray-800',
      icon: '🚫',
      tabs: {},
      permissions: [],
      regions: []
    }
  }

  const hasSystemPermission = (permission) => {
    return activeRoles.some(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      if (!roleConfig) return false
      
      if (roleConfig.permissions?.includes('*')) return true
      
      return roleConfig.permissions?.includes(permission) || false
    })
  }

  const hasRegionAccess = (region) => {
    // SystemAdmin always has region access
    if (isAdmin()) {
      return true
    }
    
    return activeRoles.some(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      return roleConfig?.regions?.includes(region) || false
    })
  }

  const isAdmin = () => {
    return activeRoles.includes('SystemAdmin')
  }

  const isUserAdmin = () => {
    return activeRoles.some(role => ['UserAdmin', 'SystemAdmin'].includes(role))
  }

  const canAccessAdminFeatures = () => {
    return activeRoles.some(role => ['SystemAdmin', 'UserAdmin'].includes(role))
  }

  const canViewCatalogs = (region = null) => {
    // SystemAdmin always has access
    if (isAdmin()) {
      return true
    }
    
    if (region) {
      const regionAccess = hasRegionAccess(region)
      const systemPermission = hasSystemPermission('catalog_view')
      return regionAccess || systemPermission
    }
    
    const systemPermission = hasSystemPermission('catalog_view')
    const hasSpecificRole = activeRoles.some(role => ['CatalogAmer', 'CatalogEmea', 'CatalogApj', 'CatalogLa', 'SystemAdmin'].includes(role))
    return systemPermission || hasSpecificRole
  }

  const canEditCatalogs = (region = null) => {
    if (region) {
      const hasRegion = hasRegionAccess(region)
      // Use the correct role names that match our ROLE_PERMISSIONS keys
      const expectedRoles = {
        'AMER': 'CatalogAmericas',
        'EMEA': 'CatalogEMEA', 
        'APAC': 'CatalogAPAC'  // Fixed: Database uses APAC region code
      }
      const expectedRole = expectedRoles[region]
      const hasRole = activeRoles.some(role => [expectedRole, 'SystemAdmin'].includes(role))
      
      return hasRegion && hasRole
    }
    
    return activeRoles.some(role => ['CatalogAmericas', 'CatalogEMEA', 'CatalogAPAC', 'SystemAdmin'].includes(role))  // Updated role names
  }

  const canViewPricing = (region = null) => {
    if (region) {
      return hasRegionAccess(region) && hasSystemPermission('pricing_view')
    }
    return hasSystemPermission('pricing_view') || 
           activeRoles.some(role => ['CatalogAmer', 'CatalogEmea', 'CatalogApj', 'CatalogLa', 'SystemAdmin'].includes(role))
  }

  const canEditPricing = (region = null) => {
    if (region) {
      return hasRegionAccess(region) && 
             activeRoles.some(role => [`Pricing${region}`, 'SystemAdmin'].includes(role))
    }
    return activeRoles.some(role => ['CatalogAmericas', 'CatalogEMEA', 'CatalogAPAC', 'SystemAdmin'].includes(role))  // Updated role names
  }

  const canApprove = (type, region) => {
    const approvalRoleMap = {
      'pricing': {
        'AMER': ['CatalogAmericas', 'SystemAdmin'], // Catalog roles handle pricing approval
        'EMEA': ['CatalogEMEA', 'SystemAdmin'],
        'APAC': ['CatalogAPAC', 'SystemAdmin']  // Fixed: Database uses APAC, removed LA
      },
      'catalog': {
        'AMER': ['CatalogAmericas', 'SystemAdmin'],
        'EMEA': ['CatalogEMEA', 'SystemAdmin'],
        'APAC': ['CatalogAPAC', 'SystemAdmin']  // Fixed: Database uses APAC, removed LA
      }
    }
    
    return activeRoles.some(role => 
      approvalRoleMap[type]?.[region]?.includes(role)
    )
  }

  const value = {
    currentRole,
    availableRoles,
    activeRoles,
    currentRoleGroup,
    switchRole,
    hasPermission,
    getTabAccess,
    getRoleConfig,
    hasSystemPermission,
    hasRegionAccess,
    isAdmin,
    isUserAdmin,
    canAccessAdminFeatures,
    canViewCatalogs,
    canEditCatalogs,
    canViewPricing,
    canEditPricing,
    canApprove,
    roleConfig: getRoleConfig(),
    allRoles: ROLE_PERMISSIONS,
    roleGroups: ROLE_GROUPS
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export default RoleContext