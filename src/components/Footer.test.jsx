import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Footer from './Footer.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

describe('Footer', () => {
  it('menautkan semua link bantuan dan kota populer tanpa link mati Karier/Blog Travel', async () => {
    const user = userEvent.setup()
    const onOpenPartner = vi.fn()

    render(
      <LanguageProvider>
        <MemoryRouter>
          <Footer onOpenPartner={onOpenPartner} />
        </MemoryRouter>
      </LanguageProvider>,
    )

    expect(screen.queryByText('Karier')).not.toBeInTheDocument()
    expect(screen.queryByText('Blog Travel')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Hubungi Kami' })).toHaveAttribute('href', '/bantuan')
    expect(screen.getByRole('link', { name: 'Hotel Bandung' })).toHaveAttribute('href', '/hasil?q=Bandung')
    expect(screen.getByRole('link', { name: 'dukungan@wismaku.id' })).toHaveAttribute(
      'href',
      'mailto:dukungan@wismaku.id',
    )

    await user.click(screen.getByRole('link', { name: 'Daftarkan Properti' }))
    expect(onOpenPartner).toHaveBeenCalledTimes(1)
  })
})
