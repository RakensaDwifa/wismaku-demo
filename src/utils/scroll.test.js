import { describe, expect, it } from 'vitest'
import { centeredScrollTop } from './scroll.js'

describe('centeredScrollTop', () => {
  it('menempatkan elemen tepat di tengah viewport', () => {
    const top = centeredScrollTop({
      elementTop: 2000,
      elementHeight: 300,
      scrollY: 0,
      viewportH: 900,
      headerH: 76,
    })
    expect(top).toBe(2000 - (900 - 300) / 2)
  })

  it('menjaga bagian atas elemen terlihat saat target tengah berada di atas halaman', () => {
    const top = centeredScrollTop({
      elementTop: 50,
      elementHeight: 200,
      scrollY: 0,
      viewportH: 900,
      headerH: 76,
    })
    expect(top).toBe(76)
  })

  it('memperhitungkan scrollY saat halaman sudah digulir', () => {
    const top = centeredScrollTop({
      elementTop: -400,
      elementHeight: 300,
      scrollY: 2400,
      viewportH: 900,
      headerH: 76,
    })
    expect(top).toBe(2000 - (900 - 300) / 2)
  })
})
