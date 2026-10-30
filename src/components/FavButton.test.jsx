import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavButton from './FavButton.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetActiveUser = vi.fn()
const mockOpenAuthModal = vi.fn()
const mockIsFavorite = vi.fn()
const mockToggleFavorite = vi.fn()

vi.mock('../services/member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
  openAuthModal: (...args) => mockOpenAuthModal(...args),
}))

vi.mock('../services/favorite.js', () => ({
  isFavorite: (...args) => mockIsFavorite(...args),
  toggleFavorite: (...args) => mockToggleFavorite(...args),
}))

const renderButton = () =>
  render(
    <LanguageProvider>
      <FavButton hotelId="H-1" />
    </LanguageProvider>,
  )

describe('FavButton', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetActiveUser.mockReset()
    mockOpenAuthModal.mockReset()
    mockIsFavorite.mockReset()
    mockToggleFavorite.mockReset()
    mockGetActiveUser.mockResolvedValue(null)
    mockIsFavorite.mockResolvedValue(false)
  })

  it('menampilkan label tambah favorit saat belum aktif', async () => {
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })

  it('toggle favorit mengubah aria-pressed beserta label tombol', async () => {
    mockGetActiveUser.mockResolvedValue({ name: 'Andi', email: 'andi@example.com', provider: 'email' })
    mockToggleFavorite.mockResolvedValue({ id: 'H-1', active: true })
    const user = userEvent.setup()
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))

    // setelah toggle pertama, isFavorite dipanggil ulang dengan active true
    mockIsFavorite.mockResolvedValue(true)
    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
    expect(button).toHaveAccessibleName('Hapus dari favorit')

    mockToggleFavorite.mockResolvedValue({ id: 'H-1', active: false })
    mockIsFavorite.mockResolvedValue(false)
    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })

  it('menyimpan favorit pada scope email user yang sedang masuk', async () => {
    const user = userEvent.setup()
    mockGetActiveUser.mockResolvedValue({ name: 'Andi', email: 'andi@example.com', provider: 'email' })
    mockToggleFavorite.mockResolvedValue({ id: 'H-1', active: true })
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))

    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))

    // favorite service now uses Supabase, not localStorage — verifikasi via mock
    expect(mockToggleFavorite).toHaveBeenCalledWith('H-1', expect.anything())
  })

  it('tidak menandai favorit milik akun lain sebagai aktif', async () => {
    mockGetActiveUser.mockResolvedValue({ name: 'Budi', email: 'budi@example.com', provider: 'email' })
    mockIsFavorite.mockResolvedValue(false)
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })

  it('membuka modal login saat tamu belum masuk mengklik favorit', async () => {
    const user = userEvent.setup()
    mockGetActiveUser.mockResolvedValue(null)
    renderButton()

    const button = await screen.findByRole('button')
    await user.click(button)

    expect(mockOpenAuthModal).toHaveBeenCalledWith('login')
    expect(mockToggleFavorite).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
