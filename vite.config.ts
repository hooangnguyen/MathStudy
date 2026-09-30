import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          // Ngân hàng câu hỏi (~1,2 MB cho 9 lớp) không tải trước lúc cài PWA,
          // mỗi học sinh chỉ cần lớp của mình → cache khi dùng tới.
          globIgnores: ['**/assets/grade*-*.js'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => /\/assets\/grade\d+-.*\.js$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'question-banks',
                expiration: { maxEntries: 20 },
              },
            },
            {
              urlPattern: ({ url }) => /\/assets\/KaTeX_.*\.(woff2?|ttf)$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'katex-fonts',
                expiration: { maxEntries: 60 },
              },
            },
          ],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.svg', 'pwa-512x512.svg'],
        manifest: {
          name: 'Math Study',
          short_name: 'MathStudy',
          description: 'Học Toán Trực Tuyến cùng MathStudy',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'pwa-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    build: {
      // vendor-firebase (~620 kB) là SDK Firebase, không chia nhỏ thêm được
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Tách thư viện ít thay đổi ra chunk riêng để trình duyệt giữ cache
          // qua các lần deploy (chỉ code app thay đổi mới phải tải lại).
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'vendor-firebase';
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
            if (/\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-motion';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': 'http://localhost:3000'
      }
    },
  };
});
