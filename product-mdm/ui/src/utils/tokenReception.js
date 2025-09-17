/**
 * Token Reception Utility
 * Handles incoming authentication tokens from cross-app navigation
 */

/**
 * Process incoming authentication tokens from URL parameters
 * Should be called during app initialization
 */
export const processIncomingAuth = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const authToken = urlParams.get('auth_token')
  const authSession = urlParams.get('auth_session')
  const source = urlParams.get('source')
  
  let tokenProcessed = false

  // Process authentication token
  if (authToken) {
    console.log(`Receiving authentication token from ${source || 'unknown source'}`)
    
    try {
      // Store the token in localStorage
      localStorage.setItem('stytch_session_token', authToken)
      tokenProcessed = true
      
      // Log successful token reception
      console.log('Authentication token successfully received and stored')
    } catch (error) {
      console.error('Failed to store authentication token:', error)
    }
  }

  // Process session data
  if (authSession) {
    try {
      // Decode base64-encoded session data
      const decodedSession = atob(authSession)
      localStorage.setItem('stytch_session', decodedSession)
      
      console.log('Session data successfully received and stored')
    } catch (error) {
      console.error('Failed to decode and store session data:', error)
    }
  }

  // Clean up URL parameters after processing
  if (tokenProcessed || authSession) {
    cleanupAuthParams()
  }

  return {
    tokenReceived: !!authToken,
    sessionReceived: !!authSession,
    source: source || null
  }
}

/**
 * Remove authentication parameters from URL without page reload
 */
export const cleanupAuthParams = () => {
  const url = new URL(window.location)
  const paramsToRemove = ['auth_token', 'auth_session', 'source']
  
  let hasChanges = false
  paramsToRemove.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param)
      hasChanges = true
    }
  })
  
  if (hasChanges) {
    // Update URL without page reload
    window.history.replaceState({}, document.title, url.toString())
    console.log('Authentication parameters cleaned from URL')
  }
}

/**
 * Check if current session is valid
 * @returns {boolean} True if user appears to be authenticated
 */
export const hasValidSession = () => {
  const token = localStorage.getItem('stytch_session_token')
  const session = localStorage.getItem('stytch_session')
  
  // Basic validation - token exists and is not empty
  return !!(token && token.trim() !== '')
}

/**
 * Enhanced token manager that works with cross-app authentication
 */
export const crossAppTokenManager = {
  getToken: () => {
    return localStorage.getItem('stytch_session_token')
  },
  
  setToken: (token) => {
    localStorage.setItem('stytch_session_token', token)
  },
  
  removeToken: () => {
    localStorage.removeItem('stytch_session_token')
    localStorage.removeItem('stytch_session')
    localStorage.removeItem('stytch_last_auth_time')
  },
  
  isAuthenticated: () => {
    return hasValidSession()
  },
  
  // New method for cross-app scenarios
  processIncomingAuth: () => {
    return processIncomingAuth()
  }
}

/**
 * React hook for handling cross-app authentication
 * @returns {Object} Authentication state and processing results
 */
export const useCrossAppAuth = () => {
  const [authState, setAuthState] = React.useState({
    isProcessed: false,
    tokenReceived: false,
    sessionReceived: false,
    source: null
  })

  React.useEffect(() => {
    const result = processIncomingAuth()
    setAuthState({
      isProcessed: true,
      ...result
    })
  }, [])

  return {
    ...authState,
    hasValidSession: hasValidSession(),
    cleanupAuthParams
  }
}

export default {
  processIncomingAuth,
  cleanupAuthParams,
  hasValidSession,
  crossAppTokenManager,
  useCrossAppAuth
}