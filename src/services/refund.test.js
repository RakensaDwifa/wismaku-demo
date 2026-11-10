import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRefundRequest, getRefundRequests } from './refund.js'

const { mockFrom, mockGetActiveUser, qb } = vi.hoisted(() => {
  const mockGetActiveUser = vi.fn().mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@example.com' })
  const mockFrom = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      order: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
      single: vi.fn(() => Promise.resolve(resolved)),
      insert: vi.fn(() => b),
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
  mockGetActiveUser.mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@example.com' })
})

describe('refund service (wismaku-demo)', () => {
  it('berhasil membuat refund request', async () => {
    const row = {
      id: 'ref-1',
      booking_id: 'b-100',
      user_id: 'u-1',
      hotel_id: '1',
      guest_name: 'Budi Santoso',
      email: 'budi@example.com',
      amount: 350000,
      reason: 'Tiba-tiba ada urusan mendadak keluarga',
      bank_name: 'BCA',
      account_number: '1234567890',
      account_holder: 'Budi Santoso',
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    mockFrom.mockImplementation(() => qb({ data: row, error: null }))

    const res = await createRefundRequest({
      bookingId: 'b-100',
      hotelId: '1',
      guestName: 'Budi Santoso',
      email: 'budi@example.com',
      amount: 350000,
      reason: 'Tiba-tiba ada urusan mendadak keluarga',
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'Budi Santoso',
    })

    expect(res.id).toBe('ref-1')
    expect(res.amount).toBe(350000)
    expect(res.status).toBe('pending')
  })

  it('validasi input alasan dan info bank', async () => {
    await expect(
      createRefundRequest({
        bookingId: 'b-1',
        hotelId: '1',
        reason: 'abc', // < 5 karakter
        bankName: 'BCA',
        accountNumber: '123',
        accountHolder: 'Budi',
      }),
    ).rejects.toThrow()

    await expect(
      createRefundRequest({
        bookingId: 'b-1',
        hotelId: '1',
        reason: 'Alasan pembatalan valid',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
      }),
    ).rejects.toThrow('Informasi rekening bank tujuan refund harus lengkap')
  })

  it('getRefundRequests membaca data refund', async () => {
    mockFrom.mockImplementation(() =>
      qb({
        data: [
          {
            id: 'ref-1',
            booking_id: 'b-100',
            amount: 350000,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    )

    const list = await getRefundRequests({ email: 'budi@example.com' })
    expect(list.length).toBe(1)
    expect(list[0].id).toBe('ref-1')
  })
})
