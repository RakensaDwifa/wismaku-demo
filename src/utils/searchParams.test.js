import { describe, expect, it } from 'vitest'
import { parseSearchParams, parseSearchWidgetInitial, buildSearchParams } from './searchParams.js'

const params = (obj) => new URLSearchParams(obj)

describe('parseSearchParams', () => {
  it('menghitung malam dari rentang tanggal valid', () => {
    const p = parseSearchParams(params({ checkIn: '2026-08-01', checkOut: '2026-08-04' }))
    expect(p.hasDates).toBe(true)
    expect(p.nights).toBe(3)
    expect(p.checkIn).toBe('2026-08-01')
  })

  it('menonaktifkan tanggal saat checkOut tidak lebih besar', () => {
    const p = parseSearchParams(params({ checkIn: '2026-08-04', checkOut: '2026-08-01' }))
    expect(p.hasDates).toBe(false)
    expect(p.nights).toBe(0)
    expect(p.checkIn).toBeNull()
  })

  it('menjumlahkan dewasa dan anak sebagai tamu', () => {
    const p = parseSearchParams(params({ adults: '2', children: '1', rooms: '3' }))
    expect(p.guests).toBe(3)
    expect(p.rooms).toBe(3)
  })
})

describe('buildSearchParams', () => {
  it('melewatkan field kosong', () => {
    expect(buildSearchParams({ destination: '  ', checkIn: '', rooms: 0, adults: 0, children: 0 })).toEqual(
      {},
    )
  })

  it('mengonversi angka ke string', () => {
    expect(
      buildSearchParams({ destination: 'Jakarta', checkIn: '2026-08-01', rooms: 2, adults: 1, children: 2 }),
    ).toEqual({
      q: 'Jakarta',
      checkIn: '2026-08-01',
      rooms: '2',
      adults: '1',
      children: '2',
    })
  })
})

describe('parseSearchWidgetInitial', () => {
  it('memakai default kamar 1, dewasa 2 saat param kosong', () => {
    const w = parseSearchWidgetInitial(params({}))
    expect(w.destination).toBe('')
    expect(w.rooms).toBe(1)
    expect(w.adults).toBe(2)
    expect(w.children).toBe(0)
    expect(w.checkIn).toBeInstanceOf(Date)
  })

  it('memakai nilai dari param', () => {
    const w = parseSearchWidgetInitial(
      params({
        q: 'Bali',
        checkIn: '2026-09-01',
        checkOut: '2026-09-05',
        rooms: '2',
        adults: '3',
        children: '1',
      }),
    )
    expect(w.destination).toBe('Bali')
    expect(w.rooms).toBe(2)
    expect(w.adults).toBe(3)
    expect(w.children).toBe(1)
    expect(w.checkIn.getFullYear()).toBe(2026)
    expect(w.checkIn.getMonth()).toBe(8)
    expect(w.checkIn.getDate()).toBe(1)
  })
})
