/**
 * Cross-App Navigation Utility for E-commerce
 * Handles navigation back to Dashboard with token passing
 */

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
      targetUrl.searchParams.set('source', 'averis_ecomm')
      console.log('E-commerce: Navigating to Dashboard with authentication token')
    }
    
    if (openInNewTab) {
      window.open(targetUrl.toString(), '_blank')
    } else {
      window.location.href = targetUrl.toString()
    }
  } catch (error) {
    console.error('E-commerce: Failed to navigate to Dashboard:', error)
    // Fallback navigation without token
    if (openInNewTab) {
      window.open(dashboardUrl, '_blank')
    } else {
      window.location.href = dashboardUrl
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

export default {
  navigateToDashboard,
  handleDashboardNavigation
}