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

describe('favorit per-user', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menyimpan favorit ke scope email user', async () => {
    const user = { name: 'Budi', email: 'Budi@Email.com' }
    await toggleFavorite(1, user)
    expect(await getFavorites(user)).toEqual(['1'])
    expect(await isFavorite(1, user)).toBe(true)
    expect(await getFavorites()).toEqual([])
    expect(await isFavorite(1)).toBe(false)
  })

  it('tidak menampilkan favorit user lain', async () => {
    await toggleFavorite(3, { email: 'a@b.c' })
    expect(await getFavorites({ email: 'x@y.z' })).toEqual([])
    expect(await isFavorite(3, { email: 'x@y.z' })).toBe(false)
  })

  it('hanya menghapus favorit pada scope yang sama', async () => {
    await toggleFavorite(5, { email: 'a@b.c' })
    await toggleFavorite(5, { email: 'x@y.z' })
    expect(await getFavorites({ email: 'a@b.c' })).toEqual(['5'])
    await toggleFavorite(5, { email: 'x@y.z' })
    expect(await getFavorites({ email: 'a@b.c' })).toEqual(['5'])
    expect(await getFavorites({ email: 'x@y.z' })).toEqual([])
  })
})
