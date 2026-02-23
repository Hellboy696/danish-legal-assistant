import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api calls to the FastAPI backend during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — changes rarely, cached long-term
          'vendor-react': ['react', 'react-dom'],
          // Animation library — largest single dependency
          'vendor-motion': ['framer-motion'],
          // UI utilities — icons + toasts
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          // State management
          'vendor-state': ['zustand'],
        },
      },
    },
  },
});
