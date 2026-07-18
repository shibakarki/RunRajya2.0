import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Tells Vite to listen on all local IP addresses automatically
    port: 5173, // Keeps your port locked to 5173
  },
});