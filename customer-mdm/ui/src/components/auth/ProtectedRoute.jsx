import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import LoginPage from '../../pages/LoginPage'
import { isRecentLogout, isForcedLogout, hasPermanentLogoutFlag } from '../../utils/centralizedLogout'

export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false)

  // Check if logout is in progress to prevent flash of local login page
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Check if any logout indicators are present
      const logoutInProgress = isRecentLogout() || isForcedLogout() || hasPermanentLogoutFlag()
      
      if (logoutInProgress) {
        console.log('🔄 Logout in progress detected - showing loading state instead of login page')
        setIsLogoutInProgress(true)
        
        // Clear the logout in progress state after a short delay
        // This handles cases where the redirect might not happen immediately
        setTimeout(() => {
          setIsLogoutInProgress(false)
        }, 2000)
      }
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Authenticating..." />
      </div>
    )
  }

  // Show loading state during logout to prevent flash of local login page
  if (isLogoutInProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Signing out..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <LoginPage />
  }

  return children
}

export default ProtectedRoute