import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { stytch } from '../lib/stytch'
import { ComputerDesktopIcon, ShieldCheckIcon, ServerIcon, ChartBarIcon, CubeIcon, GlobeAltIcon, BoltIcon } from '@heroicons/react/24/outline'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if there's a logout parameter in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const logoutParam = urlParams.get('logout')
    
    // Don't redirect to home if we have a logout parameter - let AuthContext process it first
    if (isAuthenticated && !logoutParam) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      
      // Use Stytch's proper OAuth flow with PKCE
      const redirectURL = `${window.location.origin}/authenticate`
      
      await stytch.oauth.google.start({
        login_redirect_url: redirectURL,
        signup_redirect_url: redirectURL
      })
    } catch (error) {
      console.error('Google login error:', error)
      setIsLoading(false)
    }
  }

  const handleAmazonLogin = async () => {
    try {
      setIsLoading(true)
      
      // Use Stytch's proper OAuth flow with PKCE for Amazon
      const redirectURL = `${window.location.origin}/authenticate`
      
      await stytch.oauth.amazon.start({
        login_redirect_url: redirectURL,
        signup_redirect_url: redirectURL
      })
    } catch (error) {
      console.error('Amazon login error:', error)
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: CubeIcon,
      title: 'Unified Product Management',
      description: 'Centralize product data across your entire organization with powerful MDM capabilities, automated workflows, and real-time synchronization.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Commerce Operations',
      description: 'Scale your business worldwide with region-specific pricing, multi-channel distribution, and localized product catalogs that adapt to any market.'
    },
    {
      icon: BoltIcon,
      title: 'Enterprise-Grade Performance',
      description: 'Built for high-volume operations with microservices architecture, real-time monitoring, and 99.9% uptime SLA for mission-critical commerce.'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center px-2 mb-8">
            <div className="flex items-center justify-center mb-6">
              <ComputerDesktopIcon className="h-12 w-12 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Averis</h1>
            <p className="text-lg text-gray-600 mt-2">Commerce Platform</p>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Choose your preferred authentication method
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                onClick={handleAmazonLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <path d="M14.71 11.56c-1.13 0.83-2.77 1.27-4.18 1.27c-1.98 0-3.74-0.73-5.08-1.94c-0.1-0.09-0.01-0.21 0.11-0.14c1.37 0.8 3.06 1.28 4.81 1.28c1.18 0 2.47-0.24 3.66-0.75c0.18-0.08 0.33 0.12 0.18 0.28z" fill="#FF9900"/>
                    <path d="M15.29 10.9c-0.14-0.18-0.96-0.09-1.32-0.04c-0.11 0.01-0.13-0.08-0.03-0.15c0.65-0.46 1.72-0.33 1.85-0.17c0.13 0.16-0.03 1.28-0.67 1.81c-0.1 0.08-0.19 0.04-0.15-0.07c0.17-0.43 0.56-1.4 0.32-1.58z" fill="#FF9900"/>
                    <path d="M13.5 3.5c0-0.28 0.22-0.5 0.5-0.5h6c0.28 0 0.5 0.22 0.5 0.5v17c0 0.28-0.22 0.5-0.5 0.5h-6c-0.28 0-0.5-0.22-0.5-0.5V3.5z" fill="#232F3E"/>
                    <path d="M5 7.5c0-2.49 2.01-4.5 4.5-4.5S14 5.01 14 7.5v9c0 2.49-2.01 4.5-4.5 4.5S5 18.99 5 16.5v-9z" fill="#FF9900"/>
                  </svg>
                )}
                Continue with Amazon
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Secure authentication powered by Stytch
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              By signing in, you agree to our{' '}
              <button 
                type="button"
                onClick={() => window.open('/terms-of-service', '_blank')}
                className="text-teal-600 hover:text-teal-500 underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button 
                type="button"
                onClick={() => window.open('/privacy-policy', '_blank')}
                className="text-teal-600 hover:text-teal-500 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Features showcase */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-orange-600 to-orange-800">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="text-center text-white mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Averis Commerce Platform
            </h2>
            <p className="text-xl text-teal-100">
              Transform your product data into competitive advantage with our enterprise commerce platform
            </p>
          </div>

          <div className="space-y-8 max-w-sm mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-teal-100 text-sm mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-teal-100">
            <p className="text-sm">
              Join thousands of businesses streamlining their commerce operations with our integrated platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage