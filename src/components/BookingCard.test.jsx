import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BookingCard from './BookingCard.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const sampleBooking = {
  id: 'b-201',
  status: 'cancelled',
  hotelId: '2',
  hotelName: 'Kost Eksklusif Sentul City',
  hotelImg: 'https://example.com/sentul.jpg',
  checkIn: null,
  checkOut: null,
  nights: 1,
  rooms: 1,
  guests: 2,
  roomTypeId: 'family',
  roomTypeName: 'Family',
  totalPrice: 456000,
  guestName: 'Budi Santoso',
}

const renderCard = (booking, { onCancel = vi.fn(), onDelete = vi.fn() } = {}) =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <ul>
          <BookingCard booking={booking} onCancel={onCancel} onDelete={onDelete} />
        </ul>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('BookingCard (hapus pesanan dibatalkan)', () => {
  it('menampilkan tombol Hapus pada pesanan cancelled dan memanggil onDelete setelah konfirmasi modal', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderCard(sampleBooking, { onDelete })

    expect(screen.queryByRole('button', { name: 'Batal' })).not.toBeInTheDocument()
    const deleteBtn = screen.getByRole('button', { name: 'Hapus' })
    await user.click(deleteBtn)

    expect(screen.getByRole('heading', { name: 'Hapus Riwayat Pesanan?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ya, Hapus' }))

    expect(onDelete).toHaveBeenCalledWith('b-201')
  })

  it('tidak menampilkan tombol Hapus untuk pesanan yang masih confirmed atau pending', () => {
    renderCard({ ...sampleBooking, status: 'confirmed' })

    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument()
  })

  it('menampilkan link Lihat E-Tiket dan Tulis Ulasan pada pesanan confirmed', () => {
    renderCard({ ...sampleBooking, status: 'confirmed' })
    const ticketLink = screen.getByRole('link', { name: 'Lihat E-Tiket' })
    expect(ticketLink).toBeInTheDocument()
    expect(ticketLink).toHaveAttribute('href', '/pesanan/sukses/b-201')

    const reviewLink = screen.getByRole('link', { name: 'Tulis Ulasan' })
    expect(reviewLink).toHaveAttribute('href', '/hotel/2#ulasan')
  })

  it('menampilkan badge Kedaluwarsa dan menyembunyikan tombol Bayar Sekarang jika pending sudah lewat expiresAt', () => {
    renderCard({
      ...sampleBooking,
      status: 'pending',
      expiresAt: '2020-01-01T00:00:00Z',
    })

    expect(screen.getByText('Kedaluwarsa')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Bayar Sekarang' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument()
  })
})
