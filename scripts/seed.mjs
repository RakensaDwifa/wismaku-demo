// ============================================================================
// Seed katalog WismaKu ke Supabase.
// ============================================================================
// Sumber data: src/data/{cities,hotels,coupons}.js (mock data lama). Skrip ini
// dijalankan sekali per environment (dev/CI) dengan service role key:
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role_jwt> \
//   node scripts/seed.mjs
//
// Idempoten: upsert berdasarkan PK, dan review seed dihapus dulu agar tidak
// berlipat ganda. Data pengguna (profiles, bookings, ...) TIDAK disentuh.
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { cities } from '../src/data/cities.js'
import { hotels } from '../src/data/hotels.js'
import { coupons } from '../src/data/coupons.js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terlebih dahulu.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const slug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const cityRows = cities.map((c) => ({
  id: slug(c.name),
  name: c.name,
  slug: slug(c.name),
  image: c.img,
}))

const hotelRows = hotels.map((h) => ({
  id: String(h.id),
  city_id: slug(h.city),
  name: h.name,
  slug: slug(h.name),
  description: h.desc,
  address: h.area ? `${h.area}, ${h.city}` : h.city,
  area: h.area ?? null,
  lat: h.lat ?? null,
  lng: h.lng ?? null,
  rating: h.rating ?? null,
  review_count: h.reviews ?? 0,
  price_from: h.price ?? null,
  original_price: h.originalPrice ?? null,
  discount: h.discount ?? null,
  img: h.img ?? null,
  amenities: h.amenities ?? [],
  gallery: h.gallery ?? [],
  policies: h.policy ?? {},
  room_types: h.roomTypes ?? [],
}))

const reviewRows = []
for (const h of hotels) {
  for (const r of h.reviewList ?? []) {
    reviewRows.push({
      hotel_id: String(h.id),
      name: r.name,
      city: r.city ?? null,
      rating: r.rating,
      text: r.text,
    })
  }
}

const couponRows = coupons.map((c) => ({
  code: c.code,
  label: c.label ?? null,
  discount_pct: c.pct,
  max_discount: c.maxDiscount ?? null,
  active: true,
}))

async function upsert(table, rows, onConflict) {
  if (!rows.length) {
    console.log(`${table}: 0 rows (skip)`)
    return
  }
  const { error } = await supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined)
  if (error) {
    console.error(`${table}:`, error)
    process.exit(1)
  }
  console.log(`${table}: ${rows.length} rows upserted`)
}

// urutan penting: cities dulu (FK), lalu hotels, lalu reviews (FK hotel)
await upsert('cities', cityRows, 'id')
await upsert('hotels', hotelRows, 'id')
await upsert('coupons', couponRows, 'code')

// reviews seed: hapus review tanpa user (seed) dulu agar idempoten, lalu insert
const { error: delErr } = await supabase.from('reviews').delete().is('user_id', null)
if (delErr) {
  console.error('reviews delete (seed):', delErr)
  process.exit(1)
}
const { error: revErr } = await supabase.from('reviews').insert(reviewRows)
if (revErr) {
  console.error('reviews insert:', revErr)
  process.exit(1)
}
console.log(`reviews: ${reviewRows.length} rows inserted`)

console.log('Seed selesai.')
