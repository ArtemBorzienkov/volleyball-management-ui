import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Vitest rather than Jest: this app has no Jest/Babel setup of its own, and Vitest reads the same
// `@/*` alias tsconfig.json already defines. It covers the pure modules under lib/ and components
// rendered through jsdom; the routes themselves are still verified in the browser.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['{lib,components,app}/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
})
