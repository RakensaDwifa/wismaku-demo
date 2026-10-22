import { describe, expect, it } from 'vitest'
import { fetchCities, fetchHotel, fetchHotels, fetchPromos, fetchTestimonials } from './hotel.js'

describe('hotel service pada mode mock', () => {
  it('fetchHotels mengembalikan daftar hotel', async () => {
    const hotels = await fetchHotels()
    expect(Array.isArray(hotels)).toBe(true)
    expect(hotels.length).toBeGreaterThan(0)
  })

  it('fetchHotel mengembalikan hotel yang cocok dengan id', async () => {
    const hotels = await fetchHotels()
    const target = hotels[0]

    const hotel = await fetchHotel(target.id)
    expect(hotel).toEqual(target)
  })

  it('fetchHotel mencocokkan id bertipe number maupun string', async () => {
    const hotels = await fetchHotels()
    const target = hotels[0]

    expect(await fetchHotel(String(target.id))).toEqual(target)
  })

  it('fetchHotel mengembalikan null untuk id yang tidak dikenal', async () => {
    expect(await fetchHotel('H-TIDAK-ADA')).toBeNull()
  })

  it('fetchCities mengembalikan daftar kota', async () => {
    const cities = await fetchCities()
    expect(Array.isArray(cities)).toBe(true)
    expect(cities.length).toBeGreaterThan(0)
    expect(cities[0]).toHaveProperty('name')
  })

  it('fetchPromos dan fetchTestimonials mengembalikan array', async () => {
    expect((await fetchPromos()).length).toBeGreaterThan(0)
    expect((await fetchTestimonials()).length).toBeGreaterThan(0)
  })
})
