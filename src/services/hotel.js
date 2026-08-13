import { request, USE_MOCK } from './api.js'
import { hotels as mockHotels, promos, testimonials } from '../data/hotels.js'
import { cities as mockCities } from '../data/cities.js'

const withDelay = (value, ms = 300) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

export async function fetchHotels() {
  if (USE_MOCK) return withDelay(mockHotels)
  return request('/hotels')
}

export async function fetchHotel(id) {
  if (USE_MOCK) return withDelay(mockHotels.find((h) => String(h.id) === String(id)) ?? null)
  return request(`/hotels/${id}`)
}

export async function fetchCities() {
  if (USE_MOCK) return withDelay(mockCities)
  return request('/cities')
}

export async function fetchPromos() {
  if (USE_MOCK) return withDelay(promos)
  return request('/promos')
}

export async function fetchTestimonials() {
  if (USE_MOCK) return withDelay(testimonials)
  return request('/testimonials')
}
