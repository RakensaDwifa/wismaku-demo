import { describe, expect, it } from 'vitest'
import { BookingPayloadSchema, ResetVerifyOtpSchema, UpdateProfileSchema, parsePayload } from './contracts.js'

const validBooking = {
  hotelId: 'H-1',
  hotelName: 'Hotel 示例',
  checkIn: '2026-08-01',
  checkOut: '2026-08-03',
  nights: 2,
  rooms: 1,
  guests: 2,
  roomTypeId: 'standard',
  roomTypeName: 'Standar',
  roomPrice: 199000,
  couponDiscount: 0,
  memberDiscount: 0,
  totalPrice: 398000,
  guestName: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '081234567890',
}

describe('BookingPayloadSchema', () => {
  it('menerima payload booking yang valid', () => {
    expect(BookingPayloadSchema.safeParse(validBooking).success).toBe(true)
  })

  it('menolak nights kurang dari 1', () => {
    expect(BookingPayloadSchema.safeParse({ ...validBooking, nights: 0 }).success).toBe(false)
  })

  it('menolak email tidak valid', () => {
    expect(BookingPayloadSchema.safeParse({ ...validBooking, email: 'bukan-email' }).success).toBe(false)
  })

  it('menolak nomor telepon tidak valid', () => {
    expect(BookingPayloadSchema.safeParse({ ...validBooking, phone: 'abc' }).success).toBe(false)
  })

  it('menolak roomPrice non-positif', () => {
    expect(BookingPayloadSchema.safeParse({ ...validBooking, roomPrice: 0 }).success).toBe(false)
  })

  it('menerima hotelImg berupa URL http(s) maupun tidak diisi, dan menolak skema berbahaya', () => {
    expect(BookingPayloadSchema.safeParse(validBooking).success).toBe(true)
    expect(BookingPayloadSchema.safeParse({ ...validBooking, hotelImg: 'https://a.com/x.jpg' }).success).toBe(
      true,
    )
    expect(BookingPayloadSchema.safeParse({ ...validBooking, hotelImg: 'javascript:alert(1)' }).success).toBe(
      false,
    )
  })
})

describe('parsePayload', () => {
  it('mengembalikan data hasil validasi', () => {
    expect(parsePayload(BookingPayloadSchema, validBooking)).toEqual(validBooking)
  })

  it('melempar Error yang memuat pesan gabungan semua isu', () => {
    expect(() => parsePayload(BookingPayloadSchema, { ...validBooking, nights: 0, email: 'x' })).toThrow(
      Error,
    )

    try {
      parsePayload(BookingPayloadSchema, { ...validBooking, nights: 0, email: 'x' })
    } catch (err) {
      expect(err.message).toContain(';')
      expect(err.message.length).toBeGreaterThan(0)
    }
  })
})

describe('ResetVerifyOtpSchema', () => {
  it('menerima email, OTP 6-8 digit, dan password valid', () => {
    const res = ResetVerifyOtpSchema.safeParse({
      email: 'budi@example.com',
      token: '12345678',
      password: 'PassBaru123',
    })
    expect(res.success).toBe(true)
  })

  it('menolak token non-angka atau panjang tidak sesuai', () => {
    expect(
      ResetVerifyOtpSchema.safeParse({
        email: 'budi@example.com',
        token: '1234',
        password: 'PassBaru123',
      }).success,
    ).toBe(false)

    expect(
      ResetVerifyOtpSchema.safeParse({
        email: 'budi@example.com',
        token: 'abcdefgh',
        password: 'PassBaru123',
      }).success,
    ).toBe(false)
  })
})

describe('UpdateProfileSchema', () => {
  it('menerima nama valid dan phone opsional', () => {
    expect(UpdateProfileSchema.safeParse({ name: 'Budi Santoso', phone: '08123456789' }).success).toBe(true)
    expect(UpdateProfileSchema.safeParse({ name: 'Budi Santoso', phone: '' }).success).toBe(true)
    expect(UpdateProfileSchema.safeParse({ name: 'Budi Santoso' }).success).toBe(true)
  })

  it('menolak nama kurang dari 3 karakter atau format phone tidak valid', () => {
    expect(UpdateProfileSchema.safeParse({ name: 'Bu', phone: '08123456789' }).success).toBe(false)
    expect(UpdateProfileSchema.safeParse({ name: 'Budi Santoso', phone: '123' }).success).toBe(false)
    expect(UpdateProfileSchema.safeParse({ name: 'Budi Santoso', phone: 'abc123456' }).success).toBe(false)
  })
})
