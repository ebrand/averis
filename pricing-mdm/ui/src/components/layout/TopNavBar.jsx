import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { stytch } from '../../lib/stytch'
import RoleSwitcher from '../common/RoleSwitcher'
// import { handleDashboardNavigation } from '../../utils/crossAppNavigation' // Removed dashboard navigation
import {
  Bars3Icon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  SunIcon,
  MoonIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

export const TopNavBar = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, userProfile, logout, isAuthenticated } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profileMenuRef = useRef(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    } else if (location.pathname !== '/products') {
      // If no search query, just go to products page
      navigate('/products')
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileMenuOpen(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      
      // Use Stytch's proper OAuth flow with PKCE
      const redirectURL = `${window.location.origin}/authenticate`
      
      await stytch.oauth.google.start({
        login_redirect_url: redirectURL,
        signup_redirect_url: redirectURL
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsSigningIn(false)
    }
  }

  return (
    <nav className="bg-green-800 shadow-sm border-b border-green-900 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center w-80 flex-shrink-0">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-white hover:text-green-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600 lg:hidden"
            >
              <span className="sr-only">Toggle sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center ml-4 lg:ml-0">
              <svg 
                className="h-8 w-auto text-white" 
                viewBox="0 0 300.000000 159.000000" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                  <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                  <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                </g>
              </svg>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-white">Averis Pricing</h1>
                <p className="text-xs text-green-200 hidden sm:block">Enterprise Pricing Data Management</p>
              </div>
            </div>
          </div>

          {/* Center - Search bar (expandable) */}
          <div className="hidden md:flex w-96 mx-8">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <label htmlFor="search" className="sr-only">Search products</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-green-600 rounded-md leading-5 bg-green-700 placeholder-green-300 text-white focus:outline-none focus:placeholder-green-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search products, pricing, catalogs..."
                  type="search"
                />
              </div>
            </form>
          </div>

          {/* Right side - Theme toggle, Role switcher and User menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-white hover:text-green-200 hover:bg-green-700 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {isAuthenticated && (
              <RoleSwitcher />
            )}
            
            {isAuthenticated && userProfile ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 w-[250px] bg-green-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-green-800 hover:bg-green-600"
                >
                  <span className="sr-only">Open user menu</span>
                    {userProfile.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={userProfile.avatar}
                        alt={userProfile.name}
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-white" />
                    )}
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white">
                      {userProfile.name}
                    </div>
                    <div className="text-xs text-green-200">
                      {userProfile.email.length > 22 ? `${userProfile.email.substring(0, 19)}...` : userProfile.email}
                    </div>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-white" />
                </button>

                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-[250px] rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <div className="text-sm text-gray-500">Signed in as</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {userProfile.email.length > 22 ? `${userProfile.email.substring(0, 19)}...` : userProfile.email}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          // Navigate to centralized user profile management on port 3012
                          window.open('http://localhost:3012/profile', '_blank')
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        Profile Settings
                      </button>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNavBar