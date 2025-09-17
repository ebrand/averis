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

// Map Stytch roles to our internal role system
const STYTCH_ROLE_MAPPING = {
  'product_view': 'ProductViewer',
  'product_marketing': 'Marketing',
  'product_legal': 'Legal', 
  'product_finance': 'Finance',
  'product_salesops': 'SalesOps',
  'product_contracts': 'Contracts',
  'product_admin': 'ProductAdmin',
  'product_launch': 'ProductLaunch',
  'product_marketing_approve': 'MarketingApproval',
  'product_legal_approve': 'LegalApproval',
  'product_finance_approve': 'FinanceApproval',
  'product_salesops_approve': 'SalesOpsApproval',
  'product_contracts_approve': 'ContractsApproval',
  // Catalog Management Roles
  'catalog_amer': 'CatalogAmericas',
  'catalog_emea': 'CatalogEmea',
  'catalog_manager': 'CatalogManager',
  // Pricing MDM Roles
  'averis_pricing': 'PricingMdm',
  'pricing_analyst': 'PricingAnalyst',
  'pricing_manager': 'PricingManager',
  'pricing_approve': 'PricingApproval',
  // E-commerce Roles
  'ecommerce_manager': 'EcommerceManager',
  // Inventory MDM Roles
  'inventory_analyst': 'InventoryAnalyst',
  'inventory_manager': 'InventoryManager',
  // ERP Roles
  'erp_user': 'ErpUser',
  'erp_admin': 'ErpAdmin',
  // Administrative Roles
  'admin': 'SystemAdmin',
  'user_admin': 'UserAdmin'
}

// Define role groups - allows combining multiple roles into one logical group
const ROLE_GROUPS = {
  MarketingGroup: {
    name: 'Marketing',
    icon: '📱',
    color: 'bg-purple-100 text-purple-800',
    description: 'Marketing and approval permissions',
    requiredRoles: ['Marketing'], // Must have this role
    optionalRoles: ['MarketingApproval'], // Will include if user has this
    combinedPermissions: ['marketing_edit', 'marketing_approval']
  },
  LegalGroup: {
    name: 'Legal',
    icon: '⚖️',
    color: 'bg-blue-100 text-blue-800',
    description: 'Legal and approval permissions',
    requiredRoles: ['Legal'],
    optionalRoles: ['LegalApproval'],
    combinedPermissions: ['legal_edit', 'legal_approval']
  },
  FinanceGroup: {
    name: 'Finance',
    icon: '💰',
    color: 'bg-green-100 text-green-800',
    description: 'Finance and approval permissions',
    requiredRoles: ['Finance'],
    optionalRoles: ['FinanceApproval'],
    combinedPermissions: ['finance_edit', 'finance_approval']
  },
  SalesOpsGroup: {
    name: 'Sales Operations',
    icon: '📊',
    color: 'bg-orange-100 text-orange-800',
    description: 'Sales operations and approval permissions',
    requiredRoles: ['SalesOps'],
    optionalRoles: ['SalesOpsApproval'],
    combinedPermissions: ['salesops_edit', 'salesops_approval']
  },
  ContractsGroup: {
    name: 'Contracts',
    icon: '📋',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Contracts and approval permissions',
    requiredRoles: ['Contracts'],
    optionalRoles: ['ContractsApproval'],
    combinedPermissions: ['contracts_edit', 'contracts_approval']
  },
  CatalogAmericasGroup: {
    name: 'Catalog - Americas',
    icon: '🌎',
    color: 'bg-teal-100 text-teal-800',
    description: 'Catalog management for Americas region',
    requiredRoles: ['CatalogAmericas'],
    optionalRoles: [],
    combinedPermissions: ['catalog_edit', 'catalog_view']
  },
  CatalogEmeaGroup: {
    name: 'Catalog - EMEA',
    icon: '🌍',
    color: 'bg-cyan-100 text-cyan-800',
    description: 'Catalog management for EMEA region',
    requiredRoles: ['CatalogEmea'],
    optionalRoles: [],
    combinedPermissions: ['catalog_edit', 'catalog_view']
  },
  PricingGroup: {
    name: 'Pricing Management',
    icon: '💲',
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Pricing and pricing workflow permissions',
    requiredRoles: ['PricingMdm'],
    optionalRoles: ['PricingAnalyst', 'PricingManager', 'PricingApproval'],
    combinedPermissions: ['pricing_edit', 'pricing_approval']
  }
}

// Define role capabilities
const ROLE_PERMISSIONS = {
  ProductViewer: {
    name: 'Product Viewer',
    stytchRole: 'product_view',
    color: 'bg-gray-100 text-gray-800',
    icon: '👁️',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['product_view']
  },
  Marketing: {
    name: 'Product Marketing',
    stytchRole: 'product_marketing',
    color: 'bg-purple-100 text-purple-800',
    icon: '📱',
    tabs: {
      marketing: { access: 'write', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    }
  },
  Legal: {
    name: 'Product Legal',
    stytchRole: 'product_legal',
    color: 'bg-blue-100 text-blue-800',
    icon: '⚖️',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'write', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    }
  },
  Finance: {
    name: 'Product Finance',
    stytchRole: 'product_finance',
    color: 'bg-green-100 text-green-800',
    icon: '💰',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'write', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    }
  },
  SalesOps: {
    name: 'Sales Operations',
    stytchRole: 'product_salesops',
    color: 'bg-orange-100 text-orange-800',
    icon: '📊',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'write', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    }
  },
  Contracts: {
    name: 'Product Contracts',
    stytchRole: 'product_contracts',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '📋',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'write', label: 'Contracts & Services' }
    }
  },
  ProductAdmin: {
    name: 'Product Admin',
    stytchRole: 'product_admin',
    color: 'bg-red-100 text-red-800',
    icon: '👑',
    tabs: {
      marketing: { access: 'write', label: 'Marketing & Product Info' },
      legal: { access: 'write', label: 'Legal' },
      finance: { access: 'write', label: 'Finance' },
      sales: { access: 'write', label: 'Sales Ops' },
      contracts: { access: 'write', label: 'Contracts & Services' }
    },
    permissions: ['product_management', 'product_edit', 'product_delete', 'product_approve']
  },
  ProductLaunch: {
    name: 'Product Launch',
    stytchRole: 'product_launch',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚀',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['product_launch', 'product_view']
  },
  MarketingApproval: {
    name: 'Marketing Approval',
    stytchRole: 'product_marketing_approve',
    color: 'bg-purple-200 text-purple-900',
    icon: '✅',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['marketing_approval', 'product_view']
  },
  LegalApproval: {
    name: 'Legal Approval',
    stytchRole: 'product_legal_approve',
    color: 'bg-blue-200 text-blue-900',
    icon: '✅',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['legal_approval', 'product_view']
  },
  FinanceApproval: {
    name: 'Finance Approval',
    stytchRole: 'product_finance_approve',
    color: 'bg-green-200 text-green-900',
    icon: '✅',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['finance_approval', 'product_view']
  },
  SalesOpsApproval: {
    name: 'Sales Ops Approval',
    stytchRole: 'product_salesops_approve',
    color: 'bg-orange-200 text-orange-900',
    icon: '✅',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['salesops_approval', 'product_view']
  },
  ContractsApproval: {
    name: 'Contracts Approval',
    stytchRole: 'product_contracts_approve',
    color: 'bg-indigo-200 text-indigo-900',
    icon: '✅',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['contracts_approval', 'product_view']
  },
  SystemAdmin: {
    name: 'System Administrator',
    stytchRole: 'admin',
    color: 'bg-gray-900 text-white',
    icon: '⚡',
    tabs: {
      marketing: { access: 'write', label: 'Marketing & Product Info' },
      legal: { access: 'write', label: 'Legal' },
      finance: { access: 'write', label: 'Finance' },
      sales: { access: 'write', label: 'Sales Ops' },
      contracts: { access: 'write', label: 'Contracts & Services' }
    },
    permissions: ['*'] // All permissions
  },
  UserAdmin: {
    name: 'User Administrator',
    stytchRole: 'user_admin',
    color: 'bg-blue-900 text-white',
    icon: '👥',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['user_management', 'user_create', 'user_edit', 'user_delete', 'role_assignment']
  },
  CatalogAmericas: {
    name: 'Catalog - Americas',
    stytchRole: 'catalog_amer',
    color: 'bg-teal-100 text-teal-800',
    icon: '🌎',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['catalog_edit', 'catalog_view', 'product_view']
  },
  CatalogEmea: {
    name: 'Catalog - EMEA',
    stytchRole: 'catalog_emea',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '🌍',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['catalog_edit', 'catalog_view', 'product_view']
  },
  CatalogManager: {
    name: 'Catalog Manager',
    stytchRole: 'catalog_manager',
    color: 'bg-teal-200 text-teal-900',
    icon: '🗂️',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['catalog_edit', 'catalog_view', 'product_view', 'catalog_management']
  },
  PricingMdm: {
    name: 'Pricing MDM',
    stytchRole: 'averis_pricing',
    color: 'bg-emerald-100 text-emerald-800',
    icon: '💲',
    tabs: {
      marketing: { access: 'read', label: 'Marketing & Product Info' },
      legal: { access: 'read', label: 'Legal' },
      finance: { access: 'read', label: 'Finance' },
      sales: { access: 'read', label: 'Sales Ops' },
      contracts: { access: 'read', label: 'Contracts & Services' }
    },
    permissions: ['pricing_edit', 'pricing_view', 'product_view']
  }
}

export const RoleProvider = ({ children }) => {
  const { user } = useAuth()
  
  // Load current role from localStorage or set default
  const getInitialRole = () => {
    try {
      const saved = localStorage.getItem('currentRole')
      return saved || 'MarketingGroup'
    } catch (error) {
      console.warn('Failed to load role from localStorage:', error)
      return 'MarketingGroup'
    }
  }
  
  const [currentRole, setCurrentRole] = useState(getInitialRole) // Default role
  const [availableRoles, setAvailableRoles] = useState(['MarketingGroup'])
  const [currentRoleGroup, setCurrentRoleGroup] = useState(null) // Track active group
  const [activeRoles, setActiveRoles] = useState(['Marketing']) // Track actual roles being applied

  useEffect(() => {
    if (user) {
      // In a real app, roles would come from the user object or API
      // For demo purposes, we'll assign roles based on email or allow role switching
      const { individualRoles, availableRoles: userAvailableRoles } = determineUserRoles(user)
      setAvailableRoles(userAvailableRoles)
      
      // Set default role to the first available role
      if (userAvailableRoles.length > 0 && !userAvailableRoles.includes(currentRole)) {
        setCurrentRole(userAvailableRoles[0])
      }
      
      // Update active roles based on current selection
      updateActiveRoles(currentRole, individualRoles)
    }
  }, [user, currentRole])
  
  const updateActiveRoles = (selectedRole, userIndividualRoles) => {
    if (ROLE_GROUPS[selectedRole]) {
      // This is a role group - combine roles
      const group = ROLE_GROUPS[selectedRole]
      const combinedRoles = [...group.requiredRoles]
      
      // Add optional roles if user has them
      group.optionalRoles.forEach(optionalRole => {
        if (userIndividualRoles.includes(optionalRole)) {
          combinedRoles.push(optionalRole)
        }
      })
      
      setActiveRoles(combinedRoles)
      setCurrentRoleGroup(group)
      console.log(`Activated role group ${selectedRole} with roles:`, combinedRoles)
    } else {
      // This is an individual role
      setActiveRoles([selectedRole])
      setCurrentRoleGroup(null)
      console.log(`Activated individual role:`, selectedRole)
    }
  }

  const determineUserRoles = (user) => {
    // Extract Stytch roles from the user object
    const stytchRoles = user.roles || []
    const userIndividualRoles = []
    
    console.log('User Stytch roles:', stytchRoles)
    
    // Map Stytch roles to our internal roles
    stytchRoles.forEach(role => {
      const mappedRole = STYTCH_ROLE_MAPPING[role]
      if (mappedRole && !userIndividualRoles.includes(mappedRole)) {
        userIndividualRoles.push(mappedRole)
      }
    })
    
    // Fallback: if user has no product roles, give them Marketing access
    if (userIndividualRoles.length === 0) {
      console.log('No product roles found, defaulting to Marketing')
      userIndividualRoles.push('Marketing')
    }
    
    console.log('Mapped individual roles:', userIndividualRoles)
    
    // Now determine which role groups are available
    const availableGroups = []
    
    // Check each role group
    Object.entries(ROLE_GROUPS).forEach(([groupKey, groupConfig]) => {
      // Check if user has all required roles for this group
      const hasRequiredRoles = groupConfig.requiredRoles.every(role => 
        userIndividualRoles.includes(role)
      )
      
      if (hasRequiredRoles) {
        availableGroups.push(groupKey)
      }
    })
    
    // Add individual roles that don't belong to groups
    const ungroupedRoles = userIndividualRoles.filter(role => {
      // Check if this role is part of any group's required or optional roles
      const isInGroup = Object.values(ROLE_GROUPS).some(group => 
        group.requiredRoles.includes(role) || group.optionalRoles.includes(role)
      )
      return !isInGroup
    })
    
    const finalAvailableRoles = [...availableGroups, ...ungroupedRoles]
    
    console.log('Available role groups and individual roles:', finalAvailableRoles)
    return { individualRoles: userIndividualRoles, availableRoles: finalAvailableRoles }
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
      
      // Determine user's individual roles to update active roles
      if (user) {
        const { individualRoles } = determineUserRoles(user)
        updateActiveRoles(newRole, individualRoles)
      }
      console.log(`Switched to ${newRole} role`)
    }
  }

  const hasPermission = (tab, permission = 'read') => {
    // Check permissions across all active roles
    return activeRoles.some(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      if (!roleConfig || !roleConfig.tabs[tab]) return false
      
      const tabAccess = roleConfig.tabs[tab].access
      if (permission === 'read') return true // Everyone can read
      if (permission === 'write') return tabAccess === 'write'
      
      return false
    })
  }

  const getTabAccess = (tab, approvals = {}) => {
    // Check if tab is approved - if so, it should be read-only for ALL users
    const isTabApproved = approvals[tab]?.approved === true
    
    if (isTabApproved) {
      // If tab is approved, make it read-only for everyone until approval is scrubbed
      return 'read'
    }
    
    // Return highest access level from all active roles
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
    // If it's a role group, return a config that combines tab access from active roles
    if (ROLE_GROUPS[roleName]) {
      const group = ROLE_GROUPS[roleName]
      
      // Create combined tabs config from all roles in the group
      const combinedTabs = {}
      const allGroupRoles = [...group.requiredRoles, ...group.optionalRoles]
      
      // Check each role that might be in this group
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
    // Otherwise return individual role config
    return ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS.Marketing
  }

  const hasSystemPermission = (permission) => {
    // Check permissions across all active roles
    return activeRoles.some(role => {
      const roleConfig = ROLE_PERMISSIONS[role]
      if (!roleConfig) return false
      
      // SystemAdmin has all permissions
      if (roleConfig.permissions?.includes('*')) return true
      
      // Check specific permission
      return roleConfig.permissions?.includes(permission) || false
    })
  }

  const isAdmin = () => {
    return activeRoles.includes('SystemAdmin')
  }

  const isUserAdmin = () => {
    return activeRoles.some(role => ['UserAdmin', 'SystemAdmin'].includes(role))
  }

  const isProductAdmin = () => {
    return activeRoles.some(role => ['ProductAdmin', 'SystemAdmin'].includes(role))
  }

  const canAccessAdminFeatures = () => {
    return activeRoles.some(role => ['SystemAdmin', 'UserAdmin', 'ProductAdmin'].includes(role))
  }

  const canViewProducts = () => {
    return hasSystemPermission('product_view') || 
           activeRoles.some(role => ['Marketing', 'Legal', 'Finance', 'SalesOps', 'Contracts', 'ProductAdmin', 'SystemAdmin'].includes(role))
  }

  const canEditProducts = () => {
    return activeRoles.some(role => ['Marketing', 'Legal', 'Finance', 'SalesOps', 'Contracts', 'ProductAdmin', 'SystemAdmin'].includes(role))
  }

  const canLaunchProducts = () => {
    return activeRoles.some(role => ['ProductLaunch', 'SystemAdmin'].includes(role))
  }

  const canApproveTab = (tabId) => {
    const approvalRoleMap = {
      'marketing': ['MarketingApproval', 'SystemAdmin'],
      'legal': ['LegalApproval', 'SystemAdmin'],
      'finance': ['FinanceApproval', 'SystemAdmin'],
      'sales': ['SalesOpsApproval', 'SystemAdmin'],
      'contracts': ['ContractsApproval', 'SystemAdmin']
    }
    
    // Check if any of the active roles can approve this tab
    return activeRoles.some(role => 
      approvalRoleMap[tabId]?.includes(role)
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
    isAdmin,
    isUserAdmin,
    isProductAdmin,
    canAccessAdminFeatures,
    canViewProducts,
    canEditProducts,
    canLaunchProducts,
    canApproveTab,
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