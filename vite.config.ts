import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/lgapi': {
        target: 'http://localhost:2024',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/lgapi/, ''),
      },
    },
  },
})
