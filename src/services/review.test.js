import { beforeEach, describe, expect, it } from 'vitest'
import { addReview, getReviews } from './review.js'

const payload = {
  hotelId: 'H-1',
  name: 'Dewi Lestari',
  city: 'Jakarta',
  rating: 5,
  text: 'Penginapan sangat nyaman dan bersih',
}

describe('addReview / getReviews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menyimpan ulasan dan membacanya kembali', async () => {
    const review = await addReview(payload)

    expect(review.id).toMatch(/^RV-/)
    expect(review.hotelId).toBe('H-1')
    expect(review.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const list = await getReviews('H-1')
    expect(list).toHaveLength(1)
    expect(list[0].text).toBe(payload.text)
  })

  it('menolak ulasan duplikat untuk hotel yang sama', async () => {
    await addReview(payload)

    await expect(addReview(payload)).rejects.toThrow('Anda sudah mengulas penginapan ini.')
    expect(await getReviews('H-1')).toHaveLength(1)
  })

  it('membolehkan ulasan untuk hotel yang berbeda', async () => {
    await addReview(payload)
    const lain = await addReview({ ...payload, hotelId: 'H-2' })

    expect(lain.hotelId).toBe('H-2')
    expect(await getReviews('H-1')).toHaveLength(1)
    expect(await getReviews('H-2')).toHaveLength(1)
  })

  it('menolak payload tidak valid', async () => {
    await expect(addReview({ ...payload, rating: 9 })).rejects.toThrow()
    await expect(addReview({ ...payload, rating: 0 })).rejects.toThrow()
    await expect(addReview({ ...payload, text: 'abcd' })).rejects.toThrow()
    await expect(addReview({ ...payload, name: 'X' })).rejects.toThrow()
  })

  it('tidak menampilkan ulasan hotel lain', async () => {
    await addReview(payload)
    expect(await getReviews('H-LAIN')).toEqual([])
  })
})
