import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaymentPage from './PaymentPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetBookingById = vi.fn()
const mockCreateSnapTransaction = vi.fn()
const mockVerifyBookingPayment = vi.fn()
const mockLoadMidtransSnap = vi.fn()

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))

vi.mock('../services/booking.js', () => ({
  getBookingById: (...args) => mockGetBookingById(...args),
  createSnapTransaction: (...args) => mockCreateSnapTransaction(...args),
  verifyBookingPayment: (...args) => mockVerifyBookingPayment(...args),
}))

vi.mock('../lib/midtrans.js', () => ({
  loadMidtransSnap: (...args) => mockLoadMidtransSnap(...args),
}))

const sampleBooking = {
  id: 'b-101',
  status: 'pending',
  hotelId: '1',
  hotelName: 'Wisma Nusantara',
  hotelImg: 'https://example.com/hotel.jpg',
  checkIn: '2026-11-01',
  checkOut: '2026-11-03',
  nights: 2,
  rooms: 1,
  guests: 2,
  roomTypeId: 'standard',
  roomTypeName: 'Standar',
  roomPrice: 200000,
  couponCode: null,
  couponDiscount: 0,
  memberDiscount: 0,
  totalPrice: 400000,
  guestName: 'Budi Santoso',
  snapToken: null,
  midtransOrderId: null,
}

const renderPaymentPage = (id = 'b-101') =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/bayar/${id}`]}>
        <Routes>
          <Route path="/bayar/:id" element={<PaymentPage />} />
          <Route path="/pesanan/sukses/:id" element={<p>Halaman Sukses</p>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('PaymentPage (Midtrans Snap)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetBookingById.mockReset()
    mockCreateSnapTransaction.mockReset()
    mockVerifyBookingPayment.mockReset()
    mockLoadMidtransSnap.mockReset()
  })

  it('membuka pop-up Snap saat Bayar Sekarang diklik lalu redirect setelah verifikasi sukses', async () => {
    const user = userEvent.setup()
    mockGetBookingById.mockResolvedValue({ ...sampleBooking })
    mockCreateSnapTransaction.mockResolvedValue({
      status: 'pending',
      token: 'snap-tok-abc',
      orderId: 'WK-B101-1',
      clientKey: 'Mid-client-xyz',
    })
    mockVerifyBookingPayment.mockResolvedValue({ status: 'confirmed', paymentMethod: 'qris' })
    const snapPay = vi.fn((_token, callbacks) => {
      callbacks.onSuccess()
    })
    mockLoadMidtransSnap.mockResolvedValue({ pay: snapPay })

    renderPaymentPage()

    const payBtn = await screen.findByRole('button', { name: /Bayar Sekarang/i })
    await user.click(payBtn)

    expect(mockCreateSnapTransaction).toHaveBeenCalledWith('b-101', { reset: false })
    expect(mockLoadMidtransSnap).toHaveBeenCalledWith('Mid-client-xyz')
    expect(snapPay).toHaveBeenCalledWith('snap-tok-abc', expect.any(Object))

    await waitFor(() => {
      expect(mockVerifyBookingPayment).toHaveBeenCalledWith('b-101')
      expect(screen.getByText('Halaman Sukses')).toBeInTheDocument()
    })
  })

  it('memblokir pembayaran dan menyembunyikan tombol bayar untuk pesanan berstatus cancelled', async () => {
    mockGetBookingById.mockResolvedValue({ ...sampleBooking, status: 'cancelled' })

    renderPaymentPage()

    expect(await screen.findByRole('heading', { name: 'Pesanan Telah Dibatalkan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bayar Sekarang/i })).not.toBeInTheDocument()
  })

  it('menampilkan aksi Cek Status dan Ganti Metode ketika snapToken sudah ada', async () => {
    const user = userEvent.setup()
    mockGetBookingById.mockResolvedValue({
      ...sampleBooking,
      snapToken: 'existing-tok',
      midtransOrderId: 'WK-EXISTING',
    })
    mockCreateSnapTransaction.mockResolvedValue({
      status: 'pending',
      token: 'fresh-tok',
      orderId: 'WK-FRESH',
      clientKey: 'Mid-client-xyz',
    })
    mockLoadMidtransSnap.mockResolvedValue({ pay: vi.fn() })

    renderPaymentPage()

    expect(await screen.findByRole('button', { name: 'Cek Status Pembayaran' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ganti Metode Pembayaran' }))

    expect(mockCreateSnapTransaction).toHaveBeenCalledWith('b-101', { reset: true })
  })

  it('menampilkan hitung mundur saat belum kedaluwarsa', async () => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    mockGetBookingById.mockResolvedValue({ ...sampleBooking, expiresAt })

    renderPaymentPage()

    expect(await screen.findByText(/Selesaikan pembayaran dalam \d{2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bayar Sekarang/i })).toBeEnabled()
  })

  it('menonaktifkan tombol bayar saat waktu pembayaran habis', async () => {
    const expiresAt = new Date(Date.now() - 60 * 1000).toISOString()
    mockGetBookingById.mockResolvedValue({ ...sampleBooking, expiresAt })

    renderPaymentPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Waktu pembayaran habis')
    expect(screen.getByRole('button', { name: /Bayar Sekarang/i })).toBeDisabled()
  })
})
