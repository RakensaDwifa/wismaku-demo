import { describe, expect, it } from 'vitest'
import { buildSuggestions, highlightParts } from './suggestions.js'

const cities = [{ name: 'Jakarta' }, { name: 'Bandung' }]
const hotels = [
  { id: 1, name: 'Rumah Tandur Kelapa Gading', area: 'Kelapa Gading', city: 'Jakarta' },
  { id: 2, name: 'Hotel Dago Biru', area: null, city: 'Bandung' },
]

describe('buildSuggestions', () => {
  it('mengembalikan maksimal 8 saat query kosong', () => {
    expect(buildSuggestions(cities, hotels, '').length).toBeLessThanOrEqual(8)
  })

  it('menghilangkan duplikat key', () => {
    const dup = buildSuggestions(cities, [{ id: 1, name: 'A', area: 'A', city: 'Jakarta' }], 'a')
    const keys = dup.map((i) => i.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('menyaring & mengurutkan berdasarkan peringkat kata kunci', () => {
    const list = buildSuggestions(cities, hotels, 'b')
    expect(list.every((i) => i.rank <= 2)).toBe(true)
    const ranks = list.map((i) => i.rank)
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
  })

  it('mencocokkan nama area hotel sebagai saran', () => {
    const list = buildSuggestions(cities, hotels, 'kelapa')
    expect(list.some((i) => i.name === 'Kelapa Gading' && i.type === 'hotel')).toBe(true)
  })
})

describe('highlightParts', () => {
  it('memecah teks menjadi bagian match dan non-match', () => {
    expect(highlightParts('Jakarta Barat', 'jak')).toEqual([
      { text: '', match: false },
      { text: 'Jak', match: true },
      { text: 'arta Barat', match: false },
    ])
  })

  it('mengembalikan null saat tidak cocok atau query kosong', () => {
    expect(highlightParts('Jakarta', 'xyz')).toBeNull()
    expect(highlightParts('Jakarta', '')).toBeNull()
  })
})
