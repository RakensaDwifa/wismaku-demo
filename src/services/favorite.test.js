import { beforeEach, describe, expect, it } from 'vitest'
import { getFavorites, isFavorite, toggleFavorite } from './favorite.js'

describe('favorite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mengembalikan daftar favorit kosong pada awal', async () => {
    expect(await getFavorites()).toEqual([])
    expect(await isFavorite('1')).toBe(false)
  })

  it('toggle menambahkan lalu menghapus favorit', async () => {
    const first = await toggleFavorite(1)
    expect(first.active).toBe(true)
    expect(await isFavorite(1)).toBe(true)

    const second = await toggleFavorite(1)
    expect(second.active).toBe(false)
    expect(await isFavorite(1)).toBe(false)
  })

  it('menyimpan id sebagai string', async () => {
    await toggleFavorite(7)
    expect(await getFavorites()).toEqual(['7'])
  })
})