// Centralized logout utility for multi-app authentication management

export const centralizedLogout = async () => {
  console.log('Centralized logout initiated')
  
  try {
    // Set logout timestamp first, before clearing session data
    const logoutTimestamp = Date.now().toString()
    localStorage.setItem('commerce_logout_timestamp', logoutTimestamp)
    localStorage.setItem('force_logout', 'true')
    
    // Set permanent logout flag that persists across page reloads
    setPermanentLogoutFlag()
    
    // Clear all localStorage keys that might contain session data
    const keysToRemove = [
      'stytch_session',
      'stytch_last_auth_time',
      'auth_token',
      'user_session'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      // Also try to clear from sessionStorage
      sessionStorage.removeItem(key)
    })
    
    // Note: Profile pictures are preserved across logout/login cycles
    // This follows modern UX patterns where user customizations persist
    // If you need to clear profile pictures for security reasons, uncomment below:
    // Object.keys(localStorage).forEach(key => {
    //   if (key.startsWith('profile_picture_')) {
    //     localStorage.removeItem(key)
    //   }
    // })
    
    // Clear any cookies that might contain session data
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=localhost")
    })
    
    console.log('Centralized logout: Local storage and cookies cleared')
    
    // Notify other windows/tabs of logout via BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const logoutChannel = new BroadcastChannel('commerce_logout')
      logoutChannel.postMessage({ 
        type: 'LOGOUT_ALL', 
        timestamp: logoutTimestamp 
      })
      logoutChannel.close()
    }
    
    // Use postMessage to notify any embedded iframes
    window.postMessage({ 
      type: 'LOGOUT_ALL', 
      timestamp: logoutTimestamp 
    }, '*')
    
    console.log('Centralized logout: Cross-window logout signals sent')
    
  } catch (error) {
    console.error('Error during centralized logout:', error)
  }
}

// Check if recent logout occurred (within last 5 minutes for better persistence)
export const isRecentLogout = () => {
  const logoutTimestamp = localStorage.getItem('commerce_logout_timestamp')
  if (!logoutTimestamp) return false
  
  const timeSinceLogout = Date.now() - parseInt(logoutTimestamp)
  console.log('isRecentLogout check:', { logoutTimestamp, timeSinceLogout, isRecent: timeSinceLogout < 300000 })
  return timeSinceLogout < 300000 // 5 minutes - extended window for better persistence
}

// Clear logout timestamp
export const clearLogoutTimestamp = () => {
  localStorage.removeItem('commerce_logout_timestamp')
}

// Check if force logout flag is set
export const isForcedLogout = () => {
  const flag = localStorage.getItem('force_logout')
  console.log('isForcedLogout check:', { flag, isForced: flag === 'true' })
  return flag === 'true'
}

// Clear force logout flag
export const clearForcedLogout = () => {
  localStorage.removeItem('force_logout')
}

export const redirectToCentralLogin = () => {
  console.log('Redirecting to central login')
  // Always redirect to Dashboard login (port 3012) with logout parameter
  const logoutTimestamp = Date.now()
  window.location.href = `http://localhost:3012/login?logout=${logoutTimestamp}`
}

export const performCentralizedLogout = async () => {
  await centralizedLogout()
  // Add a small delay to ensure all storage operations complete
  setTimeout(() => {
    redirectToCentralLogin()
  }, 100)
}

// Set a permanent logout flag that persists until explicitly cleared
export const setPermanentLogoutFlag = () => {
  const logoutSession = {
    timestamp: Date.now(),
    forced: true,
    permanent: true
  }
  localStorage.setItem('commerce_logout_session', JSON.stringify(logoutSession))
  console.log('✅ PERMANENT LOGOUT FLAG SET:', logoutSession)
}

// Check if permanent logout flag is set
export const hasPermanentLogoutFlag = () => {
  const logoutSession = localStorage.getItem('commerce_logout_session')
  if (!logoutSession) {
    console.log('❌ NO PERMANENT LOGOUT FLAG FOUND')
    return false
  }
  
  try {
    const session = JSON.parse(logoutSession)
    const hasFlag = session.permanent === true
    console.log('🔍 PERMANENT LOGOUT FLAG CHECK:', { session, hasFlag })
    return hasFlag
  } catch (error) {
    console.error('Error parsing logout session:', error)
    return false
  }
}

// Clear permanent logout flag (only after successful re-login)
export const clearPermanentLogoutFlag = () => {
  localStorage.removeItem('commerce_logout_session')
  console.log('🗑️ PERMANENT LOGOUT FLAG CLEARED')
}

// Listen for cross-app logout messages
if (typeof BroadcastChannel !== 'undefined') {
  const logoutChannel = new BroadcastChannel('commerce_logout')
  logoutChannel.addEventListener('message', (event) => {
    if (event.data.type === 'LOGOUT_ALL') {
      console.log('Received cross-app logout signal - clearing local session only')
      
      // Only clear local session data, DON'T send another broadcast message
      localStorage.setItem('commerce_logout_timestamp', event.data.timestamp)
      localStorage.setItem('force_logout', 'true')
      
      // Clear session data without triggering another broadcast
      const keysToRemove = ['stytch_session', 'stytch_last_auth_time', 'auth_token', 'user_session']
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      // Don't redirect here as the originating app will handle it
    }
  })
}

// Listen for postMessage events
window.addEventListener('message', (event) => {
  if (event.data.type === 'LOGOUT_ALL') {
    console.log('Received postMessage logout signal - clearing local session only')
    
    // Only clear local session data, DON'T send another broadcast message
    localStorage.setItem('commerce_logout_timestamp', event.data.timestamp)
    localStorage.setItem('force_logout', 'true')
    
    // Clear session data without triggering another broadcast
    const keysToRemove = ['stytch_session', 'stytch_last_auth_time', 'auth_token', 'user_session']
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    
    // Don't redirect here as the originating app will handle it
  }
})