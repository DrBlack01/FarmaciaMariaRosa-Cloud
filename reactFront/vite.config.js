import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy para desarrollo local:
    // Redirige /api/* al backend Spring Boot en localhost:8081
    // En producción (Vercel) no se usa este proxy; se usa VITE_API_URL.
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
