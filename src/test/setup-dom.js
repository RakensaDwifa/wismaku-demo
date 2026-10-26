import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { webcrypto } from 'node:crypto'

/**
 * jsdom menyediakan `crypto.getRandomValues` tetapi TIDAK menyediakan `crypto.subtle`.
 * Service auth memakai PBKDF2 lewat SubtleCrypto, jadi di sini diambil dari Node.
 */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: webcrypto.subtle,
    configurable: true,
  })
}

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
