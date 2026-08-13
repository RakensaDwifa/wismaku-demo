import { beforeEach, describe, expect, it } from 'vitest'
import { createBooking, getBookings, cancelBooking } from './booking.js'

const validPayload = {
  hotelId: 1,
  hotelName: 'Hotel Test',
  hotelImg: 'https://example.com/hotel.jpg',
  checkIn: '2026-08-01',
  checkOut: '2026-08-03',
  nights: 2,
  rooms: 1,
  guests: 2,
  roomTypeId: 'standard',
  roomTypeName: 'Standar',
  roomPrice: 199000,
  couponCode: null,
  couponDiscount: 0,
  memberDiscount: 0,
  totalPrice: 398000,
  guestName: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '081234567890',
}

describe('createBooking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('membuat pemesanan dengan id kode WK dan status confirmed', async () => {
    const booking = await createBooking(validPayload)
    expect(booking.id).toMatch(/^WK-/)
    expect(booking.status).toBe('confirmed')
    expect(booking.createdAt).toBeTruthy()
  })

  it('menolak payload tidak valid', async () => {
    await expect(createBooking({ ...validPayload, guestName: 'X' })).rejects.toThrow()
  })

  it('menyimpan ke localStorage dan membalik urutan terbaru di depan', async () => {
    await createBooking(validPayload)
    await createBooking({ ...validPayload, hotelName: 'Hotel Kedua' })
    const list = await getBookings()
    expect(list.length).toBe(2)
    expect(list[0].hotelName).toBe('Hotel Kedua')
  })
})

describe('cancelBooking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menandai pemesanan sebagai cancelled', async () => {
    const booking = await createBooking(validPayload)
    await cancelBooking(booking.id)
    const list = await getBookings()
    expect(list[0].status).toBe('cancelled')
    expect(list[0].cancelledAt).toBeTruthy()
  })
})
