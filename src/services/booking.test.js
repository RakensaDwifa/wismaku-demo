import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  deleteBooking,
  createSnapTransaction,
  verifyBookingPayment,
  migrateBookings,
} from './booking.js'

const { mockFrom, mockInvoke, mockGetActiveUser, qb } = vi.hoisted(() => {
  const mockGetActiveUser = vi.fn().mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@email.com' })
  const mockFrom = vi.fn()
  const mockInvoke = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      order: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
      single: vi.fn(() => Promise.resolve(resolved)),
      insert: vi.fn(() => b),
      update: vi.fn(() => b),
      delete: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.update.mockReturnValue(b)
    b.delete.mockReturnValue(b)
    b.select.mockReturnValue(b)
    b.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject)
    return b
  }
  return { mockFrom, mockInvoke, mockGetActiveUser, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: mockFrom, functions: { invoke: mockInvoke } },
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

describe('deleteBooking', () => {
  it('menghapus pesanan yang berstatus cancelled dan memancarkan event perubahan', async () => {
    const builder = qb({ data: [{ id: 'b-1' }], error: null })
    mockFrom.mockImplementation(() => builder)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await deleteBooking('b-1')

    expect(mockFrom).toHaveBeenCalledWith('bookings')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'b-1')
    expect(builder.eq).toHaveBeenCalledWith('status', 'cancelled')
    expect(dispatchSpy).toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })

  it('melempar error bila baris tidak terhapus (bukan cancelled atau tidak ditemukan)', async () => {
    mockFrom.mockImplementation(() => qb({ data: [], error: null }))
    await expect(deleteBooking('b-active')).rejects.toThrow(
      'Hanya pesanan yang sudah dibatalkan yang dapat dihapus.',
    )
  })
})

describe('getBookingById', () => {
  it('mengembalikan satu pemesanan beserta metadata Midtrans', async () => {
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
      snap_token: 'snap-tok-123',
      midtrans_order_id: 'WK-B1-XYZ',
    }
    mockFrom.mockImplementation(() => qb({ data: row, error: null }))
    const found = await getBookingById('b-1')
    expect(found.id).toBe('b-1')
    expect(found.snapToken).toBe('snap-tok-123')
    expect(found.midtransOrderId).toBe('WK-B1-XYZ')
  })

  it('mengembalikan null untuk id yang tidak ditemukan', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: null }))
    expect(await getBookingById('tidak-ada')).toBeNull()
  })
})

describe('createSnapTransaction & verifyBookingPayment', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
  })

  it('meminta token Snap ke Edge Function midtrans-token', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'pending', token: 'snap-token-1', orderId: 'WK-B1-1', clientKey: 'Mid-client-test' },
      error: null,
    })
    const res = await createSnapTransaction('b-1')
    expect(mockInvoke).toHaveBeenCalledWith('midtrans-token', {
      body: { bookingId: 'b-1', action: 'token' },
    })
    expect(res.token).toBe('snap-token-1')
  })

  it('mengirim action reset saat ganti metode pembayaran', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'pending', token: 'snap-token-2', orderId: 'WK-B1-2', clientKey: 'Mid-client-test' },
      error: null,
    })
    const res = await createSnapTransaction('b-1', { reset: true })
    expect(mockInvoke).toHaveBeenCalledWith('midtrans-token', {
      body: { bookingId: 'b-1', action: 'reset' },
    })
    expect(res.token).toBe('snap-token-2')
  })

  it('mengekstrak pesan error JSON dari response Edge Function non-2xx', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: () => Promise.resolve({ error: 'Pesanan yang sudah dibatalkan tidak dapat dibayar.' }),
        },
      },
    })
    await expect(createSnapTransaction('b-cancelled')).rejects.toThrow(
      'Pesanan yang sudah dibatalkan tidak dapat dibayar.',
    )
  })

  it('memverifikasi status pembayaran ke server', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'confirmed', paymentMethod: 'qris', midtransStatus: 'settlement' },
      error: null,
    })
    const res = await verifyBookingPayment('b-1')
    expect(mockInvoke).toHaveBeenCalledWith('midtrans-token', {
      body: { bookingId: 'b-1', action: 'verify' },
    })
    expect(res.status).toBe('confirmed')
    expect(res.paymentMethod).toBe('qris')
  })
})

describe('migrateBookings', () => {
  it('tetap diekspor sebagai no-op (kompatibilitas)', () => {
    expect(migrateBookings()).toEqual([])
  })
})
