import { defineConfig } from 'vitest/config'

/**
 * Dua project test terpisah:
 * - `unit`     -> environment node, file `*.test.js`
 * - `component` -> environment jsdom, file `*.test.jsx`
 *
 * Konvensi nama file:
 *   `src/**\/*.test.js`  = unit test (logika murni, service/util)
 *   `src/**\/*.test.jsx` = component test (butuh DOM)
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.js'],
          setupFiles: ['src/test/setup-node.js'],
        },
      },
      {
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.jsx'],
          setupFiles: ['src/test/setup-dom.js'],
        },
      },
    ],
  },
})
