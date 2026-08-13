import { describe, expect, it } from 'vitest'
import { applyCoupon } from './coupon.js'
import { coupons } from '../data/coupons.js'

const { code, pct, maxDiscount } = coupons[0]

describe('applyCoupon', () => {
  it('menormalkan huruf kapital dan spasi', async () => {
    const r = await applyCoupon(`  ${code.toLowerCase()}  `, 1000000)
    expect(r.code).toBe(code)
  })

  it('menghitung potongan dengan batas maksimum', async () => {
    const kecil = await applyCoupon(code, 100000)
    const besar = await applyCoupon(code, 100000000)
    expect(kecil.amount).toBe(Math.min(Math.round((100000 * pct) / 100), maxDiscount))
    expect(besar.amount).toBeLessThanOrEqual(maxDiscount)
  })

  it('menolak kode yang tidak dikenal', async () => {
    await expect(applyCoupon('TIDAKADA', 100000)).rejects.toThrow('TIDAKADA')
  })
})
