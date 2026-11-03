import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HotelDetailPage from './HotelDetailPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))
vi.mock('../components/HotelDetailContent.jsx', () => ({
  default: () => <div data-testid="hotel-detail-content" />,
}))
vi.mock('../components/BookingBox.jsx', () => ({ default: () => <div data-testid="booking-box" /> }))
vi.mock('../components/FavButton.jsx', () => ({ default: () => <button type="button">Fav</button> }))

vi.mock('../hooks/useCatalog.js', () => ({
  useHotels: () => ({
    loading: false,
    hotels: [
      {
        id: '1',
        name: 'Wisma Asri Menteng',
        area: 'Menteng',
        city: 'Jakarta',
        rating: 4.8,
        reviews: 95,
        price: 250000,
        img: 'https://example.com/asri.jpg',
      },
    ],
  }),
}))

const renderDetailPage = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/hotel/1']}>
        <Routes>
          <Route path="/hotel/:id" element={<HotelDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('HotelDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('menyediakan tombol bagikan hotel dan menyalin tautan bila navigator.share tidak tersedia', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })

    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'Wisma Asri Menteng' })).toBeInTheDocument()

    const shareBtn = screen.getByRole('button', { name: 'Bagikan' })
    expect(shareBtn).toBeInTheDocument()

    await user.click(shareBtn)

    expect(writeText).toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent('Tautan disalin!')
  })

  it('memanggil navigator.share bila didukung oleh browser', async () => {
    const user = userEvent.setup()
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
      writable: true,
    })

    renderDetailPage()

    const shareBtn = await screen.findByRole('button', { name: 'Bagikan' })
    await user.click(shareBtn)

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Wisma Asri Menteng',
      }),
    )
  })
})
