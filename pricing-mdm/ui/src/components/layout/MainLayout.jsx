import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopNavBar from './TopNavBar'
import SideNavBar from './SideNavBar'
import LoadingSpinner from '../common/LoadingSpinner'

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location])

  // Close sidebar on window resize if it becomes desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading Pricing MDM..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Top Navigation */}
      <TopNavBar 
        onMenuToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Layout Container */}
      <div className="flex h-screen pt-16">
        {/* Side Navigation */}
        {isAuthenticated && (
          <SideNavBar 
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
          
          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="max-w-full mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 min-h-10">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span>© {new Date().getFullYear()} Averis</span>
                  </div>
                  <span>•</span>
                  <button 
                    onClick={() => window.open('http://localhost:3012/privacy-policy', '_blank')}
                    className="hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => window.open('http://localhost:3012/terms-of-service', '_blank')}
                    className="hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <span>Version 1.0.0</span>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Support</a>
                  <span>•</span>
                  <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Documentation</a>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg 
                      className="h-4 w-4 text-green-800" 
                      viewBox="0 0 300.000000 159.000000" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g transform="translate(0.000000,159.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none" fillRule="evenodd">
                        <path d="M692 1493 c-11 -10 -68 -128 -127 -263 -107 -245 -266 -605 -416 -945 -43 -99 -79 -190 -79 -201 0 -44 28 -54 156 -54 65 0 124 4 130 8 6 4 18 21 26 37 14 28 427 1017 442 1059 3 10 8 17 10 15 2 -2 106 -249 231 -549 125 -300 235 -551 243 -557 11 -9 55 -13 138 -13 116 0 124 1 138 22 9 12 16 28 16 34 0 27 -603 1390 -622 1407 -17 14 -41 17 -143 17 -103 0 -126 -3 -143 -17z" />
                        <path d="M1447 1492 c-26 -29 -21 -62 32 -179 26 -59 160 -364 296 -678 137 -314 255 -578 263 -587 13 -16 34 -18 153 -18 133 0 139 1 153 23 8 12 87 189 177 392 203 464 290 663 368 839 93 213 88 226 -92 226 -99 0 -120 -3 -134 -18 -10 -9 -119 -261 -243 -559 -124 -299 -227 -543 -230 -543 -3 0 -29 60 -59 133 -197 481 -404 964 -418 975 -11 8 -56 12 -133 12 -101 0 -119 -3 -133 -18z" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default MainLayout