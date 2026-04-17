import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path: on GitHub Pages the site is served at /Pickids/.
// Override via env var VITE_BASE for Vercel/Netlify/local preview (use '/').
const base = process.env.VITE_BASE ?? '/Pickids/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pickids-icon.svg', 'pickids-icon-180.png'],
      manifest: {
        name: 'Pickids',
        short_name: 'Pickids',
        description: 'Pickids — Retirar nunca fue tan simple. App de retiro escolar.',
        theme_color: '#0B3D91',
        background_color: '#0B3D91',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: base + 'index.html'
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
