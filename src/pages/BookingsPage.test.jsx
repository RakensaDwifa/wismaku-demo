import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BookingsPage from './BookingsPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetActiveUser = vi.fn()
const mockGetBookings = vi.fn()

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))
vi.mock('../components/AuthModal.jsx', () => ({ default: () => null }))

vi.mock('../services/member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
}))

vi.mock('../services/booking.js', () => ({
  getBookings: (...args) => mockGetBookings(...args),
  cancelBooking: vi.fn(),
  deleteBooking: vi.fn(),
}))

const sampleBookings = [
  {
    id: 'b-1',
    status: 'pending',
    hotelId: '1',
    hotelName: 'Wisma Pending',
    hotelImg: 'https://example.com/1.jpg',
    nights: 1,
    rooms: 1,
    guests: 2,
    totalPrice: 200000,
    guestName: 'Budi',
    expiresAt: '2099-01-01T00:00:00Z',
  },
  {
    id: 'b-2',
    status: 'confirmed',
    hotelId: '2',
    hotelName: 'Wisma Terkonfirmasi',
    hotelImg: 'https://example.com/2.jpg',
    nights: 2,
    rooms: 1,
    guests: 2,
    totalPrice: 400000,
    guestName: 'Budi',
  },
]

describe('BookingsPage (filter status)', () => {
  beforeEach(() => {
    mockGetActiveUser.mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@email.com' })
    mockGetBookings.mockResolvedValue(sampleBookings)
  })

  it('menyaring daftar pesanan berdasarkan tab status', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <MemoryRouter>
          <BookingsPage />
        </MemoryRouter>
      </LanguageProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Wisma Pending')).toBeInTheDocument()
    })
    expect(screen.getByText('Wisma Terkonfirmasi')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Terkonfirmasi \(1\)/ }))
    expect(screen.queryByText('Wisma Pending')).not.toBeInTheDocument()
    expect(screen.getByText('Wisma Terkonfirmasi')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Dibatalkan \(0\)/ }))
    expect(screen.getByText('Tidak ada pesanan dengan status ini.')).toBeInTheDocument()
  })
})
