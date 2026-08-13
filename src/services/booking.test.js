import { beforeEach, describe, expect, it } from 'vitest'
import { createBooking, getBookings, cancelBooking, payBooking } from './booking.js'
import { BookingPayloadSchema, parsePayload } from '../schemas/contracts.js'

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

  it('membuat pemesanan dengan id kode WK dan status pending', async () => {
    const booking = await createBooking(validPayload)
    expect(booking.id).toMatch(/^WK-/)
    expect(booking.status).toBe('pending')
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

  it('hasil booking tetap valid menurut schema setelah dibayar', async () => {
    const booking = await createBooking(validPayload)
    const paid = await payBooking(booking.id, 'qris')
    expect(paid.status).toBe('confirmed')
    expect(parsePayload(BookingPayloadSchema, paid).totalPrice).toBe(validPayload.totalPrice)
  })
})

describe('migrasi hotelImg booking lama', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('memperbaiki hotelImg lokal dengan gambar hotel saat ini', async () => {
    localStorage.setItem(
      'wismaku_bookings',
      JSON.stringify([
        {
          id: 'WK-LAMA01',
          hotelId: 1,
          hotelName: 'Rumah Tandur Syariah Near Kelapa Gading',
          hotelImg: '/img/hotels/1.jpg',
          checkIn: '2026-08-01',
          checkOut: '2026-08-03',
          status: 'pending',
        },
      ]),
    )
    const list = await getBookings()
    expect(list[0].hotelImg).toMatch(/^https:\/\//)
    const stored = JSON.parse(localStorage.getItem('wismaku_bookings'))
    expect(stored[0].hotelImg).toBe(list[0].hotelImg)
  })

  it('menggunakan gambar fallback bila hotel tidak ditemukan', async () => {
    localStorage.setItem(
      'wismaku_bookings',
      JSON.stringify([
        { id: 'WK-LAMA02', hotelId: 999, hotelName: 'Hotel Hilang', hotelImg: 'img/hotels/x.jpg' },
      ]),
    )
    const list = await getBookings()
    expect(list[0].hotelImg).toMatch(/^https:\/\/images\.unsplash\.com\//)
  })

  it('tidak mengubah hotelImg yang sudah berupa URL', async () => {
    localStorage.setItem(
      'wismaku_bookings',
      JSON.stringify([
        { id: 'WK-BARU01', hotelId: 1, hotelName: 'Hotel Test', hotelImg: 'https://example.com/x.jpg' },
      ]),
    )
    const list = await getBookings()
    expect(list[0].hotelImg).toBe('https://example.com/x.jpg')
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

describe('payBooking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menandai pemesanan sebagai confirmed dengan metode pembayaran', async () => {
    const booking = await createBooking(validPayload)
    const paid = await payBooking(booking.id, 'qris')
    expect(paid.status).toBe('confirmed')
    expect(paid.paymentMethod).toBe('qris')
    expect(paid.paidAt).toBeTruthy()
    const list = await getBookings()
    expect(list[0].status).toBe('confirmed')
  })

  it('mengembalikan undefined dan tidak mengubah daftar untuk id tak dikenal', async () => {
    const booking = await createBooking(validPayload)
    const paid = await payBooking('WK-NOPE', 'va')
    expect(paid).toBeUndefined()
    const list = await getBookings()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(booking.id)
    expect(list[0].status).toBe('pending')
    expect(list[0].paymentMethod).toBeUndefined()
  })

  it('tetap konsisten saat dibayar dua kali', async () => {
    const booking = await createBooking(validPayload)
    await payBooking(booking.id, 'va')
    const paidAgain = await payBooking(booking.id, 'ewallet')
    expect(paidAgain.status).toBe('confirmed')
    expect(paidAgain.paymentMethod).toBe('ewallet')
    expect(paidAgain.paidAt).toBeTruthy()
    const list = await getBookings()
    expect(list).toHaveLength(1)
  })

  it('tidak mengubah data pesanan lain setelah dibayar', async () => {
    const booking = await createBooking({
      ...validPayload,
      couponCode: 'WISMA20',
      couponDiscount: 39800,
      memberDiscount: 35820,
      totalPrice: 322380,
    })
    const before = { ...booking }
    await payBooking(booking.id, 'qris')
    const list = await getBookings()
    const after = list[0]
    expect(after.couponCode).toBe(before.couponCode)
    expect(after.couponDiscount).toBe(before.couponDiscount)
    expect(after.memberDiscount).toBe(before.memberDiscount)
    expect(after.totalPrice).toBe(before.totalPrice)
    expect(after.guestName).toBe(before.guestName)
    expect(after.checkIn).toBe(before.checkIn)
    expect(after.checkOut).toBe(before.checkOut)
  })
})
