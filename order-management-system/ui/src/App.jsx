import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RoleProvider } from './contexts/RoleContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { StytchProvider } from '@stytch/react'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AuthenticatePage from './pages/AuthenticatePage'
import GetAccessPage from './pages/GetAccessPage'
import OrdersPage from './pages/OrdersPage'
import NewOrderPage from './pages/NewOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'
import FulfillmentPage from './pages/FulfillmentPage'
import SettingsPage from './pages/SettingsPage'
import ApiTest from './components/ApiTest'
import { stytch } from './lib/stytch'
import { processIncomingAuth } from './utils/tokenReception'

function App() {
  // Process any incoming authentication tokens on app initialization  
  useEffect(() => {
    const authResult = processIncomingAuth()
    if (authResult.tokenReceived || authResult.sessionReceived) {
      console.log('Order Management: Processed incoming authentication from', authResult.source)
    }
  }, [])
  return (
    <StytchProvider stytch={stytch}>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <WebSocketProvider>
              <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/authenticate" element={<AuthenticatePage />} />
            <Route path="/get-access" element={<GetAccessPage />} />
            
            {/* Protected routes with layout */}
            <Route path="/" element={<MainLayout />}>
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Orders routes */}
              <Route 
                path="orders" 
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Settings route */}
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* API Test route (development only) */}
              <Route 
                path="api-test" 
                element={
                  <ProtectedRoute>
                    <ApiTest />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              
              {/* Pricing routes */}
              <Route 
                path="pricing" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
                        <p className="text-gray-600 mt-2">Price management interface coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Analytics routes */}
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                        <p className="text-gray-600 mt-2">Analytics dashboard coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              {/* Catch all for protected routes */}
              <Route 
                path="*" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
                        <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
            </Route>
            </Routes>
              </Router>
            </WebSocketProvider>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </StytchProvider>
  )
}

export default App