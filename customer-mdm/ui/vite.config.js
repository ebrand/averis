import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3007,
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
      // Customer-specific API calls go directly to Customer MDM API (development)
      '^/api/customers.*': {
        target: 'http://localhost:6007',
        changeOrigin: true,
        secure: false
      },
      // Default API calls go directly to Customer MDM API (development)
      '^/api/.*': {
        target: 'http://localhost:6007',
        changeOrigin: true,
        secure: false
      },
      '^/health$': {
        target: 'http://127.0.0.1:80/customer',
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
