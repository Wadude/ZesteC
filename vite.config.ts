import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Polling: file-change events were sometimes missed on this Windows drive.
  server: { port: 5173, watch: { usePolling: true, interval: 300 } },
});
