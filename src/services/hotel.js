import { supabase } from '../lib/supabase.js'
import { promos, testimonials } from '../data/hotels.js'

const dbToHotel = (row) => ({
  id: row.id,
  name: row.name,
  city: row.cities?.name ?? row.city_id,
  area: row.area,
  lat: row.lat,
  lng: row.lng,
  rating: row.rating,
  reviews: row.review_count,
  price: row.price_from,
  originalPrice: row.original_price,
  discount: row.discount,
  img: row.img,
  desc: row.description,
  amenities: row.amenities ?? [],
  gallery: row.gallery ?? [],
  roomTypes: row.room_types ?? [],
  policy: row.policies ?? {},
  reviewList: [],
})

export async function fetchHotels() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase
    .from('hotels')
    .select('*, cities(name)')
    .order('id', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(dbToHotel)
}

export async function fetchHotel(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase
    .from('hotels')
    .select('*, cities(name)')
    .eq('id', String(id))
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? dbToHotel(data) : null
}

export async function fetchCities() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.from('cities').select('name, image').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({ name: c.name, img: c.image }))
}

export async function fetchPromos() {
  // Promo belum di-migrate ke DB; tetap dari data statis.
  return promos
}

export async function fetchTestimonials() {
  return testimonials
}
