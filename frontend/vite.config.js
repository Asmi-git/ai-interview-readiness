import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api requests to the local Express backend during development,
// so the frontend can just call fetch('/api/...') without hardcoding a port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
