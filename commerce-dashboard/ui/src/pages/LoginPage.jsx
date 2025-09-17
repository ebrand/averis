import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { stytch } from '../lib/stytch'
import { UserCircleIcon, ShieldCheckIcon, ServerIcon, ChartBarIcon, CubeIcon, GlobeAltIcon, BoltIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

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


  const features = [
    {
      icon: CubeIcon,
      title: 'Unified Product Management',
      description: 'Centralize product data across your entire organization with powerful MDM capabilities, automated workflows, and real-time synchronization.'
    },
    {
      icon: UserCircleIcon,
      title: 'Unified Customer Management',
      description: 'Streamline your entire customer lifecycle from prospect to advocate. Complete 360° profiles, intelligent segmentation, and cross-channel orchestration with real-time analytics.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Commerce Operations',
      description: 'Scale your business worldwide with region-specific pricing, multi-channel distribution, and localized product catalogs that adapt to any market.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Intelligent Pricing Engine',
      description: 'Maximize profitability with dynamic pricing algorithms, competitive intelligence, and real-time market analysis across all channels and regions.'
    }
  ]

  const enterpriseFeature = {
    icon: BoltIcon,
    title: 'Enterprise-Grade Performance',
    description: 'Built for high-volume operations with microservices architecture, real-time monitoring, and 99.9% uptime SLA for mission-critical commerce.'
  }

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
            
            <div className="flex items-center justify-center">
              <svg 
                className="h-6 mt-1 -mr-0.5 w-auto text-gray-600" 
                viewBox="0 0 300.000000 159.000000" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                  <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                  <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                </g>
              </svg>
              <span className="text-4xl font-semibold text-gray-600">eris</span>
            </div>
            <p className="text-lg -mt-1 text-gray-600 mt-2">Commerce Platform</p>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Use your Google account to sign in securely
              </p>
            </div>

            <div className="flex justify-center">
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
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Secure authentication powered by <span className="font-bold">Stytch</span>
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

          {/* Mobile footer - only visible on small screens (when right panel is hidden) */}
          <div className="mt-8 flex flex-col items-center space-y-2 pb-4 lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg 
                  className="h-3 w-auto text-gray-600" 
                  viewBox="0 0 300.000000 159.000000" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                    <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                    <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                  </g>
                </svg>
              </div>
              <span className="text-xs text-gray-500">© {new Date().getFullYear()} Averis Commerce Platform</span>
            </div>
            <p className="text-xs text-gray-400">All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Right side - Features showcase */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative h-full flex flex-col px-12">
          {/* Main content area - centered vertically */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center text-white mb-12">
            <div className="flex items-center justify-center mb-4">
              <svg 
                className="h-8 mt-1 w-auto text-white -mr-1" 
                viewBox="0 0 300.000000 159.000000" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                  <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                  <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                </g>
              </svg>
              <span className="text-5xl font-bold text-white"><span className="font-semibold">eris</span> Commerce Platform</span>
            </div>
            <p className="text-xl text-teal-100">
              Transform your product data into competitive advantage with our enterprise commerce platform.
            </p>
          </div>

          {/* 2x2 Grid for main features */}
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-lg">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-teal-100 text-sm mt-2">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise feature spanning full width */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start space-x-4 bg-white bg-opacity-10 rounded-lg p-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-lg">
                  <enterpriseFeature.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{enterpriseFeature.title}</h3>
                <p className="text-teal-100 text-sm mt-1">{enterpriseFeature.description}</p>
              </div>
            </div>
          </div>
          </div>

          {/* Desktop footer - only visible on large screens (when right panel is shown) */}
          <div className="hidden lg:flex mt-auto flex-col items-center space-y-2 pb-8">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg 
                  className="h-3 w-auto text-white" 
                  viewBox="0 0 300.000000 159.000000" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                    <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                    <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                  </g>
                </svg>
              </div>
              <span className="text-xs text-white">© {new Date().getFullYear()} Averis Commerce Platform</span>
            </div>
            <p className="text-xs text-teal-100 opacity-90">All rights reserved</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage