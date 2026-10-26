import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBooking, getBookings, cancelBooking, payBooking, migrateBookings } from './booking.js'

const { mockFrom, mockGetActiveUser, qb } = vi.hoisted(() => {
  const mockGetActiveUser = vi.fn().mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@email.com' })
  const mockFrom = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      order: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
      single: vi.fn(() => Promise.resolve(resolved)),
      insert: vi.fn(() => b),
      update: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.update.mockReturnValue(b)
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

beforeEach(() => {
  vi.clearAllMocks()
  mockGetActiveUser.mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@example.com' })
  mockFrom.mockImplementation(() => qb({ data: null, error: null }))
})

describe('createBooking', () => {
  it('membuat pemesanan dengan status pending', async () => {
    const row = {
      id: 'b-1',
      status: 'pending',
      created_at: '2026-08-01T00:00:00Z',
      hotel_id: '1',
      hotel_name: 'Hotel Test',
      hotel_img: 'https://example.com/hotel.jpg',
      check_in: '2026-08-01',
      check_out: '2026-08-03',
      nights: 2,
      rooms: 1,
      guests: 2,
      room_type_id: 'standard',
      room_type_name: 'Standar',
      room_price: 199000,
      coupon_code: null,
      coupon_discount: 0,
      member_discount: 0,
      total_price: 398000,
      guest_name: 'Budi Santoso',
      email: 'budi@example.com',
      phone: '081234567890',
    }
    mockFrom.mockImplementation(() => {
      const b = qb({ data: row, error: null })
      return b
    })
    const booking = await createBooking(validPayload)
    expect(booking.id).toBe('b-1')
    expect(booking.status).toBe('pending')
    expect(booking.createdAt).toBeTruthy()
  })

  it('menolak payload tidak valid', async () => {
    await expect(createBooking({ ...validPayload, guestName: 'X' })).rejects.toThrow()
  })
})

describe('getBookings', () => {
  it('mengembalikan daftar pemesanan', async () => {
    const rows = [
      {
        id: 'b-1',
        status: 'pending',
        created_at: '2026-08-01T00:00:00Z',
        hotel_id: '1',
        hotel_name: 'Hotel Test',
        hotel_img: 'https://example.com/hotel.jpg',
        check_in: '2026-08-01',
        check_out: '2026-08-03',
        nights: 2,
        rooms: 1,
        guests: 2,
        room_type_id: 'standard',
        room_type_name: 'Standar',
        room_price: 199000,
        coupon_code: null,
        coupon_discount: 0,
        member_discount: 0,
        total_price: 398000,
        guest_name: 'Budi Santoso',
        email: 'budi@example.com',
        phone: '081234567890',
      },
    ]
    mockFrom.mockImplementation(() => qb({ data: rows, error: null }))
    const list = await getBookings()
    expect(list).toHaveLength(1)
    expect(list[0].hotelName).toBe('Hotel Test')
  })

  it('mengembalikan array kosong bila error', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: { message: 'err' } }))
    const list = await getBookings()
    expect(list).toEqual([])
  })
})

describe('cancelBooking', () => {
  it('memanggil update status cancelled', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: null }))
    await cancelBooking('b-1')
    // verifikasi from('bookings') dipanggil
    expect(mockFrom).toHaveBeenCalledWith('bookings')
  })
})

describe('payBooking', () => {
  it('menandai pemesanan sebagai confirmed dengan metode pembayaran', async () => {
    const row = {
      id: 'b-1',
      status: 'confirmed',
      created_at: '2026-08-01T00:00:00Z',
      hotel_id: '1',
      hotel_name: 'Hotel Test',
      hotel_img: 'https://example.com/hotel.jpg',
      check_in: '2026-08-01',
      check_out: '2026-08-03',
      nights: 2,
      rooms: 1,
      guests: 2,
      room_type_id: 'standard',
      room_type_name: 'Standar',
      room_price: 199000,
      coupon_code: null,
      coupon_discount: 0,
      member_discount: 0,
      total_price: 398000,
      guest_name: 'Budi Santoso',
      email: 'budi@example.com',
      phone: '081234567890',
      payment_method: 'qris',
      paid_at: '2026-08-01T01:00:00Z',
    }
    mockFrom.mockImplementation(() => qb({ data: row, error: null }))
    const paid = await payBooking('b-1', 'qris')
    expect(paid.status).toBe('confirmed')
    expect(paid.paymentMethod).toBe('qris')
    expect(paid.paidAt).toBeTruthy()
  })

  it('melempar error untuk id tak dikenal', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: { message: 'No rows found' } }))
    await expect(payBooking('WK-NOPE', 'va')).rejects.toThrow()
  })
})

describe('migrateBookings', () => {
  it('tetap diekspor sebagai no-op (kompatibilitas)', () => {
    expect(migrateBookings()).toEqual([])
  })
})
