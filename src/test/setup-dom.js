import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Setup untuk project test `component` (environment: jsdom).
 *
 * CATATAN: file ini TIDAK boleh meng-import `setup-node.js`.
 * Stub `globalThis.window` di sana akan menimpa window jsdom yang sungguhan
 * dan merusak React serta Testing Library.
 *
 * jsdom sudah menyediakan `localStorage` dan `Event` secara native,
 * jadi tidak perlu stubbing manual di sini.
 */

afterEach(() => {
  cleanup()
  localStorage.clear()
})
