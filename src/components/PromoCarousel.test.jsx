import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PromoCarousel from './PromoCarousel.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const samplePromos = [
  { id: 1, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
  { id: 2, img: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e' },
  { id: 3, img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c' },
]

const renderCarousel = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PromoCarousel promos={samplePromos} onShowHotels={() => {}} />} />
          <Route path="/hasil" element={<div>Halaman Daftar Penginapan</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('PromoCarousel', () => {
  it('mengaktifkan pointer-events hanya pada slide aktif dan mengecualikan link slide nonaktif dari fokus tab', async () => {
    const user = userEvent.setup()
    const { container } = renderCarousel()

    await user.click(screen.getByRole('button', { name: 'Slide 2' }))

    const slides = container.querySelectorAll('[aria-roledescription="carousel"] > div[aria-hidden]')
    expect(slides).toHaveLength(3)

    expect(slides[1]).toHaveAttribute('aria-hidden', 'false')
    expect(slides[1].classList.contains('pointer-events-auto')).toBe(true)
    expect(slides[1].classList.contains('pointer-events-none')).toBe(false)

    expect(slides[0]).toHaveAttribute('aria-hidden', 'true')
    expect(slides[0].classList.contains('pointer-events-none')).toBe(true)
    expect(slides[0].classList.contains('pointer-events-auto')).toBe(false)
    expect(slides[0].querySelector('a')).toHaveAttribute('tabindex', '-1')
  })

  it('mengarahkan tombol Pesan Sekarang ke /hasil saat diklik', async () => {
    const user = userEvent.setup()
    renderCarousel()

    await user.click(screen.getByRole('button', { name: 'Slide 2' }))
    const activeLink = screen.getByRole('link', { name: 'Pesan Sekarang' })
    expect(activeLink).toHaveAttribute('href', '/hasil')

    await user.click(activeLink)
    expect(screen.getByText('Halaman Daftar Penginapan')).toBeInTheDocument()
  })
})
