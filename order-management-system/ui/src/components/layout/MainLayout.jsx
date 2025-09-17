import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
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
        <LoadingSpinner size="large" text="Loading Product MDM..." />
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
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Outlet />
          </main>
          
          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="max-w-full mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 min-h-10">
                <div className="flex items-center space-x-4">
                  <span>© {new Date().getFullYear()} Averis</span>
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