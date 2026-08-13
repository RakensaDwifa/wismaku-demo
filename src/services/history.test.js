import { beforeEach, describe, expect, it } from 'vitest'
import { getRecentSearches, addRecentSearch, getRecentViews, addRecentView } from './history.js'

describe('history', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('recent searches', () => {
    it('mengembalikan daftar kosong pada awal', () => {
      expect(getRecentSearches()).toEqual([])
    })

    it('menyimpan pencarian terbaru di depan', () => {
      addRecentSearch('Jakarta')
      addRecentSearch('Bandung')
      expect(getRecentSearches()).toEqual(['Bandung', 'Jakarta'])
    })

    it('menghapus duplikat tanpa peduli huruf besar/kecil', () => {
      addRecentSearch('jakarta')
      addRecentSearch('Jakarta')
      expect(getRecentSearches()).toEqual(['Jakarta'])
    })

    it('membatasi maksimal 5 item', () => {
      for (let i = 1; i <= 7; i += 1) addRecentSearch(`Kota ${i}`)
      expect(getRecentSearches().length).toBe(5)
      expect(getRecentSearches()[0]).toBe('Kota 7')
    })

    it('mengabaikan pencarian kosong', () => {
      addRecentSearch('   ')
      expect(getRecentSearches()).toEqual([])
    })
  })

  describe('recent views', () => {
    it('mengembalikan daftar kosong pada awal', () => {
      expect(getRecentViews()).toEqual([])
    })

    it('menyimpan id terbaru di depan', () => {
      addRecentView('hotel-1')
      addRecentView('hotel-2')
      expect(getRecentViews()).toEqual(['hotel-2', 'hotel-1'])
    })

    it('menghapus duplikat dan menaikkan posisi id yang dilihat ulang', () => {
      addRecentView('a')
      addRecentView('b')
      addRecentView('a')
      expect(getRecentViews()).toEqual(['a', 'b'])
    })

    it('menyimpan id sebagai string', () => {
      addRecentView(42)
      expect(getRecentViews()).toEqual(['42'])
    })

    it('membatasi maksimal 6 item', () => {
      for (let i = 1; i <= 8; i += 1) addRecentView(String(i))
      expect(getRecentViews().length).toBe(6)
      expect(getRecentViews()[0]).toBe('8')
    })

    it('mengabaikan id kosong', () => {
      addRecentView(null)
      addRecentView('')
      expect(getRecentViews()).toEqual([])
    })
  })
})
