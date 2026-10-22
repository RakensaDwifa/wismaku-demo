import { afterEach } from 'vitest'

/**
 * Setup untuk project test `unit` (environment: node).
 *
 * Node tidak punya `localStorage` maupun `window`, jadi keduanya di-stub di sini.
 * Stub `window` sengaja dibuat minimal dan TANPA listener sungguhan:
 * service hanya memanggil `window.dispatchEvent(...)` untuk memberi tahu
 * perubahan state, sementara `addEventListener`/`removeEventListener` dibuat
 * no-op agar komponen yang di-import aman di environment node.
 */

const store = new Map()

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

globalThis.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
}

afterEach(() => {
  store.clear()
})
