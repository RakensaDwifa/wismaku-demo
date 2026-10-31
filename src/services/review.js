import { supabase } from '../lib/supabase.js'
import { ReviewPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { getActiveUser } from './member.js'

const CHANGE_EVENT = 'wismaku:reviews-changed'

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

const fromDb = (row) => ({
  id: row.id,
  hotelId: row.hotel_id,
  userId: row.user_id ?? null,
  name: row.name,
  city: row.city,
  rating: row.rating,
  text: row.text,
  verifiedGuest: Boolean(row.verified_guest),
  date: row.created_at ? row.created_at.slice(0, 10) : null,
  createdAt: row.created_at,
})

export async function getReviews(hotelId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('id, hotel_id, user_id, name, city, rating, text, verified_guest, created_at')
    .eq('hotel_id', String(hotelId))
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(fromDb)
}

export async function addReview(payload) {
  const data = parsePayload(ReviewPayloadSchema, payload)
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const user = await getActiveUser()
  // cegah duplikat per pengguna (kalau sudah login)
  if (user?.id) {
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('hotel_id', String(data.hotelId))
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) throw new Error('Anda sudah mengulas penginapan ini.')
  }
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      hotel_id: String(data.hotelId),
      user_id: user?.id ?? null,
      name: data.name,
      city: data.city ?? null,
      rating: data.rating,
      text: data.text,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) {
      throw new Error('Silakan masuk terlebih dahulu untuk mengirim ulasan.')
    }
    throw new Error(error.message)
  }
  notify()
  return fromDb(review)
}

export async function updateReview(id, payload) {
  const data = parsePayload(ReviewPayloadSchema, payload)
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const user = await getActiveUser()
  if (!user?.id) throw new Error('Silakan masuk terlebih dahulu untuk mengubah ulasan.')
  const { data: review, error } = await supabase
    .from('reviews')
    .update({
      name: data.name,
      city: data.city ?? null,
      rating: data.rating,
      text: data.text,
    })
    .eq('id', String(id))
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify()
  return fromDb(review)
}

export async function deleteReview(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const user = await getActiveUser()
  if (!user?.id) throw new Error('Silakan masuk terlebih dahulu untuk menghapus ulasan.')
  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', String(id))
    .eq('user_id', user.id)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Ulasan tidak ditemukan atau bukan milik Anda.')
  notify()
}
