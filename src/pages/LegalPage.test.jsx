import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import LegalPage from './LegalPage.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

vi.mock('../components/TopBar.jsx', () => ({ default: () => null }))
vi.mock('../components/Header.jsx', () => ({ default: () => null }))
vi.mock('../components/Footer.jsx', () => ({ default: () => null }))

const renderDoc = (doc) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/x']}>
        <Routes>
          <Route path="/x" element={<LegalPage doc={doc} />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

describe('LegalPage', () => {
  it.each([
    ['terms', 'Syarat & Ketentuan'],
    ['privacy', 'Kebijakan Privasi'],
    ['faq', 'Pusat Bantuan / FAQ'],
  ])('menampilkan judul dan bagian untuk %s', (doc, title) => {
    localStorage.clear()
    renderDoc(doc)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(5)
  })
})
