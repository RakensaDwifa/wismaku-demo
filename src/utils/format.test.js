import { describe, expect, it } from 'vitest'
import { fmtRupiah, fmtDate, toYMD, parseYMD } from './format.js'

describe('fmtRupiah', () => {
  it('memformat angka ke format Rupiah id-ID', () => {
    expect(fmtRupiah(199000)).toBe('Rp 199.000')
    expect(fmtRupiah(0)).toBe('Rp 0')
  })
})

describe('fmtDate', () => {
  it('memformat tanggal ISO ke bahasa Indonesia', () => {
    expect(fmtDate('2026-08-13')).toContain('2026')
    expect(fmtDate('2026-08-13')).toContain('Agu')
  })

  it('mengembalikan tanda strip untuk nilai kosong', () => {
    expect(fmtDate('')).toBe('-')
    expect(fmtDate(null)).toBe('-')
  })
})

describe('toYMD', () => {
  it('memformat Date ke YYYY-MM-DD', () => {
    expect(toYMD(new Date(2026, 7, 5))).toBe('2026-08-05')
    expect(toYMD(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('parseYMD', () => {
  it('memparsing YYYY-MM-DD menjadi Date lokal', () => {
    const d = parseYMD('2026-08-13')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(13)
  })

  it('mengembalikan null untuk input tidak valid', () => {
    expect(parseYMD('')).toBeNull()
    expect(parseYMD('abc')).toBeNull()
  })
})