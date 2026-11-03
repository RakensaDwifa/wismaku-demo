import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AccountPage from './AccountPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetActiveUser = vi.fn()
const mockGetMember = vi.fn()
const mockGetBookings = vi.fn()
const mockGetFavorites = vi.fn()
const mockUpdateProfile = vi.fn()
const mockLogout = vi.fn()

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))
vi.mock('../components/AccountSecurity.jsx', () => ({
  default: () => <div data-testid="account-security" />,
}))

vi.mock('../services/member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
  getMember: (...args) => mockGetMember(...args),
  updateProfile: (...args) => mockUpdateProfile(...args),
  logout: (...args) => mockLogout(...args),
}))

vi.mock('../services/booking.js', () => ({
  getBookings: (...args) => mockGetBookings(...args),
}))

vi.mock('../services/favorite.js', () => ({
  getFavorites: (...args) => mockGetFavorites(...args),
}))

const sampleUser = {
  id: 'u-101',
  name: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '081234567890',
  provider: 'email',
  loggedInAt: '2026-11-01T10:00:00Z',
}

const renderAccountPage = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBookings.mockResolvedValue([])
    mockGetFavorites.mockResolvedValue([])
    mockGetMember.mockResolvedValue(null)
  })

  it('menampilkan opsi login jika pengguna belum masuk (guest state)', async () => {
    mockGetActiveUser.mockResolvedValue(null)
    renderAccountPage()

    expect(await screen.findByText('Masuk atau Daftar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument()
  })

  it('menampilkan profil pengguna dan membuka mode edit profil', async () => {
    mockGetActiveUser.mockResolvedValue(sampleUser)
    const user = userEvent.setup()

    renderAccountPage()

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('081234567890')).toBeInTheDocument()

    const editBtn = screen.getByRole('button', { name: 'Edit Profil' })
    await user.click(editBtn)

    const nameInput = screen.getByLabelText('Nama Lengkap')
    const phoneInput = screen.getByLabelText('Nomor HP')

    expect(nameInput).toHaveValue('Budi Santoso')
    expect(phoneInput).toHaveValue('081234567890')

    await user.clear(nameInput)
    await user.type(nameInput, 'Budi Baru')

    await user.clear(phoneInput)
    await user.type(phoneInput, '089876543210')

    mockUpdateProfile.mockResolvedValue({
      ...sampleUser,
      name: 'Budi Baru',
      phone: '089876543210',
    })

    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Budi Baru',
        phone: '089876543210',
      })
    })

    expect(await screen.findByText('Profil berhasil diperbarui.')).toBeInTheDocument()
    expect(screen.getByText('Budi Baru')).toBeInTheDocument()
    expect(screen.getByText('089876543210')).toBeInTheDocument()
  })

  it('menampilkan pesan error saat update profile gagal', async () => {
    mockGetActiveUser.mockResolvedValue(sampleUser)
    mockUpdateProfile.mockRejectedValue(new Error('Gagal menyimpan ke server'))
    const user = userEvent.setup()

    renderAccountPage()

    await screen.findByText('Budi Santoso')
    await user.click(screen.getByRole('button', { name: 'Edit Profil' }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal menyimpan ke server')
  })
})
