import { describe, it, expect } from 'vitest'
import { isWeekendNight, calculateStayPricing } from './pricing.js'

describe('Dynamic Weekend Pricing Utility', () => {
  it('mendeteksi malam akhir pekan (Jumat dan Sabtu malam)', () => {
    // 2026-11-20 adalah hari Jumat
    expect(isWeekendNight('2026-11-20')).toBe(true)
    // 2026-11-21 adalah hari Sabtu
    expect(isWeekendNight('2026-11-21')).toBe(true)
    // 2026-11-22 adalah hari Minggu
    expect(isWeekendNight('2026-11-22')).toBe(false)
    // 2026-11-19 adalah hari Kamis
    expect(isWeekendNight('2026-11-19')).toBe(false)
  })

  it('menghitung harga normal tanpa kenaikan akhir pekan jika surcharge 0%', () => {
    const res = calculateStayPricing({
      basePrice: 200000,
      checkIn: '2026-11-20', // Jumat
      nights: 2, // Jumat & Sabtu
      rooms: 1,
      weekendSurchargePercent: 0,
    })

    expect(res.weekendNights).toBe(2)
    expect(res.weekdayNights).toBe(0)
    expect(res.weekendSurchargeTotal).toBe(0)
    expect(res.subtotal).toBe(400000)
    expect(res.hasWeekendSurcharge).toBe(false)
  })

  it('menerapkan surcharge akhir pekan sebesar 20% pada malam Jumat & Sabtu', () => {
    const res = calculateStayPricing({
      basePrice: 200000,
      checkIn: '2026-11-19', // Kamis (1 malam weekday, 1 malam weekend Jumat, 1 malam weekend Sabtu)
      nights: 3,
      rooms: 2,
      weekendSurchargePercent: 20, // +40.000 per kamar per malam weekend
    })

    expect(res.weekdayNights).toBe(1)
    expect(res.weekendNights).toBe(2)
    // Surcharge per malam weekend per kamar: 200.000 * 20% = 40.000
    // Total surcharge: 40.000 * 2 malam * 2 kamar = 160.000
    expect(res.weekendSurchargeTotal).toBe(160000)
    // Base total: 200.000 * 3 malam * 2 kamar = 1.200.000
    expect(res.baseTotal).toBe(1200000)
    // Subtotal: 1.200.000 + 160.000 = 1.360.000
    expect(res.subtotal).toBe(1360000)
    expect(res.hasWeekendSurcharge).toBe(true)
  })
})
