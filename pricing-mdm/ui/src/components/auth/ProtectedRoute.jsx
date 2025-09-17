import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // If not authenticated and not loading, redirect to centralized login
    if (!isAuthenticated && !isLoading) {
      console.log('Pricing MDM ProtectedRoute: User not authenticated, redirecting to centralized login')
      window.location.href = 'http://localhost:3012/login'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Authenticating..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Show loading while redirect is happening
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Redirecting to login..." />
      </div>
    )
  }

  return children
}

export default ProtectedRoute