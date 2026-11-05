import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetActiveUser = vi.fn()
const mockGetMember = vi.fn()

vi.mock('../services/member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
  getMember: (...args) => mockGetMember(...args),
  logout: vi.fn(),
  OPEN_AUTH_EVENT: 'wismaku:open-auth',
}))

vi.mock('../services/booking.js', () => ({
  getBookings: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/favorite.js', () => ({
  getFavorites: vi.fn().mockResolvedValue([]),
}))

vi.mock('./AuthModal.jsx', () => ({ default: () => null }))

describe('Header', () => {
  beforeEach(() => {
    mockGetActiveUser.mockReset()
    mockGetMember.mockReset()
  })

  it('menampilkan badge Member berdampingan dengan avatar akun serta link Akun Saya di menu mobile', async () => {
    const user = userEvent.setup()
    mockGetActiveUser.mockResolvedValue({
      id: 'u-1',
      name: 'Budi Santoso',
      email: 'budi@email.com',
    })
    mockGetMember.mockResolvedValue({
      id: 'm-1',
      member_no: 'MC-1',
      name: 'Budi Santoso',
    })

    render(
      <LanguageProvider>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </LanguageProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Member/)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'Akun Saya' })).toHaveAttribute('href', '/akun')

    await user.click(screen.getByRole('button', { name: 'Buka menu' }))
    const accountLinks = screen.getAllByRole('link', { name: 'Akun Saya' })
    expect(accountLinks.length).toBe(2)
    expect(accountLinks[1]).toHaveAttribute('href', '/akun')
  })
})
