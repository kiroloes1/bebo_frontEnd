import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],
      },

      manifest: {
        id: '/',
        name: 'نظام معرض يوسف للأدويه البيطريه',
        short_name: 'معرض يوسف للأدويه البيطريه',
        description: 'نظام إدارة معرض يوسف للأدويه البيطريه',

        start_url: '/',
        scope: '/',

        display: 'standalone',

        theme_color: '#000000',
        background_color: '#ffffff',

        orientation: 'portrait-primary',

        dir: 'rtl',
        lang: 'ar',

        icons: [
          {
            src: '/icon.jpeg',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon.jpeg',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})