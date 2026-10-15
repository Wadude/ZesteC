import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  plugins: [
    react(),
    // Makes Zeste installable ("Add to Home screen") and lets the app open without internet.
    // New versions download in the background and apply on the next launch.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Zeste',
        short_name: 'Zeste',
        description: 'Shared grocery lists and budget for your household.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2f7d4f',
        background_color: '#f1f6f0',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // woff2: the Plus Jakarta Sans font, so the app looks the same offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The demo and privacy pages are separate; Vietnamese letters aren't needed.
        globIgnores: ['demo/**', 'privacy/**', '**/*vietnamese*'],
        navigateFallback: '/index.html',
        // Firebase's own pages (sign-in handler etc.) and the demo must come from the server.
        navigateFallbackDenylist: [/^\/__\//, /^\/demo/, /^\/privacy/],
      },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: {
    // Firebase itself is ~200 KB compressed; that's expected.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Firebase changes rarely: keeping it separate means phones re-download less on updates.
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
      },
    },
  },
  // Polling: file-change events were sometimes missed on this Windows drive.
  server: { port: 5173, watch: { usePolling: true, interval: 300 } },
});
