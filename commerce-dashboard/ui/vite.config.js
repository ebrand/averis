import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3012,
    host: true,
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:6012',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '^/health$': {
        target: 'http://localhost:6012',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
