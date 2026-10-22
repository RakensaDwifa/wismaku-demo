import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mode API disimulasikan dengan memock `USE_MOCK` menjadi false.
const requestMock = vi.hoisted(() => vi.fn())

vi.mock('./api.js', () => ({
  USE_MOCK: false,
  request: requestMock,
}))

const { toggleFavorite } = await import('./favorite.js')

describe('toggleFavorite pada mode API', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('menambah favorit saat status saat ini false', async () => {
    requestMock.mockImplementation((path) => {
      if (path.startsWith('/favorites/')) return Promise.resolve(false)
      return Promise.resolve({})
    })

    const result = await toggleFavorite('H-1', { email: 'andi@example.com' })

    expect(result).toEqual({ id: 'H-1', active: true })
    expect(requestMock).toHaveBeenCalledWith('/favorites', {
      method: 'POST',
      body: { hotelId: 'H-1' },
    })
  })

  it('menghapus favorit saat status saat ini true', async () => {
    requestMock.mockImplementation((path) => {
      if (path.startsWith('/favorites/')) return Promise.resolve(true)
      return Promise.resolve({})
    })

    const result = await toggleFavorite('H-1', { email: 'andi@example.com' })

    expect(result).toEqual({ id: 'H-1', active: false })
    expect(requestMock).toHaveBeenCalledWith('/favorites/H-1', { method: 'DELETE' })
  })

  it('menormalisasi id menjadi string', async () => {
    requestMock.mockImplementation((path) => {
      if (path.startsWith('/favorites/')) return Promise.resolve(false)
      return Promise.resolve({})
    })

    const result = await toggleFavorite(7, { email: 'andi@example.com' })

    expect(result.id).toBe('7')
    expect(requestMock).toHaveBeenCalledWith('/favorites', {
      method: 'POST',
      body: { hotelId: '7' },
    })
  })
})
