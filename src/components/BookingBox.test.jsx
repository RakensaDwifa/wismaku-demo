import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { addDays } from 'date-fns'
import BookingBox from './BookingBox.jsx'
import { LanguageProvider } from '../i18n/index.jsx'
import { toYMD } from '../utils/format.js'

const { mockGetMember, mockGetActiveUser, mockLoginUser } = vi.hoisted(() => ({
  mockGetMember: vi.fn(),
  mockGetActiveUser: vi.fn(),
  mockLoginUser: vi.fn(),
}))

vi.mock('../services/member.js', () => ({
  getMember: (...args) => mockGetMember(...args),
  getActiveUser: (...args) => mockGetActiveUser(...args),
  loginUser: (...args) => mockLoginUser(...args),
  registerUser: vi.fn(),
  loginGoogle: vi.fn(),
  loginFacebook: vi.fn(),
  requestPasswordReset: vi.fn(),
  verifyPasswordResetOtp: vi.fn(),
}))

const sampleHotel = {
  id: '1',
  name: 'Wisma Nusantara',
  price: 200000,
  roomTypes: [
    { id: 'standard', name: 'Standar', price: 200000, capacity: 2 },
    { id: 'deluxe', name: 'Deluxe', price: 320000, capacity: 2 },
  ],
  policy: { cancelRule: 'Pembatalan gratis hingga 1 hari sebelum check-in' },
}

function BookingTarget() {
  const loc = useLocation()
  return <p data-testid="booking-url">{loc.pathname + loc.search}</p>
}

function HotelRoute({ hotel = sampleHotel, search }) {
  const loc = useLocation()
  return (
    <div>
      <p data-testid="hotel-url">{loc.pathname}</p>
      <BookingBox hotel={hotel} search={search} />
    </div>
  )
}

const renderBox = (
  search = { hasDates: false, nights: 0, checkIn: null, checkOut: null },
  initialEntry = '/hotel/1',
  hotel = sampleHotel,
) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<p data-testid="home-page">Beranda</p>} />
          <Route path="/hotel/:id" element={<HotelRoute hotel={hotel} search={search} />} />
          <Route path="/pesan/:id" element={<BookingTarget />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMember.mockResolvedValue(null)
  mockGetActiveUser.mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@email.com' })
  window.history.replaceState(null, '', '/')
})

describe('BookingBox', () => {
  it('otomatis memakai tanggal hari pemesanan (hari ini -> besok) saat belum ada tanggal terpilih dan meneruskannya ke /pesan/:id', async () => {
    const user = userEvent.setup()
    const today = new Date()
    const expectedIn = toYMD(today)
    const expectedOut = toYMD(addDays(today, 1))

    renderBox()

    expect(screen.queryByText(/Belum ada tanggal terpilih/i)).not.toBeInTheDocument()
    expect(screen.getByText(/\(1 malam\)/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pilih tanggal check-in' }))
    expect(screen.getByText('1 malam')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pesan Sekarang' }))

    const url = screen.getByTestId('booking-url').textContent
    expect(url).toContain('/pesan/1?')
    expect(url).toContain(`checkIn=${expectedIn}`)
    expect(url).toContain(`checkOut=${expectedOut}`)
  })

  it('menampilkan rentang tanggal dan jumlah malam sesuai parameter pencarian', () => {
    renderBox({ hasDates: true, nights: 3, checkIn: '2026-11-05', checkOut: '2026-11-08' })

    expect(screen.getByText(/\(3 malam\)/i)).toBeInTheDocument()
    expect(screen.getByText('Rp 600.000')).toBeInTheDocument()
  })

  it('membuka modal login saat belum login, tetap di halaman detail hotel setelah masuk, lalu lanjut memesan', async () => {
    const user = userEvent.setup()
    mockGetActiveUser.mockResolvedValue(null)
    mockLoginUser.mockImplementation(async () => {
      const loggedIn = { id: 'u-9', name: 'Siti', email: 'siti@email.com' }
      mockGetActiveUser.mockResolvedValue(loggedIn)
      window.dispatchEvent(new Event('wismaku:session-changed'))
      return loggedIn
    })

    renderBox({ hasDates: true, nights: 2, checkIn: '2026-11-10', checkOut: '2026-11-12' }, '/hotel/42', {
      ...sampleHotel,
      id: '42',
    })

    await user.click(screen.getByRole('button', { name: /Deluxe/i }))
    await user.click(screen.getByRole('button', { name: 'Pesan Sekarang' }))

    // Membuka modal login, tidak berpindah ke /pesan/42 maupun kembali ke beranda
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('booking-url')).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    expect(screen.getByTestId('hotel-url')).toHaveTextContent('/hotel/42')
    expect(window.location.pathname).toBe('/hotel/42')
    expect(window.location.search).toContain('roomTypeId=deluxe')
    expect(window.location.search).toContain('checkIn=2026-11-10')
    expect(window.location.search).toContain('checkOut=2026-11-12')

    // Login lewat modal
    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia123')
    await user.click(screen.getAllByRole('button', { name: 'Masuk' }).at(-1))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Tetap di /hotel/42 dengan pilihan kamar & tanggal utuh
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    expect(screen.queryByTestId('booking-url')).not.toBeInTheDocument()
    expect(screen.getByTestId('hotel-url')).toHaveTextContent('/hotel/42')
    expect(screen.getByRole('button', { name: /Deluxe/i })).toHaveAttribute('aria-pressed', 'true')

    // Klik Pesan Sekarang lagi setelah login -> lanjut ke /pesan/42
    await user.click(screen.getByRole('button', { name: 'Pesan Sekarang' }))
    const bookingUrl = (await screen.findByTestId('booking-url')).textContent
    expect(bookingUrl).toContain('/pesan/42?')
    expect(bookingUrl).toContain('roomTypeId=deluxe')
    expect(bookingUrl).toContain('checkIn=2026-11-10')
    expect(bookingUrl).toContain('checkOut=2026-11-12')
  })

  it('memulihkan pilihan tipe kamar dari query URL detail hotel', () => {
    renderBox(
      { hasDates: true, nights: 2, checkIn: '2026-11-10', checkOut: '2026-11-12' },
      '/hotel/1?roomTypeId=deluxe&checkIn=2026-11-10&checkOut=2026-11-12',
    )

    expect(screen.getByRole('button', { name: /Deluxe/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
