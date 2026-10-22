import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

function Boom() {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  let consoleError

  // React (mode dev) memantulkan kembali error yang tertangkap ErrorBoundary
  // lewat event 'error' di window. jsdom memaparkannya ke stderr; kita
  // preventDefault() agar log test tetap bersih.
  const swallowWindowError = (event) => event.preventDefault()

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.addEventListener('error', swallowWindowError)
  })

  afterEach(() => {
    window.removeEventListener('error', swallowWindowError)
    consoleError.mockRestore()
  })

  it('menampilkan tampilan cadangan saat child melempar error', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </LanguageProvider>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ups, terjadi kesalahan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeInTheDocument()
  })

  it('merender children secara normal saat tidak ada kegagalan', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <p>Halaman normal</p>
        </ErrorBoundary>
      </LanguageProvider>,
    )

    expect(screen.getByText('Halaman normal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
