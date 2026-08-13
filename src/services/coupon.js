import { request, USE_MOCK } from './api.js'
import { coupons } from '../data/coupons.js'

export async function applyCoupon(code, subtotal) {
  const clean = (code || '').trim().toUpperCase()
  if (USE_MOCK) {
    const found = coupons.find((c) => c.code === clean)
    if (!found) throw new Error(`Kode kupon "${clean}" tidak ditemukan.`)
    const amount = Math.min(Math.round((subtotal * found.pct) / 100), found.maxDiscount)
    return { code: found.code, label: found.label, pct: found.pct, maxDiscount: found.maxDiscount, amount }
  }
  return request('/coupons/validate', { method: 'POST', body: { code: clean, subtotal } })
}
