import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    host: true,
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: 'http://api.localhost/erp',
        changeOrigin: true,
        secure: false
      },
      '^/health$': {
        target: 'http://api.localhost/erp',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
