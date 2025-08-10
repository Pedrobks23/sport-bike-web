// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173, // porta do Vite
    proxy: {
      '/api/cloudinary': {
        target: 'http://localhost:8787', // porta do server local
        changeOrigin: true
      }
    }
  }
})
