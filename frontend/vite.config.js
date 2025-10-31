import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Use 127.0.0.1 to avoid IPv6/hostname resolution issues (ECONNREFUSED)
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Optimizaciones para producción
  build: {
    // Minificar con terser (mejor compresión que esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // Eliminar console.logs en producción
        drop_debugger: true,   // Eliminar debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Separar vendors para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías principales en chunk separado
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Librerías UI en otro chunk
          'vendor-ui': ['react-hot-toast', 'lucide-react'],
        },
      },
    },
    
    // Chunk size warnings a 1000kb (en lugar de 500kb default)
    chunkSizeWarningLimit: 1000,
    
    // Generar sourcemaps solo en desarrollo
    sourcemap: false,
    
    // Optimizar assets
    assetsInlineLimit: 4096, // Inline assets < 4kb como base64
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
