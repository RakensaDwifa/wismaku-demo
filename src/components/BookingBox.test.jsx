import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { addDays } from 'date-fns'
import BookingBox from './BookingBox.jsx'
import { LanguageProvider } from '../i18n/index.jsx'
import { toYMD } from '../utils/format.js'

vi.mock('../services/member.js', () => ({
  getMember: vi.fn().mockResolvedValue(null),
  getActiveUser: vi.fn().mockResolvedValue({ id: 'u-1', name: 'Budi', email: 'budi@email.com' }),
}))

const sampleHotel = {
  id: '1',
  name: 'Wisma Nusantara',
  price: 200000,
  roomTypes: [{ id: 'standard', name: 'Standar', price: 200000, capacity: 2 }],
  policy: { cancelRule: 'Pembatalan gratis hingga 1 hari sebelum check-in' },
}

function BookingTarget() {
  const loc = useLocation()
  return <p data-testid="booking-url">{loc.pathname + loc.search}</p>
}

const renderBox = (search = { hasDates: false, nights: 0, checkIn: null, checkOut: null }) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/hotel/1']}>
        <Routes>
          <Route path="/hotel/:id" element={<BookingBox hotel={sampleHotel} search={search} />} />
          <Route path="/pesan/:id" element={<BookingTarget />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

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
})
