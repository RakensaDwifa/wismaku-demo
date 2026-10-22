import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CityChips from './CityChips.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const cities = [
  { name: 'Jakarta', img: 'https://images.unsplash.com/photo-1.jpg' },
  { name: 'Bandung', img: 'https://images.unsplash.com/photo-2.jpg' },
]

const renderChips = (props = {}) =>
  render(
    <LanguageProvider>
      <CityChips cities={cities} onPick={() => {}} {...props} />
    </LanguageProvider>,
  )

describe('CityChips', () => {
  it('menampilkan judul section dan daftar kota', () => {
    renderChips()

    expect(screen.getByRole('heading', { name: 'Cari Penginapan di Kota Favoritmu' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('memanggil onPick dengan nama kota saat chip diklik', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    renderChips({ onPick })

    await user.click(screen.getByRole('button', { name: /Jakarta/ }))

    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick).toHaveBeenCalledWith('Jakarta')
  })

  it('menampilkan skeleton dan menyembunyikan daftar kota saat loading', () => {
    const { container } = renderChips({ loading: true })

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('menampilkan ErrorBanner beserta tombol coba lagi saat gagal memuat', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    renderChips({ error: new Error('jaringan bermasalah'), onRetry })

    expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat kota.')

    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('menyembunyikan tombol coba lagi ketika onRetry tidak diberikan', () => {
    renderChips({ error: new Error('jaringan bermasalah') })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Coba Lagi' })).toBeNull()
  })
})
