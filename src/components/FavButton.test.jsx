import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavButton from './FavButton.jsx'
import { LanguageProvider } from '../i18n/index.jsx'
import { loginGoogle } from '../services/member.js'

const renderButton = () =>
  render(
    <LanguageProvider>
      <FavButton hotelId="H-1" />
    </LanguageProvider>,
  )

describe('FavButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menampilkan label tambah favorit saat belum aktif', async () => {
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })

  it('toggle favorit mengubah aria-pressed beserta label tombol', async () => {
    const user = userEvent.setup()
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))

    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
    expect(button).toHaveAccessibleName('Hapus dari favorit')

    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })

  it('menyimpan favorit pada scope email user yang sedang masuk', async () => {
    const user = userEvent.setup()
    await loginGoogle({ name: 'Andi', email: 'andi@example.com' })
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))

    await user.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))

    expect(JSON.parse(localStorage.getItem('wismaku_favorites:andi@example.com'))).toEqual(['H-1'])
    expect(localStorage.getItem('wismaku_favorites')).toBeNull()
  })

  it('tidak menandai favorit milik akun lain sebagai aktif', async () => {
    await loginGoogle({ name: 'Andi', email: 'andi@example.com' })
    localStorage.setItem('wismaku_favorites:andi@example.com', JSON.stringify(['H-1']))

    await loginGoogle({ name: 'Budi', email: 'budi@example.com' })
    renderButton()

    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
    expect(button).toHaveAccessibleName('Tambahkan ke favorit')
  })
})
