import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyCoupon } from './coupon.js'

const mockCoupon = {
  code: 'WISMA20',
  label: 'Diskon 20%',
  discount_pct: 20,
  max_discount: 200000,
  active: true,
  valid_until: null,
}

const { mockFrom, qb } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
    }
    b.select.mockReturnValue(b)
    b.eq.mockReturnValue(b)
    b.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject)
    return b
  }
  return { mockFrom, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => qb({ data: mockCoupon, error: null }))
})

describe('applyCoupon', () => {
  it('menormalkan huruf kapital dan spasi', async () => {
    const r = await applyCoupon(`  wisma20  `, 1000000)
    expect(r.code).toBe('WISMA20')
  })

  it('menghitung potongan dengan batas maksimum', async () => {
    const kecil = await applyCoupon('WISMA20', 100000)
    const besar = await applyCoupon('WISMA20', 100000000)
    expect(kecil.amount).toBe(Math.min(Math.round((100000 * 20) / 100), 200000))
    expect(besar.amount).toBeLessThanOrEqual(200000)
  })

  it('menolak kode yang tidak dikenal', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: null }))
    await expect(applyCoupon('TIDAKADA', 100000)).rejects.toThrow('TIDAKADA')
  })
})
