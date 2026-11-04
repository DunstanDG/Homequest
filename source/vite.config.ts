import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const APP_VERSION = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version
const BUILT_AT = new Date().toISOString()

export default defineConfig(({ mode }) => ({
  // Relative asset paths so the built app works from any folder or sub-path (GitHub Pages, Netlify, a NAS...).
  base: './',
  // Which release a phone is running, shown in Parent area › Data (src/app/version.ts).
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION), __BUILD_TIME__: JSON.stringify(BUILT_AT) },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `vite build --mode inline` makes a page for hosts that cannot run a service worker (see scripts/inline-build.mjs).
      ...(mode === 'inline' ? { 'virtual:pwa-register': fileURLToPath(new URL('./scripts/no-pwa.ts', import.meta.url)) } : {}),
    },
  },
  // Chunking: the StudyQuest subject packs (src/content, ~2.5 MB of question generators) and the React/router
  // vendor code change far less often than the app itself, so they get their own long-lived, separately cached
  // files instead of riding in one 3.7 MB index.js that every app release re-downloads. The inline build
  // (one HTML file, no service worker) is left alone: scripts/inline-build.mjs expects a single JS file.
  ...(mode === 'inline'
    ? {}
    : {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  { name: 'content', test: /[\\/]src[\\/]content[\\/]/, priority: 2 },
                  { name: 'vendor', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run|zustand|idb-keyval)[\\/]/, priority: 1 },
                ],
              },
            },
          },
        },
      }),
  plugins: [
    react(),
    // version.json: the build's own answer to "what is the newest version?", fetched uncached by "Check for updates".
    // Not precached, so it is always read from the server.
    ...(mode === 'inline' ? [] : [{
      name: 'hq-version-json',
      generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => string }) {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION, builtAt: BUILT_AT }) })
      },
    }]),
    ...(mode === 'inline' ? [] : [VitePWA({
      // 'prompt': a new version waits until a quiet moment or a tap on Restart (see src/app/update.ts), so a
      // deploy never reloads the app in the middle of a feed timer.
      registerType: 'prompt',
      // injectManifest (not the default generateSW) so src/sw.ts can add its own `push` /
      // `notificationclick` listeners for Phase 1 web push notifications - generateSW only lets you
      // tweak caching, it can't run custom event-listener code.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        // The learning content (several KS3 subjects of question data) puts the main bundle over workbox's 2 MiB
        // default. It must still be precached or the app wouldn't open offline.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'HomeQuest',
        short_name: 'HomeQuest',
        description: 'The family planner: calendar, lists, timers, trackers, school and StudyQuest.',
        theme_color: '#141a3a',
        background_color: '#141a3a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    })]),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
}))
