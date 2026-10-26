import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFavorites, isFavorite, toggleFavorite } from './favorite.js'

const { mockFrom, qb } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  function qb({ thenData = null, maybeSingleData = null } = {}) {
    const resolved = { data: thenData, error: null }
    const msResolved = { data: maybeSingleData, error: null }
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(msResolved)),
      single: vi.fn(() => Promise.resolve(msResolved)),
      insert: vi.fn(() => b),
      delete: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.delete.mockReturnValue(b)
    b.select.mockReturnValue(b)
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
  mockFrom.mockImplementation(() => qb({ thenData: [], maybeSingleData: null }))
})

describe('favorite service', () => {
  it('mengembalikan daftar favorit kosong pada awal', async () => {
    expect(await getFavorites()).toEqual([])
    expect(await isFavorite('1')).toBe(false)
  })

  it('toggle menambahkan lalu menghapus favorit', async () => {
    // awal: belum favorit
    mockFrom.mockImplementation(() => qb({ thenData: [], maybeSingleData: null }))
    const first = await toggleFavorite(1)
    expect(first.active).toBe(true)
    expect(first.id).toBe('1')

    // setelah ditambah
    mockFrom.mockImplementation(() => qb({ thenData: ['1'], maybeSingleData: { hotel_id: '1' } }))
    expect(await isFavorite(1)).toBe(true)

    const second = await toggleFavorite(1)
    expect(second.active).toBe(false)
  })

  it('menyimpan id sebagai string', async () => {
    mockFrom.mockImplementation(() => qb({ thenData: [], maybeSingleData: null }))
    const r = await toggleFavorite(7)
    expect(r.id).toBe('7')
  })
})
