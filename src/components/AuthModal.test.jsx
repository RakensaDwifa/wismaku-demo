import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal.jsx'
import { LanguageProvider } from '../i18n/index.jsx'
import { registerUser, logout } from '../services/member.js'

const renderModal = (props = {}) => {
  const onClose = vi.fn()
  render(
    <LanguageProvider>
      <AuthModal onClose={onClose} {...props} />
    </LanguageProvider>,
  )
  return { onClose }
}

/** Tombol submit berada setelah tombol tab, jadi ambil yang terakhir. */
const submitButton = (label) => screen.getAllByRole('button', { name: label }).at(-1)

describe('AuthModal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menolak password kurang dari 8 karakter saat mendaftar', async () => {
    const user = userEvent.setup()
    renderModal({ initialTab: 'register' })

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Siti Aminah')
    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasi1')
    await user.click(submitButton('Daftar'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Password minimal 8 karakter.')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('menolak password tanpa angka', async () => {
    const user = userEvent.setup()
    renderModal({ initialTab: 'register' })

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Siti Aminah')
    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasiaku')
    await user.click(submitButton('Daftar'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Password harus memuat huruf dan angka.')
  })

  it('menampilkan pesan khusus saat email sudah terdaftar', async () => {
    const user = userEvent.setup()
    await registerUser({ name: 'Siti Aminah', email: 'siti@email.com', password: 'rahasia123' })
    await logout()
    renderModal({ initialTab: 'register' })

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Siti Lain')
    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia123')
    await user.click(submitButton('Daftar'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ini sudah terdaftar.')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('menampilkan pesan generik dan menandai field password saat kredensial salah', async () => {
    const user = userEvent.setup()
    await registerUser({ name: 'Siti Aminah', email: 'siti@email.com', password: 'rahasia123' })
    await logout()
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia999')
    await user.click(submitButton('Masuk'))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email atau password salah.'))
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    // hint password hanya dirender di tab Daftar, jadi di tab Masuk referensinya cukup error saja
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'auth-modal-error')
  })

  it('menutup modal setelah login berhasil', async () => {
    const user = userEvent.setup()
    await registerUser({ name: 'Siti Aminah', email: 'siti@email.com', password: 'rahasia123' })
    await logout()
    const { onClose } = renderModal()

    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia123')
    await user.click(submitButton('Masuk'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
