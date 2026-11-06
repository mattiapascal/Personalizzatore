import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({ root: 'storefront', publicDir: false, resolve: { alias: { '/src': fileURLToPath(new URL('./src', import.meta.url)) } }, plugins: [react()], build: { outDir: '../.local/storefront-dist', emptyOutDir: true, sourcemap: false }, server: { host: '127.0.0.1', port: 5174, strictPort: true } });
