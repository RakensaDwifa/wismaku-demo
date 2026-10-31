import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BookingPage from './BookingPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockCreateBooking = vi.fn()

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))

vi.mock('../hooks/useCatalog.js', () => ({
  useHotels: () => ({
    loading: false,
    hotels: [
      {
        id: '1',
        name: 'Wisma Nusantara',
        area: 'Menteng',
        city: 'Jakarta',
        rating: 4.7,
        reviews: 120,
        price: 200000,
        img: 'https://example.com/hotel.jpg',
        roomTypes: [{ id: 'standard', name: 'Standar', price: 200000, capacity: 2 }],
      },
    ],
  }),
}))

vi.mock('../services/member.js', () => ({
  getMember: vi.fn().mockResolvedValue(null),
  getActiveUser: vi.fn().mockResolvedValue({ id: 'u-1', name: 'Budi Santoso', email: 'budi@email.com' }),
  openAuthModal: vi.fn(),
}))

vi.mock('../services/coupon.js', () => ({
  applyCoupon: vi.fn(),
}))

vi.mock('../services/booking.js', () => ({
  createBooking: (...args) => mockCreateBooking(...args),
}))

const renderBookingPage = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/pesan/1?checkIn=2026-11-05&checkOut=2026-11-07&rooms=1&adults=2']}>
        <Routes>
          <Route path="/pesan/:id" element={<BookingPage />} />
          <Route path="/bayar/:id" element={<p>Halaman Pembayaran</p>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('BookingPage (panduan Data Pemesan)', () => {
  beforeEach(() => {
    mockCreateBooking.mockReset()
  })

  it('menampilkan info pengarah di bawah tombol Konfirmasi Pesanan, memfokuskan kolom kosong saat diklik, lalu lanjut ke pembayaran setelah lengkap', async () => {
    const user = userEvent.setup()
    mockCreateBooking.mockResolvedValue({ id: 'b-501' })
    renderBookingPage()

    await waitFor(() => {
      expect(screen.getByLabelText('Nama Lengkap')).toHaveValue('Budi Santoso')
    })

    const confirmBtn = screen.getByRole('button', { name: 'Konfirmasi Pesanan' })
    const aside = confirmBtn.closest('aside')
    expect(aside).toHaveTextContent(/Silakan lengkapi Data Pemesan/i)

    await user.click(confirmBtn)

    const phoneInput = screen.getByLabelText('No. HP')
    expect(phoneInput).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent('Nomor HP minimal 8 digit angka.')
    expect(mockCreateBooking).not.toHaveBeenCalled()

    await user.type(phoneInput, '081234567890')
    expect(aside).not.toHaveTextContent(/Silakan lengkapi Data Pemesan/i)

    await user.click(confirmBtn)
    await waitFor(() => {
      expect(screen.getByText('Halaman Pembayaran')).toBeInTheDocument()
    })
    expect(mockCreateBooking).toHaveBeenCalledTimes(1)
  })
})
