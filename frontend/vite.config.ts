/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // En desarrollo usamos '/' para comodidad. 
  // En build usamos '/SistemaDemoPlanta/' para que funcione en XAMPP y online.
  base: command === 'serve' ? '/' : '/SistemaDemoPlanta/',
  build: {
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks(id: any) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}))*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // En desarrollo usamos '/' para comodidad.
  // En build usamos '/SistemaDemoPlanta/' para que funcione en XAMPP y online.
  base: command === 'serve' ? '/' : '/SistemaDemoPlanta/',

  server: {
    port: 3080,
    proxy: {
      '/api': {
        target: 'http://localhost:3081',
        changeOrigin: true,
      },
      '/ocr': {
        target: 'http://localhost:3081',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3081',
        changeOrigin: true,
      }
    }
  },

  optimizeDeps: {
    include: ['tesseract.js'],
  },

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/tesseract.js')) {
            return 'tesseract';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}))