import {localStrokeOutlinesPlugin} from './scripts/local-stroke-outlines';
import {localEditorMediaPlugin} from './scripts/local-editor-media';
import {localPitchprintImportPlugin} from './scripts/local-pitchprint-import';
import {localPdfExportPlugin} from './scripts/local-pdf-export';
import { localConfigurationsPlugin } from './scripts/local-configurations';
import { localSvgOutlinesPlugin } from './scripts/local-svg-outlines';
import { localEditorAdminPlugin } from './scripts/local-editor-admin';
import { defineConfig } from 'vitest/config';
import { localPdfImportPlugin } from './scripts/local-pdf-import';
import react from '@vitejs/plugin-react';
import { localApiPlugin } from './server/api.ts';

export default defineConfig({
  plugins: [localStrokeOutlinesPlugin(),localEditorMediaPlugin(),localPitchprintImportPlugin(),react(),localPdfExportPlugin(), localConfigurationsPlugin(), localEditorAdminPlugin(), localPdfImportPlugin(), localSvgOutlinesPlugin(), localApiPlugin()],
  server: { watch: { ignored: ['**/.local/**'] }, host: '127.0.0.1', port: 5173, strictPort: true, fs: { deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**', '**/.local/**'] } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
