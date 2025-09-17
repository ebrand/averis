/**
 * Cross-App Navigation Utility for Order Management System
 * Handles navigation between Dashboard, OMS, and other applications with token passing
 */

// Application registry with ports and descriptions
const PLATFORM_APPS = {
  dashboard: {
    port: 3012,
    url: 'http://localhost:3012',
    name: 'Averis Dashboard',
    description: 'System monitoring & management'
  },
  product: {
    port: 3001,
    url: 'http://localhost:3001',
    name: 'Averis Product',
    description: 'Product master data management'
  },
  pricing: {
    port: 3003,
    url: 'http://localhost:3003',
    name: 'Averis Pricing',
    description: 'Pricing & catalog management'
  },
  customer: {
    port: 3007,
    url: 'http://localhost:3007',
    name: 'Averis Customer',
    description: 'Customer relationship management'
  },
  oms: {
    port: 3005,
    url: 'http://localhost:3005',
    name: 'Order Management',
    description: 'Order management system'
  },
  erp: {
    port: 3006,
    url: 'http://localhost:3006',
    name: 'Enterprise Resource',
    description: 'Enterprise resource planning'
  }
}

/**
 * Navigate to another platform application with authentication token
 * @param {string} appKey - The target application key (dashboard, product, pricing, customer, erp)
 * @param {string} path - Optional path within the target app (default: '/')
 * @param {boolean} openInNewTab - Whether to open in a new tab (default: false)
 */
export const navigateToApp = (appKey, path = '/', openInNewTab = false) => {
  const targetApp = PLATFORM_APPS[appKey]
  
  if (!targetApp) {
    console.error(`Unknown application: ${appKey}. Available apps:`, Object.keys(PLATFORM_APPS))
    return false
  }

  // Get current authentication token
  const token = localStorage.getItem('stytch_session_token')
  const sessionData = localStorage.getItem('stytch_session')
  
  if (!token) {
    console.warn('No authentication token found. User may need to login.')
    // Still navigate, but without token - the target app will handle authentication
  }

  // Build target URL with authentication parameters
  const targetUrl = new URL(path, targetApp.url)
  
  // Add authentication data as URL parameters
  if (token) {
    targetUrl.searchParams.set('auth_token', token)
  }
  
  if (sessionData) {
    // Compress session data for URL (base64 encode)
    try {
      const compressedSession = btoa(sessionData)
      targetUrl.searchParams.set('auth_session', compressedSession)
    } catch (error) {
      console.warn('Failed to encode session data:', error)
    }
  }

  // Add source app for tracking
  targetUrl.searchParams.set('source', 'order-management')
  
  // Navigate to target application
  if (openInNewTab) {
    window.open(targetUrl.toString(), '_blank')
  } else {
    window.location.href = targetUrl.toString()
  }
  
  return true
}

/**
 * Navigate back to Dashboard with current authentication token
 * @param {string} path - Path to navigate to in Dashboard (default: '/')
 * @param {boolean} openInNewTab - Whether to open in a new tab
 */
export const navigateToDashboard = (path = '/', openInNewTab = false) => {
  const dashboardUrl = 'http://localhost:3012'
  const token = localStorage.getItem('stytch_session_token')
  
  try {
    const targetUrl = new URL(path, dashboardUrl)
    
    // Add authentication token if available
    if (token) {
      targetUrl.searchParams.set('auth_token', token)
      targetUrl.searchParams.set('source', 'order-management')
      console.log('Order Management: Navigating to Dashboard with authentication token')
    }
    
    if (openInNewTab) {
      window.open(targetUrl.toString(), '_blank')
    } else {
      window.location.href = targetUrl.toString()
    }
  } catch (error) {
    console.error('Product MDM: Failed to navigate to Dashboard:', error)
    // Fallback navigation without token
    if (openInNewTab) {
      window.open(dashboardUrl, '_blank')
    } else {
      window.location.href = dashboardUrl
    }
  }
}

/**
 * Navigate to Pricing MDM with current authentication token
 * @param {string} path - Path to navigate to in Pricing MDM (default: '/products')
 * @param {boolean} openInNewTab - Whether to open in a new tab
 */
export const navigateToPricingMdm = (path = '/products', openInNewTab = false) => {
  const pricingUrl = 'http://localhost:3003'
  const token = localStorage.getItem('stytch_session_token')
  
  try {
    const targetUrl = new URL(path, pricingUrl)
    
    // Add authentication token if available
    if (token) {
      targetUrl.searchParams.set('auth_token', token)
      targetUrl.searchParams.set('source', 'order-management')
      console.log('Order Management: Navigating to Pricing MDM with authentication token')
    }
    
    if (openInNewTab) {
      window.open(targetUrl.toString(), '_blank')
    } else {
      window.location.href = targetUrl.toString()
    }
  } catch (error) {
    console.error('Product MDM: Failed to navigate to Pricing MDM:', error)
    // Fallback navigation without token
    if (openInNewTab) {
      window.open(pricingUrl, '_blank')
    } else {
      window.location.href = pricingUrl
    }
  }
}

/**
 * Navigate to Customer MDM with current authentication token
 * @param {string} path - Path to navigate to in Customer MDM (default: '/customers')
 * @param {boolean} openInNewTab - Whether to open in a new tab
 */
export const navigateToCustomerMdm = (path = '/customers', openInNewTab = false) => {
  const customerUrl = 'http://localhost:3007'
  const token = localStorage.getItem('stytch_session_token')
  
  try {
    const targetUrl = new URL(path, customerUrl)
    
    // Add authentication token if available
    if (token) {
      targetUrl.searchParams.set('auth_token', token)
      targetUrl.searchParams.set('source', 'order-management')
      console.log('Order Management: Navigating to Customer MDM with authentication token')
    }
    
    if (openInNewTab) {
      window.open(targetUrl.toString(), '_blank')
    } else {
      window.location.href = targetUrl.toString()
    }
  } catch (error) {
    console.error('Product MDM: Failed to navigate to Customer MDM:', error)
    // Fallback navigation without token
    if (openInNewTab) {
      window.open(customerUrl, '_blank')
    } else {
      window.location.href = customerUrl
    }
  }
}

/**
 * Handle navigation with keyboard modifier detection
 * @param {Event} event - Click event
 * @param {string} path - Path to navigate to
 */
export const handleDashboardNavigation = (event, path = '/') => {
  const openInNewTab = event.ctrlKey || event.metaKey
  event.preventDefault()
  navigateToDashboard(path, openInNewTab)
}

/**
 * Handle navigation with keyboard modifier detection for Pricing MDM
 * @param {Event} event - Click event
 * @param {string} path - Path to navigate to
 */
export const handlePricingMdmNavigation = (event, path = '/products') => {
  const openInNewTab = event.ctrlKey || event.metaKey
  event.preventDefault()
  navigateToPricingMdm(path, openInNewTab)
}

/**
 * Handle navigation with keyboard modifier detection for Customer MDM
 * @param {Event} event - Click event
 * @param {string} path - Path to navigate to
 */
export const handleCustomerMdmNavigation = (event, path = '/customers') => {
  const openInNewTab = event.ctrlKey || event.metaKey
  event.preventDefault()
  navigateToCustomerMdm(path, openInNewTab)
}

export default {
  navigateToApp,
  navigateToDashboard,
  handleDashboardNavigation,
  navigateToPricingMdm,
  handlePricingMdmNavigation,
  navigateToCustomerMdm,
  handleCustomerMdmNavigation,
  PLATFORM_APPS
}