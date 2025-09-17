import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ShopProvider } from './contexts/SimpleShopContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import Header from './components/layout/Header'
import WebSocketNotifications from './components/WebSocketNotifications'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AdminProductsPage from './pages/AdminProductsPage'
import SystemStatusPage from './pages/SystemStatusPage'
import { processIncomingAuth } from './utils/tokenReception'

function App() {
  // Process any incoming authentication tokens on app initialization
  useEffect(() => {
    const authResult = processIncomingAuth()
    if (authResult.tokenReceived || authResult.sessionReceived) {
      console.log('E-commerce: Processed incoming authentication from', authResult.source)
    }
  }, [])
  return (
    <ShopProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <WebSocketNotifications />
            <main>
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/products" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/product-detail-demo" element={<ProductDetailPage />} />
              <Route path="/admin" element={<AdminProductsPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/system-status" element={<SystemStatusPage />} />
              {/* Catch-all route for debugging */}
              <Route path="*" element={
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                  <p className="text-gray-600 mb-4">Available routes:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li><a href="/" className="text-blue-600 hover:underline">/ - Home/Shop</a></li>
                    <li><a href="/shop" className="text-blue-600 hover:underline">/shop - Shop Page</a></li>
                    <li><a href="/admin" className="text-blue-600 hover:underline">/admin - Admin Products</a></li>
                    <li><a href="/system-status" className="text-blue-600 hover:underline">/system-status - System Status</a></li>
                    <li><a href="/product-detail-demo" className="text-blue-600 hover:underline">/product-detail-demo - Collapsible Demo</a></li>
                  </ul>
                </div>
              } />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-gray-900 text-white mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">TechStore</h3>
                  <p className="text-gray-300 text-sm">
                    Your trusted partner for enterprise technology solutions.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Products</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li><a href="#" className="hover:text-white">Hardware</a></li>
                    <li><a href="#" className="hover:text-white">Software</a></li>
                    <li><a href="#" className="hover:text-white">Services</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li><a href="#" className="hover:text-white">Contact Us</a></li>
                    <li><a href="#" className="hover:text-white">Documentation</a></li>
                    <li><a href="#" className="hover:text-white">Help Center</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li><a href="#" className="hover:text-white">About</a></li>
                    <li><a href="#" className="hover:text-white">Careers</a></li>
                    <li><button type="button" onClick={() => window.open('#', '_blank')} className="hover:text-white underline">Privacy Policy</button></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                <p>&copy; 2024 TechStore. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
      </WebSocketProvider>
    </ShopProvider>
  )
}

export default App
