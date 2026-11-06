import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5138',
        changeOrigin: true,
      },
      '/notificationHub': {
        target: 'http://127.0.0.1:5138',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
