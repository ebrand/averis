import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
    host: true,
    strictPort: true,
    proxy: {
      // User management calls go to System API via Traefik  
      '^/api/users.*': {
        target: 'http://127.0.0.1:80/system',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      // Product-related API calls go to Product Staging API via Traefik - read-optimized
      '^/api/products.*': {
        target: 'http://127.0.0.1:80/product-staging',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      // Data dictionary still comes from Product MDM API via Traefik - system metadata
      '^/api/data-dictionary.*': {
        target: 'http://127.0.0.1:80/product',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      // Localization API calls go to Localization API via Traefik
      '^/api/localization.*': {
        target: 'http://127.0.0.1:80/localization',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      // Pricing-specific API calls go to Pricing MDM API via Traefik
      '^/api/catalogs.*': {
        target: 'http://127.0.0.1:80/pricing',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      '^/api/pricing.*': {
        target: 'http://127.0.0.1:80/pricing',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      // Default API calls go to Pricing MDM API via Traefik
      '^/api/.*': {
        target: 'http://127.0.0.1:80/pricing',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      },
      '^/health$': {
        target: 'http://127.0.0.1:80/pricing',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Host', 'api.localhost')
          })
        }
      }
    }
  }
})
