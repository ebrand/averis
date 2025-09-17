import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RoleProvider } from './contexts/RoleContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { StytchProvider } from '@stytch/react'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AuthenticatePage from './pages/AuthenticatePage'
import GetAccessPage from './pages/GetAccessPage'
import CustomersPage from './pages/CustomersPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ApiTest from './components/ApiTest'
import { stytch } from './lib/stytch'
import { processIncomingAuth } from './utils/tokenReception'

function App() {
  // Process any incoming authentication tokens on app initialization
  useEffect(() => {
    const authResult = processIncomingAuth()
    if (authResult.tokenReceived || authResult.sessionReceived) {
      console.log('Customer MDM: Processed incoming authentication from', authResult.source)
    }
  }, [])
  
  return (
    <StytchProvider stytch={stytch}>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/authenticate" element={<AuthenticatePage />} />
                <Route path="/get-access" element={<GetAccessPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                
                {/* Protected routes with layout */}
                <Route path="/" element={<MainLayout />}>
                  <Route 
                    index 
                    element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Customers routes */}
                  <Route 
                    path="customers" 
                    element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="customers/prospects" 
                    element={
                      <ProtectedRoute>
                        <div className="px-4 sm:px-6 lg:px-8 py-8">
                          <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prospects</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Prospect management coming soon</p>
                          </div>
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="customers/accounts" 
                    element={
                      <ProtectedRoute>
                        <div className="px-4 sm:px-6 lg:px-8 py-8">
                          <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Accounts</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Account management coming soon</p>
                          </div>
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Users route - admin access only */}
                  <Route 
                    path="users" 
                    element={
                      <ProtectedRoute>
                        <UsersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Profile route */}
                  <Route 
                    path="profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
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
                  
                  {/* Terms of Service route */}
                  <Route 
                    path="terms" 
                    element={
                      <ProtectedRoute>
                        <TermsOfServicePage />
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
                  
                  {/* Catch all for protected routes */}
                  <Route 
                    path="*" 
                    element={
                      <ProtectedRoute>
                        <div className="px-4 sm:px-6 lg:px-8 py-8">
                          <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Page Not Found</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">The page you're looking for doesn't exist.</p>
                          </div>
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                </Route>
              </Routes>
            </Router>
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </StytchProvider>
  )
}

export default App