import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BookingSuccessPage from './BookingSuccessPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetBookingById = vi.fn()

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))

vi.mock('../services/booking.js', () => ({
  getBookingById: (...args) => mockGetBookingById(...args),
}))

const sampleBooking = {
  id: 'b-999',
  hotelId: '1',
  hotelName: 'Wisma Asri',
  hotelImg: 'https://example.com/asri.jpg',
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  nights: 2,
  rooms: 1,
  guests: 2,
  roomTypeId: 'deluxe',
  roomTypeName: 'Deluxe Room',
  roomPrice: 300000,
  couponDiscount: 0,
  memberDiscount: 0,
  totalPrice: 600000,
  guestName: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '081234567890',
  paymentMethod: 'qris',
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00Z',
}

const renderPage = (id = 'b-999') =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/booking/success/${id}`]}>
        <Routes>
          <Route path="/booking/success/:id" element={<BookingSuccessPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('BookingSuccessPage', () => {
  beforeEach(() => {
    mockGetBookingById.mockReset()
  })

  it('memuat data booking dan menampilkan tombol Cetak E-Tiket', async () => {
    mockGetBookingById.mockResolvedValue(sampleBooking)
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()

    renderPage()

    const printBtn = await screen.findByRole('button', { name: /Cetak E-Tiket/i })
    expect(printBtn).toBeInTheDocument()

    expect(screen.getAllByText('b-999')).toHaveLength(2)
    expect(screen.getByText('Wisma Asri')).toBeInTheDocument()

    await user.click(printBtn)
    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })

  it('menampilkan status tidak ditemukan bila booking gagal dimuat', async () => {
    mockGetBookingById.mockRejectedValue(new Error('Not found'))
    renderPage('b-unknown')

    expect(await screen.findByText('Pesanan tidak ditemukan.')).toBeInTheDocument()
  })
})
