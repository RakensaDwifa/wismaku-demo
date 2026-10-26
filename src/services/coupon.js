import { supabase } from '../lib/supabase.js'
import { coupons as mockCoupons } from '../data/coupons.js'

export async function applyCoupon(code, subtotal) {
  const clean = (code || '').trim().toUpperCase()
  if (!supabase) {
    const found = mockCoupons.find((c) => c.code === clean)
    if (!found) throw new Error(`Kode kupon "${clean}" tidak ditemukan.`)
    const amount = Math.min(Math.round((subtotal * found.pct) / 100), found.maxDiscount)
    return { code: found.code, label: found.label, pct: found.pct, maxDiscount: found.maxDiscount, amount }
  }
  const { data, error } = await supabase.from('coupons').select('*').eq('code', clean).maybeSingle()
  if (error || !data || !data.active) throw new Error(`Kode kupon "${clean}" tidak ditemukan.`)
  if (data.valid_until && new Date(data.valid_until) < new Date()) {
    throw new Error(`Kode kupon "${clean}" sudah kadaluarsa.`)
  }
  const amount = Math.min(Math.round((subtotal * data.discount_pct) / 100), data.max_discount ?? Infinity)
  return {
    code: data.code,
    label: data.label,
    pct: data.discount_pct,
    maxDiscount: data.max_discount,
    amount,
  }
}
