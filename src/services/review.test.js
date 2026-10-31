import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addReview, deleteReview, getReviews, updateReview } from './review.js'

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
      update: vi.fn(() => b),
      delete: vi.fn(() => b),
      order: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.update.mockReturnValue(b)
    b.delete.mockReturnValue(b)
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

  it('memetakan userId dan verifiedGuest serta mendukung updateReview & deleteReview milik sendiri', async () => {
    mockGetActiveUser.mockResolvedValue({ id: 'u-1', name: 'Dewi Lestari' })
    mockFrom.mockImplementation(() =>
      qb({
        data: {
          id: 'r-9',
          hotel_id: '1',
          user_id: 'u-1',
          name: 'Dewi Lestari',
          city: 'Bandung',
          rating: 4,
          text: 'Kamar rapi dan sarapan enak sekali.',
          verified_guest: true,
          created_at: '2026-10-31T00:00:00Z',
        },
        error: null,
      }),
    )

    const updated = await updateReview('r-9', {
      ...payload,
      city: 'Bandung',
      rating: 4,
      text: 'Kamar rapi dan sarapan enak sekali.',
    })
    expect(updated.userId).toBe('u-1')
    expect(updated.verifiedGuest).toBe(true)
    expect(updated.city).toBe('Bandung')

    mockFrom.mockImplementation(() => qb({ data: [{ id: 'r-9' }], error: null }))
    await expect(deleteReview('r-9')).resolves.toBeUndefined()

    mockFrom.mockImplementation(() => qb({ data: [], error: null }))
    await expect(deleteReview('r-other')).rejects.toThrow(/bukan milik Anda/i)
  })

  it('menolak updateReview dan deleteReview bila belum login', async () => {
    mockGetActiveUser.mockResolvedValue(null)
    await expect(updateReview('r-1', payload)).rejects.toThrow(/masuk terlebih dahulu/i)
    await expect(deleteReview('r-1')).rejects.toThrow(/masuk terlebih dahulu/i)
  })
})
