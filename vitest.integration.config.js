import { defineConfig } from 'vitest/config'

/** Tes integrasi: butuh jaringan + env Supabase. Jalankan manual: `npm run test:integration`. */
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    setupFiles: ['src/test/setup-node.js'],
    testTimeout: 20000,
  },
})
