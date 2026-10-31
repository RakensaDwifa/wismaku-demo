const SNAP_SANDBOX_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'

let snapPromise = null

export function resetMidtransLoader() {
  snapPromise = null
}

/**
 * Lazy-load script Midtrans Snap Sandbox hanya saat pengguna membuka pembayaran.
 * Menerima fallbackClientKey dari Edge Function agar tetap jalan meskipun
 * VITE_MIDTRANS_CLIENT_KEY belum diset di environment hosting.
 */
export function loadMidtransSnap(fallbackClientKey = '') {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Midtrans Snap hanya tersedia di browser.'))
  }
  if (window.snap) return Promise.resolve(window.snap)
  if (snapPromise) return snapPromise

  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || fallbackClientKey
  if (!clientKey) {
    return Promise.reject(new Error('Midtrans Client Key belum dikonfigurasi.'))
  }

  snapPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SNAP_SANDBOX_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap), { once: true })
      existing.addEventListener(
        'error',
        () => {
          snapPromise = null
          reject(new Error('Gagal memuat pop-up pembayaran Midtrans.'))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = SNAP_SANDBOX_URL
    script.async = true
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => {
      if (window.snap) resolve(window.snap)
      else {
        snapPromise = null
        reject(new Error('Midtrans Snap tidak tersedia setelah script dimuat.'))
      }
    }
    script.onerror = () => {
      snapPromise = null
      script.remove()
      reject(new Error('Gagal memuat pop-up pembayaran Midtrans.'))
    }
    document.head.appendChild(script)
  })

  return snapPromise
}
