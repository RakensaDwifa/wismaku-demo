import { supabase } from '../lib/supabase.js'

const promos = [
  {
    id: 1,
    title: 'Diskon hingga 40%',
    subtitle: 'Staycation hemat di 3500+ properti',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 2,
    title: 'Promo Penginapan Sesuai Budget',
    subtitle: 'Harga mulai Rp 99rb/malam',
    img: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=60',
  },
  {
    id: 3,
    title: 'Vila & Apartemen Pilihan',
    subtitle: 'Liburan bareng keluarga jadi lebih mudah',
    img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=60',
  },
]

const testimonials = [
  {
    name: 'Andini P.',
    city: 'Jakarta',
    text: 'Harga murah tapi kamar bersih dan rapi. Check-in cepat, wifi kencang. Recommended banget!',
    rating: 5,
  },
  {
    name: 'Bagas S.',
    city: 'Bandung',
    text: 'Booking lewat web-nya gampang, promo diskonnya beneran berlaku. Pas check-in tinggal tunjuk kode.',
    rating: 5,
  },
  {
    name: 'Citra M.',
    city: 'Yogyakarta',
    text: 'Lokasi strategis dekat Malioboro, pelayanan ramah. Saya selalu pakai aplikasi ini tiap dinas.',
    rating: 4,
  },
  {
    name: 'Dimas K.',
    city: 'Surabaya',
    text: 'Penginapan malam pertama dapat upgrade kamar. Staff sangat membantu kebutuhan saya.',
    rating: 5,
  },
]

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
