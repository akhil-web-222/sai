import { defineConfig } from 'vite'
import { resolve } from 'path'
import compression from 'vite-plugin-compression'
import purgecss from '@fullhuman/postcss-purgecss'

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    copyPublicDir: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        contact: resolve(__dirname, 'contact.html'),
        'portfolio-details': resolve(__dirname, 'portfolio-details.html'),
        'service-details': resolve(__dirname, 'service-details.html'),
        'wood-supply': resolve(__dirname, 'wood-supply.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[ext]/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: true
  },
  css: {
    postcss: {
      plugins: [
        purgecss({
          content: ['./**/*.html', './assets/js/**/*.js'],
          safelist: {
            standard: ['active', 'show', 'fade', 'collapse', 'collapsing', 'modal-open'],
            deep: [/^swiper/, /^aos/, /^gl/, /^isotope/],
            greedy: [/^bi-/]
          },
          defaultExtractor: content => content.match(/[\w-/:]+/g) || []
        })
      ]
    }
  },
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
