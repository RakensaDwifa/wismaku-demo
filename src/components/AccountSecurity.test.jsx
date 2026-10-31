import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountSecurity from './AccountSecurity.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockUpdatePassword = vi.fn()
const mockDeleteAccount = vi.fn()

vi.mock('../services/member.js', () => ({
  updatePassword: (...args) => mockUpdatePassword(...args),
  deleteAccount: (...args) => mockDeleteAccount(...args),
}))

const renderSecurity = (user = { id: 'u-1', email: 'budi@email.com', provider: 'email' }) => {
  const onDeleted = vi.fn()
  render(
    <LanguageProvider>
      <AccountSecurity user={user} onDeleted={onDeleted} />
    </LanguageProvider>,
  )
  return { onDeleted }
}

describe('AccountSecurity', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUpdatePassword.mockReset()
    mockDeleteAccount.mockReset()
  })

  it('mengubah password dan menampilkan status berhasil', async () => {
    const user = userEvent.setup()
    mockUpdatePassword.mockResolvedValue(undefined)
    renderSecurity()

    await user.type(screen.getByLabelText('Password Baru'), 'rahasia123')
    await user.click(screen.getByRole('button', { name: 'Simpan Password' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Password berhasil diperbarui.')
    expect(mockUpdatePassword).toHaveBeenCalledWith('rahasia123')
  })

  it('menyembunyikan form ubah password untuk akun OAuth', () => {
    renderSecurity({ id: 'u-2', email: 'g@gmail.com', provider: 'google' })
    expect(screen.queryByLabelText('Password Baru')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hapus Akun Saya' })).toBeInTheDocument()
  })

  it('hapus akun butuh ketik email yang cocok sebelum tombol aktif', async () => {
    const user = userEvent.setup()
    mockDeleteAccount.mockResolvedValue(undefined)
    const { onDeleted } = renderSecurity()

    await user.click(screen.getByRole('button', { name: 'Hapus Akun Saya' }))
    const confirmBtn = screen.getByRole('button', { name: 'Ya, Hapus Permanen' })
    expect(confirmBtn).toBeDisabled()

    await user.type(screen.getByLabelText(/Ketik email Anda/), 'salah@email.com')
    expect(confirmBtn).toBeDisabled()

    await user.clear(screen.getByLabelText(/Ketik email Anda/))
    await user.type(screen.getByLabelText(/Ketik email Anda/), 'BUDI@email.com')
    expect(confirmBtn).toBeEnabled()
    await user.click(confirmBtn)

    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockDeleteAccount).toHaveBeenCalledWith('BUDI@email.com')
  })

  it('menampilkan error server saat hapus akun ditolak', async () => {
    const user = userEvent.setup()
    mockDeleteAccount.mockRejectedValue(new Error('Akun tidak dapat dihapus selama masih ada pesanan.'))
    const { onDeleted } = renderSecurity()

    await user.click(screen.getByRole('button', { name: 'Hapus Akun Saya' }))
    await user.type(screen.getByLabelText(/Ketik email Anda/), 'budi@email.com')
    await user.click(screen.getByRole('button', { name: 'Ya, Hapus Permanen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('masih ada pesanan')
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
