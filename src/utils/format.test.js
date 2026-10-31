import { describe, expect, it } from 'vitest'
import { addDays } from 'date-fns'
import { fmtRupiah, fmtDate, toYMD, parseYMD, resolveStayDates } from './format.js'

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

  it('memformat timestamp ISO penuh tanpa error', () => {
    expect(fmtDate('2026-08-13T00:00:00.000Z')).toContain('2026')
    expect(fmtDate('2026-08-13T00:00:00.000Z')).toContain('Agu')
  })

  it('memformat tanggal ISO ke bahasa Inggris', () => {
    expect(fmtDate('2026-08-13', 'en')).toContain('2026')
    expect(fmtDate('2026-08-13', 'en')).toContain('Aug')
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

describe('resolveStayDates', () => {
  it('memakai rentang checkIn dan checkOut bila valid', () => {
    expect(resolveStayDates({ checkIn: '2026-11-05', checkOut: '2026-11-08' })).toEqual({
      checkIn: '2026-11-05',
      checkOut: '2026-11-08',
      nights: 3,
    })
  })

  it('menyesuaikan tanggal dari createdAt + nights saat checkIn kosong pada pesanan lama', () => {
    expect(
      resolveStayDates({ checkIn: null, checkOut: null, createdAt: '2026-10-10T08:00:00', nights: 2 }),
    ).toEqual({
      checkIn: '2026-10-10',
      checkOut: '2026-10-12',
      nights: 2,
    })
  })

  it('default ke hari ini -> besok (1 malam) saat memesan tanpa tanggal pencarian', () => {
    const today = new Date()
    expect(resolveStayDates({})).toEqual({
      checkIn: toYMD(today),
      checkOut: toYMD(addDays(today, 1)),
      nights: 1,
    })
  })
})
