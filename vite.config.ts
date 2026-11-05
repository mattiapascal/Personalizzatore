import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { localApiPlugin } from './server/api.ts';

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
