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
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import HealthChecksPage from './pages/HealthChecksPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LogsPage from './pages/LogsPage'
import AlertsPage from './pages/AlertsPage'
import UsersPage from './pages/UsersPage'
import DataDictionaryPage from './pages/DataDictionaryPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ColorSwatchPage from './pages/ColorSwatchPage'
import ApiTest from './components/ApiTest'
import { stytch } from './lib/stytch'
import { processIncomingAuth } from './utils/tokenReception'

function App() {
  // Process any incoming authentication tokens on app initialization
  useEffect(() => {
    const authResult = processIncomingAuth()
    if (authResult.tokenReceived || authResult.sessionReceived) {
      console.log('Dashboard: Processed incoming authentication from', authResult.source)
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
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Services routes */}
              <Route 
                path="services" 
                element={
                  <ProtectedRoute>
                    <ServicesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="services/health" 
                element={
                  <ProtectedRoute>
                    <HealthChecksPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="services/performance" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
                        <p className="text-gray-600 mt-2">Performance monitoring coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="services/logs" 
                element={
                  <ProtectedRoute>
                    <LogsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Analytics routes */}
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics/realtime" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics/history" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Historical Data</h2>
                        <p className="text-gray-600 mt-2">Historical analytics coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics/reports" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
                        <p className="text-gray-600 mt-2">Custom reports coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Alerts routes */}
              <Route 
                path="alerts" 
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="alerts/active" 
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="alerts/history" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Alert History</h2>
                        <p className="text-gray-600 mt-2">Alert history coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="alerts/config" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Alert Configuration</h2>
                        <p className="text-gray-600 mt-2">Alert configuration coming soon</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="admin/data-dictionary" 
                element={
                  <ProtectedRoute>
                    <DataDictionaryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/config" 
                element={
                  <ProtectedRoute>
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
                        <p className="text-gray-600 mt-2">System configuration coming soon</p>
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
              
              {/* Color Swatch page */}
              <Route 
                path="colors" 
                element={
                  <ProtectedRoute>
                    <ColorSwatchPage />
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
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </StytchProvider>
  )
}

export default App