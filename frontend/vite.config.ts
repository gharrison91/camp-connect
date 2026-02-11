import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // React core runtime
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/')
          ) {
            return 'vendor-react'
          }

          // TanStack React Query
          if (id.includes('/@tanstack/')) {
            return 'vendor-query'
          }

          // Recharts (heavy charting library ~466KB)
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
            return 'vendor-charts'
          }

          // Drag-and-drop kit
          if (id.includes('/@dnd-kit/')) {
            return 'vendor-dnd'
          }

          // Framer Motion animations
          if (id.includes('/framer-motion/')) {
            return 'vendor-motion'
          }

          // Lucide icon library
          if (id.includes('/lucide-react/')) {
            return 'vendor-icons'
          }

          // Miscellaneous utility libraries
          if (
            id.includes('/axios/') ||
            id.includes('/zustand/') ||
            id.includes('/zod/')
          ) {
            return 'vendor-misc'
          }
        },
      },
    },
  },
})
