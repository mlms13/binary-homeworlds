import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  root: 'ui',
  build: {
    outDir: '../dist-ui',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
  },
});
