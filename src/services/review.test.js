import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addReview, getReviews } from './review.js'

const { mockFrom, mockGetActiveUser, qb } = vi.hoisted(() => {
  const mockGetActiveUser = vi.fn().mockResolvedValue(null)
  const mockFrom = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
      single: vi.fn(() => Promise.resolve(resolved)),
      insert: vi.fn(() => b),
      order: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.select.mockReturnValue(b)
    b.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject)
    return b
  }
  return { mockFrom, mockGetActiveUser, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('./member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetActiveUser.mockResolvedValue(null)
  mockFrom.mockImplementation(() => qb({ data: null, error: null }))
})

const payload = {
  hotelId: '1',
  name: 'Dewi Lestari',
  city: 'Jakarta',
  rating: 5,
  text: 'Penginapan sangat nyaman dan bersih',
}

describe('addReview / getReviews', () => {
  it('menyimpan ulasan dan membacanya kembali', async () => {
    mockFrom.mockImplementation(() =>
      qb({
        data: {
          id: 'r-1',
          hotel_id: '1',
          name: payload.name,
          city: payload.city,
          rating: payload.rating,
          text: payload.text,
          created_at: '2026-08-02T00:00:00Z',
        },
        error: null,
      }),
    )
    const review = await addReview(payload)
    expect(review.id).toBe('r-1')
    expect(review.hotelId).toBe('1')
    expect(review.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    mockFrom.mockImplementation(() =>
      qb({
        data: [
          {
            id: 'r-1',
            hotel_id: '1',
            name: payload.name,
            city: payload.city,
            rating: payload.rating,
            text: payload.text,
            created_at: '2026-08-02T00:00:00Z',
          },
        ],
        error: null,
      }),
    )
    const list = await getReviews('1')
    expect(list).toHaveLength(1)
    expect(list[0].text).toBe(payload.text)
  })

  it('menolak payload tidak valid', async () => {
    await expect(addReview({ ...payload, rating: 9 })).rejects.toThrow()
    await expect(addReview({ ...payload, rating: 0 })).rejects.toThrow()
    await expect(addReview({ ...payload, text: 'abcd' })).rejects.toThrow()
    await expect(addReview({ ...payload, name: 'X' })).rejects.toThrow()
  })

  it('tidak menampilkan ulasan hotel lain', async () => {
    mockFrom.mockImplementation(() => qb({ data: [], error: null }))
    expect(await getReviews('999')).toEqual([])
  })
})
