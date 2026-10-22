import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const { fetchHotels, fetchCities, fetchPromos, fetchTestimonials } = vi.hoisted(() => ({
  fetchHotels: vi.fn(),
  fetchCities: vi.fn(),
  fetchPromos: vi.fn(),
  fetchTestimonials: vi.fn(),
}))

vi.mock('../services/hotel.js', () => ({
  fetchHotels,
  fetchCities,
  fetchPromos,
  fetchTestimonials,
}))

const { useHotels } = await import('./useCatalog.js')

describe('useHotels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memuat daftar hotel saat komponen mount', async () => {
    fetchHotels.mockResolvedValue([{ id: 1, name: 'Hotel A' }])

    const { result } = renderHook(() => useHotels())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hotels).toEqual([{ id: 1, name: 'Hotel A' }])
    expect(result.current.error).toBeNull()
    expect(fetchHotels).toHaveBeenCalledTimes(1)
  })

  it('menyimpan error saat pemuatan gagal', async () => {
    fetchHotels.mockRejectedValue(new Error('jaringan bermasalah'))

    const { result } = renderHook(() => useHotels())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.hotels).toEqual([])
  })

  it('refetch mengembalikan undefined, bukan fungsi cleanup', async () => {
    fetchHotels.mockResolvedValue([{ id: 1 }])

    const { result } = renderHook(() => useHotels())
    await waitFor(() => expect(result.current.loading).toBe(false))

    fetchHotels.mockResolvedValue([{ id: 2 }])

    let returned
    await act(async () => {
      returned = result.current.refetch()
    })

    expect(returned).toBeUndefined()
    await waitFor(() => expect(result.current.hotels).toEqual([{ id: 2 }]))
    expect(fetchHotels).toHaveBeenCalledTimes(2)
  })

  it('refetch mengembalikan data terbaru setelah error sebelumnya', async () => {
    fetchHotels.mockRejectedValueOnce(new Error('sementara gagal'))

    const { result } = renderHook(() => useHotels())
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))

    fetchHotels.mockResolvedValue([{ id: 3 }])

    await act(async () => {
      result.current.refetch()
    })

    await waitFor(() => expect(result.current.hotels).toEqual([{ id: 3 }]))
    expect(result.current.error).toBeNull()
  })
})
