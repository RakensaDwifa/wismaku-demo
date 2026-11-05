import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { usePageMeta } from './usePageMeta.js'

function Probe({ title, desc, image }) {
  usePageMeta(title, desc, { image })
  return null
}

describe('usePageMeta', () => {
  it('memperbarui canonical, og:url, dan og:image sesuai rute aktif lalu memulihkannya saat unmount', () => {
    document.head.innerHTML =
      '<link rel="canonical" href="https://wismaku-demo.vercel.app/" /><meta property="og:image" content="https://wismaku-demo.vercel.app/og-image.png" />'

    const { unmount } = render(
      <MemoryRouter initialEntries={['/hotel/1?adults=2']}>
        <Routes>
          <Route
            path="/hotel/:id"
            element={
              <Probe
                title="Wisma Nusantara - Jakarta"
                desc="Deskripsi hotel"
                image="https://example.com/hotel-1.jpg"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(document.title).toBe('Wisma Nusantara - Jakarta — WismaKu')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/hotel\/1$/)
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toMatch(/\/hotel\/1$/)
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://example.com/hotel-1.jpg',
    )
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://example.com/hotel-1.jpg',
    )

    unmount()

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://wismaku-demo.vercel.app/',
    )
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://wismaku-demo.vercel.app/og-image.png',
    )
  })
})
