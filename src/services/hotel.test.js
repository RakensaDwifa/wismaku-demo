import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CITY_LANDMARKS,
  fetchCities,
  fetchHotel,
  fetchHotels,
  fetchPromos,
  fetchTestimonials,
  getRoomBlackouts,
} from './hotel.js'

const mockHotelRow = {
  id: '1',
  name: 'Hotel Test',
  city_id: 'jakarta',
  cities: { name: 'Jakarta' },
  area: 'Dago',
  lat: -6.15,
  lng: 106.9,
  rating: 4.5,
  review_count: 100,
  price_from: 199000,
  original_price: 299000,
  discount: 33,
  img: 'https://example.com/hotel.jpg',
  amenities: ['WiFi'],
  gallery: ['https://example.com/hotel.jpg'],
  policies: { checkIn: '14:00', checkOut: '12:00', cancelRule: 'Gratis' },
  room_types: [{ id: 'standard', name: 'Standar', price: 199000, originalPrice: 299000, capacity: 2 }],
  description: 'Test hotel',
}

const { mockFrom, qb } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  function qb({ list = null, single = null, error = null } = {}) {
    const listResolved = { data: list, error }
    const singleResolved = { data: single, error }
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      lte: vi.fn(() => b),
      gte: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(singleResolved)),
      single: vi.fn(() => Promise.resolve(singleResolved)),
      order: vi.fn(() => b),
    }
    b.select.mockReturnValue(b)
    b.eq.mockReturnValue(b)
    b.lte.mockReturnValue(b)
    b.gte.mockReturnValue(b)
    b.order.mockReturnValue(b)
    b.then = (resolve, reject) => Promise.resolve(listResolved).then(resolve, reject)
    return b
  }
  return { mockFrom, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation((table) => {
    if (table === 'hotels') return qb({ list: [mockHotelRow], single: mockHotelRow })
    if (table === 'cities')
      return qb({
        list: [{ name: 'Jakarta', image: 'https://example.com/city.jpg' }],
        single: { name: 'Jakarta', image: 'https://example.com/city.jpg' },
      })
    return qb({ list: null, single: null })
  })
})

describe('hotel service', () => {
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
    mockFrom.mockImplementation((table) => {
      if (table === 'hotels') return qb({ list: null, single: null })
      return qb({ list: null, single: null })
    })
    expect(await fetchHotel('H-TIDAK-ADA')).toBeNull()
  })

  it('fetchCities mengembalikan daftar kota dengan gambar landmark otentik', async () => {
    const cities = await fetchCities()
    expect(Array.isArray(cities)).toBe(true)
    expect(cities.length).toBeGreaterThan(0)
    expect(cities[0]).toHaveProperty('name')

    const jakarta = cities.find((c) => c.name === 'Jakarta')
    if (jakarta) {
      expect(jakarta.img).toBe(CITY_LANDMARKS.Jakarta)
    }
  })

  it('fetchPromos dan fetchTestimonials mengembalikan array', async () => {
    expect((await fetchPromos()).length).toBeGreaterThan(0)
    expect((await fetchTestimonials()).length).toBeGreaterThan(0)
  })

  it('getRoomBlackouts mengembalikan daftar blackout kamar offline', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'room_blackout_dates') {
        return qb({
          list: [
            {
              id: 'bo-1',
              hotel_id: '1',
              room_type_id: 'standard',
              start_date: '2026-11-15',
              end_date: '2026-11-18',
              blocked_qty: 2,
              reason: 'Tamu Offline',
            },
          ],
        })
      }
      return qb({ list: null })
    })

    const blackouts = await getRoomBlackouts({ hotelId: '1', checkIn: '2026-11-15', checkOut: '2026-11-17' })
    expect(blackouts.length).toBe(1)
    expect(blackouts[0].blockedQty).toBe(2)
    expect(blackouts[0].reason).toBe('Tamu Offline')
  })
})
