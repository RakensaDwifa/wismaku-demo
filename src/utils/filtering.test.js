import { describe, expect, it } from 'vitest'
import { parseFilters, applyFilters, applySort, priceBounds } from './filtering.js'

const hotels = [
  { id: 1, name: 'A', price: 100000, rating: 4.5, amenities: ['WiFi Gratis', 'AC'] },
  { id: 2, name: 'B', price: 250000, rating: 4.0, amenities: ['AC', 'Sarapan'] },
  { id: 3, name: 'C', price: 150000, rating: 4.8, amenities: ['WiFi Gratis', 'Sarapan'] },
]

const params = (obj) => new URLSearchParams(obj)

describe('parseFilters', () => {
  it('mengembalikan nilai default saat tidak ada param', () => {
    expect(parseFilters(params({}))).toEqual({
      sort: 'relevance',
      amenities: [],
      minPrice: 0,
      maxPrice: 0,
      minRating: 0,
    })
  })

  it('mengabaikan nilai sort yang tidak valid', () => {
    expect(parseFilters(params({ sort: 'bogus' })).sort).toBe('relevance')
  })

  it('memecah amenities dengan koma', () => {
    const f = parseFilters(params({ amenities: 'WiFi Gratis, AC' }))
    expect(f.amenities).toEqual(['WiFi Gratis', 'AC'])
  })
})

describe('applyFilters', () => {
  it('menyaring berdasarkan amenitas (semua harus cocok)', () => {
    expect(applyFilters(hotels, { amenities: ['WiFi Gratis'] }).map((h) => h.id)).toEqual([1, 3])
    expect(applyFilters(hotels, { amenities: ['WiFi Gratis', 'Sarapan'] }).map((h) => h.id)).toEqual([3])
  })

  it('menyaring rentang harga dan rating', () => {
    expect(applyFilters(hotels, { minPrice: 120000, maxPrice: 200000 }).map((h) => h.id)).toEqual([3])
    expect(applyFilters(hotels, { minRating: 4.5 }).map((h) => h.id)).toEqual([1, 3])
  })

  it('mengembalikan semua saat filter kosong', () => {
    expect(applyFilters(hotels, {}).length).toBe(3)
  })
})

describe('applySort', () => {
  it('tidak mengubah urutan asli untuk relevance', () => {
    expect(applySort(hotels, 'relevance').map((h) => h.id)).toEqual([1, 2, 3])
  })

  it('mengurutkan harga naik/turun', () => {
    expect(applySort(hotels, 'price_asc').map((h) => h.id)).toEqual([1, 3, 2])
    expect(applySort(hotels, 'price_desc').map((h) => h.id)).toEqual([2, 3, 1])
  })

  it('mengurutkan rating tertinggi', () => {
    expect(applySort(hotels, 'rating_desc').map((h) => h.id)).toEqual([3, 1, 2])
  })

  it('tidak memutasi array asal', () => {
    const copy = [...hotels]
    applySort(hotels, 'price_asc')
    expect(hotels).toEqual(copy)
  })
})

describe('priceBounds', () => {
  it('menghitung min dan max', () => {
    expect(priceBounds(hotels)).toEqual({ min: 100000, max: 250000 })
  })

  it('menangani daftar kosong', () => {
    expect(priceBounds([])).toEqual({ min: 0, max: 0 })
  })
})