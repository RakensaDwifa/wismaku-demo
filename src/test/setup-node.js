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
const sessionStore = new Map()

const makeStorage = (map) => ({
  getItem: (key) => (map.has(key) ? map.get(key) : null),
  setItem: (key, value) => map.set(key, String(value)),
  removeItem: (key) => map.delete(key),
  clear: () => map.clear(),
  key: (index) => [...map.keys()][index] ?? null,
  get length() {
    return map.size
  },
})

globalThis.localStorage = makeStorage(store)
globalThis.sessionStorage = makeStorage(sessionStore)

globalThis.window = {
  sessionStorage: globalThis.sessionStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
}

afterEach(() => {
  store.clear()
  sessionStore.clear()
})
