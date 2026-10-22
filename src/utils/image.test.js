import { describe, expect, it } from 'vitest'
import { srcSet, withWidth } from './image.js'

const UNSPLASH = 'https://images.unsplash.com/photo-123?auto=format&fit=crop'

describe('withWidth', () => {
  it('menambahkan parameter w', () => {
    expect(withWidth(UNSPLASH, 400)).toContain('w=400')
  })

  it('mengganti parameter w yang sudah ada', () => {
    const url = new URL(withWidth(`${UNSPLASH}&w=100`, 400))
    expect(url.searchParams.get('w')).toBe('400')
  })

  it('meny mempertahankan parameter lain', () => {
    const url = new URL(withWidth(UNSPLASH, 400))
    expect(url.searchParams.get('auto')).toBe('format')
  })

  it('mengembalikan url apa adanya bila tidak valid', () => {
    expect(withWidth('bukan-url', 400)).toBe('bukan-url')
    expect(withWidth('', 400)).toBe('')
  })
})

describe('srcSet', () => {
  it('hanya membuat srcSet untuk host images.unsplash.com', () => {
    expect(srcSet(UNSPLASH)).toContain('400w')
    expect(srcSet('https://cdn.example.com/a.jpg')).toBeUndefined()
    expect(srcSet('https://images.example.com/a.jpg')).toBeUndefined()
  })

  it('mengembalikan undefined untuk url kosong', () => {
    expect(srcSet('')).toBeUndefined()
    expect(srcSet(undefined)).toBeUndefined()
    expect(srcSet(null)).toBeUndefined()
  })

  it('menghormati daftar lebar custom', () => {
    expect(srcSet(UNSPLASH, [200, 400])).toBe(
      `${withWidth(UNSPLASH, 200)} 200w, ${withWidth(UNSPLASH, 400)} 400w`,
    )
  })

  it('menghasilkan daftar lebar default bila tidak diisi', () => {
    const result = srcSet(UNSPLASH)
    expect(result).toContain('400w')
    expect(result).toContain('1600w')
  })
})
