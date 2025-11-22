// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // listen on all network interfaces
    port: 5173,      // your dev port (change if you use a different one)
    // allow any subdomain of ngrok-free.dev (safe enough for local testing)
    allowedHosts: ['.ngrok-free.dev', 'localhost', '127.0.0.1']
    // if you prefer to allow any host (less secure), use: allowedHosts: ['*']
  }
});
