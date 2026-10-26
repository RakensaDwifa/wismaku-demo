import { supabase } from '../lib/supabase.js'

export async function fetchCoupons() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.from('coupons').select('*').eq('active', true)
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({
    code: c.code,
    label: c.label,
    pct: c.discount_pct,
    maxDiscount: c.max_discount,
  }))
}

export async function applyCoupon(code, subtotal) {
  const clean = (code || '').trim().toUpperCase()
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
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
