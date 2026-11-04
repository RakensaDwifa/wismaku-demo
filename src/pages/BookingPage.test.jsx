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

const mockGetActiveUser = vi.fn()
const mockGetMember = vi.fn()

vi.mock('../services/member.js', () => ({
  getMember: (...args) => mockGetMember(...args),
  getActiveUser: (...args) => mockGetActiveUser(...args),
  openAuthModal: vi.fn(),
}))

const mockApplyCoupon = vi.fn()
const mockFetchCoupons = vi.fn()

vi.mock('../services/coupon.js', () => ({
  applyCoupon: (...args) => mockApplyCoupon(...args),
  fetchCoupons: (...args) => mockFetchCoupons(...args),
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
    mockApplyCoupon.mockReset()
    mockGetMember.mockReset().mockResolvedValue(null)
    mockGetActiveUser
      .mockReset()
      .mockResolvedValue({ id: 'u-1', name: 'Budi Santoso', email: 'budi@email.com' })
    mockFetchCoupons
      .mockReset()
      .mockResolvedValue([{ code: 'WISMA20', label: 'Diskon 20%', pct: 20, maxDiscount: 200000 }])
  })

  it('mengisi otomatis nama, email, dan nomor HP dari profil pengguna aktif', async () => {
    mockGetActiveUser.mockResolvedValue({
      id: 'u-1',
      name: 'Budi Santoso',
      email: 'budi@email.com',
      phone: '081299998888',
    })
    renderBookingPage()

    await waitFor(() => {
      expect(screen.getByLabelText('No. HP')).toHaveValue('081299998888')
    })
    expect(screen.getByLabelText('Nama Lengkap')).toHaveValue('Budi Santoso')
    expect(screen.getByLabelText('Email')).toHaveValue('budi@email.com')
  })

  it('menampilkan chip kupon cepat dan dapat dipilih langsung', async () => {
    const user = userEvent.setup()
    mockApplyCoupon.mockResolvedValue({
      code: 'WISMA20',
      label: 'Diskon 20%',
      pct: 20,
      maxDiscount: 200000,
      amount: 80000,
    })

    renderBookingPage()

    const couponChip = await screen.findByRole('button', { name: /WISMA20/i })
    expect(couponChip).toBeInTheDocument()

    await user.click(couponChip)

    await waitFor(() => {
      expect(mockApplyCoupon).toHaveBeenCalledWith('WISMA20', expect.any(Number))
    })
    expect(await screen.findByText(/Kupon WISMA20 berlaku/i)).toBeInTheDocument()
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
