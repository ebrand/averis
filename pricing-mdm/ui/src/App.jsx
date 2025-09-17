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
import ProductsPage from './pages/ProductsPage'
import NewProductPage from './pages/NewProductPage'
import UpdateProductPage from './pages/UpdateProductPage'
import SettingsPage from './pages/SettingsPage'
import AllCatalogsPage from './pages/AllCatalogsPage'
import CatalogsAmerPage from './pages/CatalogsAmerPage'
import RegionalCatalogsPage from './pages/RegionalCatalogsPage'
import CatalogDetailPage from './pages/CatalogDetailPage'
import CatalogEditPage from './pages/CatalogEditPage'
import AllChannelsPage from './pages/AllChannelsPage'
import RegionsPage from './pages/RegionsPage'
import HierarchyPage from './pages/HierarchyPage'
import JobsPage from './pages/JobsPage'
import ApiTest from './components/ApiTest'
import { stytch } from './lib/stytch'
import { processIncomingAuth } from './utils/tokenReception'

function App() {
  // Process any incoming authentication tokens on app initialization
  useEffect(() => {
    const authResult = processIncomingAuth()
    if (authResult.tokenReceived || authResult.sessionReceived) {
      console.log('Pricing MDM: Processed incoming authentication from', authResult.source)
    }
  }, [])
  return (
    <StytchProvider stytch={stytch}>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <Router>
          <Routes>
            {/* Public routes - no layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/authenticate" element={<AuthenticatePage />} />
            <Route path="/get-access" element={<GetAccessPage />} />
            
            {/* Protected routes with layout */}
            <Route path="/" element={<MainLayout />}>
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <AllCatalogsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Products routes */}
              <Route 
                path="products" 
                element={
                  <ProtectedRoute>
                    <ProductsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* All Catalogs route */}
              <Route 
                path="catalogs" 
                element={
                  <ProtectedRoute>
                    <AllCatalogsPage />
                  </ProtectedRoute>
                } 
              />
              
              
              {/* New Product route */}
              <Route 
                path="products/new" 
                element={
                  <ProtectedRoute>
                    <NewProductPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Create Product route (alias for products/new) */}
              <Route 
                path="products/create" 
                element={
                  <ProtectedRoute>
                    <NewProductPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Update Product route */}
              <Route 
                path="products/:id/edit" 
                element={
                  <ProtectedRoute>
                    <UpdateProductPage />
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
              <Route 
                path="admin/channels" 
                element={
                  <ProtectedRoute>
                    <AllChannelsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/regions" 
                element={
                  <ProtectedRoute>
                    <RegionsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Regional Catalogs routes - unified component for all regions */}
              <Route 
                path="catalogs/:region" 
                element={
                  <ProtectedRoute>
                    <RegionalCatalogsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="catalogs/:region/:catalogId" 
                element={
                  <ProtectedRoute>
                    <CatalogDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="catalogs/:region/:catalogId/edit" 
                element={
                  <ProtectedRoute>
                    <CatalogEditPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Jobs routes */}
              <Route 
                path="jobs" 
                element={
                  <ProtectedRoute>
                    <JobsPage />
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
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </StytchProvider>
  )
}

export default App