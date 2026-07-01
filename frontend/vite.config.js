import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/v1/users':    { target: 'http://localhost:8001', changeOrigin: true },
      '/api/v1/products': { target: 'http://localhost:8002', changeOrigin: true },
      '/api/v1/orders':   { target: 'http://localhost:8003', changeOrigin: true },
    }
  }
})
