import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { stytch } from '../lib/stytch'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

export const AuthenticatePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const authenticateUser = async () => {
      console.log('AuthenticatePage: Starting authentication process')
      console.log('Current URL search params:', window.location.search)
      
      try {
        const token = searchParams.get('token')
        const stytch_token_type = searchParams.get('stytch_token_type')

        console.log('Extracted token:', token)
        console.log('Extracted token type:', stytch_token_type)

        // If no token params, this might be a refresh - redirect to home or login
        if (!token || !stytch_token_type) {
          console.log('No token parameters found, redirecting...')
          // Check if user is already authenticated
          const storedToken = localStorage.getItem('stytch_session_token')
          if (storedToken) {
            console.log('Found stored token, redirecting to home')
            navigate('/', { replace: true })
          } else {
            console.log('No stored token, redirecting to login')
            navigate('/login', { replace: true })
          }
          return
        }

        // Check if this might be a stale OAuth token (from a refresh)
        const lastAuthTime = localStorage.getItem('stytch_last_auth_time')
        const now = Date.now()
        console.log('Last auth time:', lastAuthTime, 'Current time:', now)
        
        if (lastAuthTime && (now - parseInt(lastAuthTime)) > 30 * 1000) { // 30 seconds - OAuth tokens expire very quickly
          console.log('OAuth token likely expired (older than 30s), redirecting based on stored session')
          const storedToken = localStorage.getItem('stytch_session_token')
          if (storedToken) {
            navigate('/', { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
          return
        }
        
        // Also check if we already have a valid session - no need to process OAuth token
        const storedSessionToken = localStorage.getItem('stytch_session_token')
        if (storedSessionToken) {
          console.log('Already have valid session token, redirecting to home')
          navigate('/', { replace: true })
          return
        }

        console.log('Processing OAuth token...')
        let authResult

        // Handle OAuth token with proper method
        if (stytch_token_type === 'oauth') {
          console.log('Authenticating OAuth token with Stytch...')
          // Use the authenticate method for OAuth tokens
          authResult = await stytch.oauth.authenticate(token, {
            session_duration_minutes: 60 // 60 minutes
          })
        } else {
          console.log('Authenticating session token with Stytch...')
          // Fallback for other token types
          authResult = await stytch.sessions.authenticate({
            session_token: token
          })
        }

        if (authResult && authResult.status_code === 200) {
          console.log('Authentication successful, logging in user')
          // Successfully authenticated
          login(authResult)
          // Use replace to clear the URL with OAuth tokens from history
          navigate('/', { replace: true })
        } else {
          console.error('Authentication failed:', authResult)
          navigate('/login?error=auth_failed')
        }
      } catch (error) {
        console.warn('Authentication error:', error.message || error)
        
        // Check if it's a token not found error - this is common for expired tokens
        if (error.error_type === 'oauth_token_not_found') {
          console.log('OAuth token not found - likely expired, checking for existing session')
          // Check if we actually have a session stored despite the error
          const storedToken = localStorage.getItem('stytch_session_token')
          if (storedToken) {
            console.log('Found existing session, redirecting to home')
            navigate('/', { replace: true })
          } else {
            console.log('No existing session, redirecting to login')
            navigate('/login?error=token_expired', { replace: true })
          }
        } else {
          navigate('/login?error=auth_error', { replace: true })
        }
      }
    }

    authenticateUser()
  }, [searchParams, navigate, login])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" text="Completing sign-in..." />
        <p className="mt-6 text-sm text-gray-600 max-w-md">
          Please wait while we securely sign you into your Product MDM account.
        </p>
      </div>
    </div>
  )
}

export default AuthenticatePage