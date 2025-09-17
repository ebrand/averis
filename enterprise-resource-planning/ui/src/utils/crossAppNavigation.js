/**
 * Cross-App Navigation Utility
 * Handles secure token passing between Averis platform applications
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
  averis_ecomm: {
    port: 3004,
    url: 'http://localhost:3004',
    name: 'Averis Store',
    description: 'E-commerce platform'
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
 * @param {string} appKey - The target application key (product, pricing, averis_ecomm)
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
  targetUrl.searchParams.set('source', 'erp')
  
  // Navigate to target application
  if (openInNewTab) {
    window.open(targetUrl.toString(), '_blank')
  } else {
    window.location.href = targetUrl.toString()
  }
  
  return true
}

/**
 * Get list of available platform applications
 * @returns {Array} Array of app objects with metadata
 */
export const getPlatformApps = () => {
  return Object.entries(PLATFORM_APPS).map(([key, app]) => ({
    key,
    ...app
  }))
}

/**
 * Check if a specific app is currently available (basic health check)
 * @param {string} appKey - The application key to check
 * @returns {Promise<boolean>} Promise that resolves to availability status
 */
export const checkAppAvailability = async (appKey) => {
  const targetApp = PLATFORM_APPS[appKey]
  
  if (!targetApp) {
    return false
  }

  try {
    // Simple fetch to check if app is responding
    const response = await fetch(`${targetApp.url}/`, { 
      method: 'HEAD',
      mode: 'no-cors',
      timeout: 5000
    })
    return true // If we get here, the app is available
  } catch (error) {
    console.warn(`App ${appKey} may not be available:`, error.message)
    return false
  }
}

/**
 * Create a navigation handler for React components
 * @param {string} appKey - The target application key
 * @param {string} path - Optional path within the target app
 * @returns {Function} Click handler function
 */
export const createNavHandler = (appKey, path = '/') => {
  return (event) => {
    event.preventDefault()
    
    // Check for modifier keys (Ctrl, Cmd, middle-click) to open in new tab
    const openInNewTab = event.ctrlKey || event.metaKey || event.button === 1
    
    navigateToApp(appKey, path, openInNewTab)
  }
}

// Specific navigation functions for easy imports
export const navigateToDashboard = (path = '/') => navigateToApp('dashboard', path)
export const navigateToProductMdm = (path = '/') => navigateToApp('product', path)
export const navigateToPricingMdm = (path = '/') => navigateToApp('pricing', path)
export const navigateToCustomerMdm = (path = '/') => navigateToApp('customer', path)
export const navigateToEcommerce = (path = '/') => navigateToApp('averis_ecomm', path)

export default {
  navigateToApp,
  getPlatformApps,
  checkAppAvailability,
  createNavHandler,
  navigateToDashboard,
  navigateToProductMdm,
  navigateToPricingMdm,
  navigateToCustomerMdm,
  navigateToEcommerce,
  PLATFORM_APPS
}