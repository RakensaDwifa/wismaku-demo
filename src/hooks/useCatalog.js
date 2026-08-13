import { useCallback, useEffect, useState } from 'react'
import { fetchHotels, fetchCities, fetchPromos, fetchTestimonials } from '../services/hotel.js'

function useAsync(fetcher, initial) {
  const [data, setData] = useState(initial)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    fetcher()
      .then((value) => {
        if (!live) return
        setData(value)
        setLoading(false)
      })
      .catch((err) => {
        if (!live) return
        setError(err)
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [fetcher])

  const refetch = useCallback(() => {
    let live = true
    setLoading(true)
    setError(null)
    fetcher()
      .then((value) => {
        if (!live) return
        setData(value)
        setLoading(false)
      })
      .catch((err) => {
        if (!live) return
        setError(err)
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [fetcher])

  return { data, error, loading, refetch }
}

export function useHotels() {
  const { data, ...rest } = useAsync(
    useCallback(() => fetchHotels(), []),
    [],
  )
  return { hotels: data, ...rest }
}

export function useCities() {
  const { data, ...rest } = useAsync(
    useCallback(() => fetchCities(), []),
    [],
  )
  return { cities: data, ...rest }
}

export function usePromos() {
  return useAsync(
    useCallback(() => fetchPromos(), []),
    [],
  )
}

export function useTestimonials() {
  return useAsync(
    useCallback(() => fetchTestimonials(), []),
    [],
  )
}
