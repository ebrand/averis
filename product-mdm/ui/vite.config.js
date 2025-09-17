import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3001,
    host: true,
    strictPort: false,
    proxy: {
      '^/api/.*': {
        target: 'http://127.0.0.1:80/product',
        changeOrigin: true,
        secure: false,
        headers: {
          'Host': 'api.localhost'
        }
      },
      '^/health$': {
        target: 'http://127.0.0.1:80/product',
        changeOrigin: true,
        secure: false,
        headers: {
          'Host': 'api.localhost'
        }
      }
    }
  }
})
