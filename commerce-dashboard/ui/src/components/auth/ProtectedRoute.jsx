import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import LoginPage from '../../pages/LoginPage'

export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Authenticating..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <LoginPage />
  }

  return children
}

export default ProtectedRoute