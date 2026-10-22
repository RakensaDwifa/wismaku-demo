import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal.jsx'
import { LanguageProvider } from '../../i18n/index.jsx'

const renderModal = (props = {}) =>
  render(
    <LanguageProvider>
      <Modal onClose={() => {}} labelledBy="modal-title" {...props}>
        <h2 id="modal-title">Judul Penginapan</h2>
        <button type="button">Isi Modal</button>
      </Modal>
    </LanguageProvider>,
  )

describe('Modal', () => {
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('merender dialog dengan aria-modal dan aria-labelledby', () => {
    renderModal()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(screen.getByRole('heading', { name: 'Judul Penginapan' })).toBeInTheDocument()
  })

  it('tombol tutup memanggil onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal({ onClose })

    await user.click(screen.getByRole('button', { name: 'Tutup' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tombol Escape memanggil onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal({ onClose })

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('klik pada backdrop memanggil onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal({ onClose })

    await user.click(screen.getByRole('dialog').parentElement)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('klik di dalam panel tidak memanggil onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderModal({ onClose })

    await user.click(screen.getByRole('heading', { name: 'Judul Penginapan' }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('memindahkan fokus ke panel dialog', async () => {
    renderModal()

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
  })

  it('mengunci scroll body selama modal terbuka dan melepas saat ditutup', () => {
    const { unmount } = renderModal()

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
