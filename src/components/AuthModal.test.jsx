import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockLoginUser = vi.fn()
const mockRegisterUser = vi.fn()
const mockRequestReset = vi.fn()
const mockVerifyOtp = vi.fn()

vi.mock('../services/member.js', () => ({
  loginUser: (...args) => mockLoginUser(...args),
  registerUser: (...args) => mockRegisterUser(...args),
  requestPasswordReset: (...args) => mockRequestReset(...args),
  verifyPasswordResetOtp: (...args) => mockVerifyOtp(...args),
}))

const renderModal = (props = {}) => {
  const onClose = vi.fn()
  render(
    <LanguageProvider>
      <AuthModal onClose={onClose} {...props} />
    </LanguageProvider>,
  )
  return { onClose }
}

const submitButton = (label) => screen.getAllByRole('button', { name: label }).at(-1)

describe('AuthModal', () => {
  beforeEach(() => {
    localStorage.clear()
    mockLoginUser.mockReset()
    mockRegisterUser.mockReset()
    mockRequestReset.mockReset()
    mockVerifyOtp.mockReset()
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
    mockRegisterUser.mockRejectedValue(
      Object.assign(new Error('User already registered'), { code: 'EMAIL_TAKEN' }),
    )
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
    mockLoginUser.mockRejectedValue(
      Object.assign(new Error('Invalid login credentials'), { code: 'INVALID_CREDENTIALS' }),
    )
    renderModal()

    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia999')
    await user.click(submitButton('Masuk'))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email atau password salah.'))
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'auth-modal-error')
  })

  it('menutup modal setelah login berhasil', async () => {
    const user = userEvent.setup()
    mockLoginUser.mockResolvedValue({ id: 'u-1', name: 'Siti Aminah', email: 'siti@email.com' })
    const { onClose } = renderModal()

    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia123')
    await user.click(submitButton('Masuk'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('menutup modal setelah daftar berhasil', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockResolvedValue({ id: 'u-2', name: 'Siti Baru', email: 'baru@email.com' })
    const { onClose } = renderModal({ initialTab: 'register' })

    await user.type(screen.getByLabelText('Nama Lengkap'), 'Siti Baru')
    await user.type(screen.getByLabelText('Email'), 'baru@email.com')
    await user.type(screen.getByLabelText('Password'), 'rahasia123')
    await user.click(submitButton('Daftar'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('alur lupa password: kirim kode verifikasi lalu selesaikan dengan OTP dan password baru', async () => {
    const user = userEvent.setup()
    mockRequestReset.mockResolvedValue(undefined)
    mockVerifyOtp.mockResolvedValue(undefined)
    const { onClose } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Lupa password?' }))
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.click(screen.getByRole('button', { name: 'Kirim Kode Verifikasi' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Jika email terdaftar')
    expect(mockRequestReset).toHaveBeenCalledWith('siti@email.com')

    // Langkah 2: verifikasi OTP + password baru
    const otpInput = await screen.findByLabelText('Kode Verifikasi (OTP)')
    expect(otpInput).toBeInTheDocument()
    const newPwInput = screen.getByLabelText('Password Baru')
    expect(newPwInput).toBeInTheDocument()

    await user.type(otpInput, '12345678')
    await user.type(newPwInput, 'BaruPass123')
    await user.click(screen.getByRole('button', { name: 'Verifikasi & Simpan Password' }))

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'siti@email.com',
        token: '12345678',
        password: 'BaruPass123',
      })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('lupa password menampilkan step verifikasi walau service gagal (tidak bocorkan email)', async () => {
    const user = userEvent.setup()
    mockRequestReset.mockRejectedValue(new Error('User not found'))
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Lupa password?' }))
    await user.type(screen.getByLabelText('Email'), 'tidak-ada@email.com')
    await user.click(screen.getByRole('button', { name: 'Kirim Kode Verifikasi' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Jika email terdaftar')
    expect(await screen.findByLabelText('Kode Verifikasi (OTP)')).toBeInTheDocument()
  })

  it('menolak format OTP yang salah saat verifikasi', async () => {
    const user = userEvent.setup()
    mockRequestReset.mockResolvedValue(undefined)
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Lupa password?' }))
    await user.type(screen.getByLabelText('Email'), 'siti@email.com')
    await user.click(screen.getByRole('button', { name: 'Kirim Kode Verifikasi' }))

    const otpInput = await screen.findByLabelText('Kode Verifikasi (OTP)')
    await user.type(otpInput, '123')
    await user.type(screen.getByLabelText('Password Baru'), 'BaruPass123')
    await user.click(screen.getByRole('button', { name: 'Verifikasi & Simpan Password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Kode verifikasi salah/i)
    expect(mockVerifyOtp).not.toHaveBeenCalled()
  })

  it('dapat menampilkan dan menyembunyikan password saat toggle diklik', async () => {
    const user = userEvent.setup()
    renderModal()

    const pwInput = screen.getByLabelText('Password')
    expect(pwInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByRole('button', { name: 'Lihat password' })
    await user.click(toggleBtn)

    expect(pwInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Sembunyikan password' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sembunyikan password' }))
    expect(pwInput).toHaveAttribute('type', 'password')
  })
})
