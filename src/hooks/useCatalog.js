import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHotels, fetchCities, fetchPromos, fetchTestimonials } from '../services/hotel.js'

function useAsync(fetcher, initial) {
  const [data, setData] = useState(initial)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Satu sumber logic untuk pengambilan awal maupun pemanggilan ulang.
  // `run()` sengaja TIDAK melakukan setState secara sinkron: state di-update
  // di dalam callback promise. Reset `loading`/`error` dilakukan oleh pemanggil.
  const run = useCallback(() => {
    return fetcher()
      .then((value) => {
        if (!mounted.current) return
        setData(value)
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted.current) return
        setError(err)
        setLoading(false)
      })
  }, [fetcher])

  useEffect(() => {
    run()
  }, [run])

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    run()
  }, [run])

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
