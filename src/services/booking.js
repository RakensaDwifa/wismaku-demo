import { supabase } from '../lib/supabase.js'
import { BookingPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { getActiveUser } from './member.js'

const CHANGE_EVENT = 'wismaku:bookings-changed'

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

const toDb = (payload, userId) => ({
  user_id: userId,
  hotel_id: String(payload.hotelId),
  hotel_name: payload.hotelName,
  hotel_img: payload.hotelImg ?? null,
  check_in: payload.checkIn ?? null,
  check_out: payload.checkOut ?? null,
  nights: payload.nights,
  rooms: payload.rooms,
  guests: payload.guests,
  room_type_id: payload.roomTypeId,
  room_type_name: payload.roomTypeName,
  room_price: payload.roomPrice,
  coupon_code: payload.couponCode ?? null,
  coupon_discount: payload.couponDiscount ?? 0,
  member_discount: payload.memberDiscount ?? 0,
  total_price: payload.totalPrice,
  guest_name: payload.guestName,
  email: payload.email,
  phone: payload.phone,
  status: 'pending',
})

const fromDb = (row) => ({
  id: row.id,
  createdAt: row.created_at,
  status: row.status,
  hotelId: row.hotel_id,
  hotelName: row.hotel_name,
  hotelImg: row.hotel_img,
  checkIn: row.check_in,
  checkOut: row.check_out,
  nights: row.nights,
  rooms: row.rooms,
  guests: row.guests,
  roomTypeId: row.room_type_id,
  roomTypeName: row.room_type_name,
  roomPrice: row.room_price,
  couponCode: row.coupon_code,
  couponDiscount: row.coupon_discount,
  memberDiscount: row.member_discount,
  totalPrice: row.total_price,
  guestName: row.guest_name,
  email: row.email,
  phone: row.phone,
  paymentMethod: row.payment_method,
  paidAt: row.paid_at,
  snapToken: row.snap_token ?? null,
  midtransOrderId: row.midtrans_order_id ?? null,
})

export async function getBookings() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(fromDb)
}

export async function getBookingById(id) {
  if (!supabase || !id) return null
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return fromDb(data)
}

export async function createBooking(payload) {
  const data = parsePayload(BookingPayloadSchema, payload)
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const user = await getActiveUser()
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert(toDb(data, user?.id))
    .select()
    .single()
  if (error) {
    if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) {
      throw new Error('Silakan masuk terlebih dahulu untuk membuat pesanan.')
    }
    throw new Error(error.message)
  }
  notify()
  return fromDb(booking)
}

export async function cancelBooking(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)
  notify()
}

export async function deleteBooking(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('status', 'cancelled')
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('Hanya pesanan yang sudah dibatalkan yang dapat dihapus.')
  }
  notify()
}

async function invokeMidtrans(body) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.functions.invoke('midtrans-token', { body })
  if (error) {
    let msg = error.message
    if (typeof error.context?.json === 'function') {
      const payload = await error.context.json().catch(() => null)
      if (payload?.error) msg = payload.error
    }
    throw new Error(msg || 'Gagal menghubungi layanan pembayaran.')
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function createSnapTransaction(id, { reset = false } = {}) {
  const data = await invokeMidtrans({ bookingId: id, action: reset ? 'reset' : 'token' })
  notify()
  return data
}

export async function verifyBookingPayment(id) {
  const data = await invokeMidtrans({ bookingId: id, action: 'verify' })
  notify()
  return data
}

// Kompatibilitas: migrateBookings dipanggil di modul lama. Sekarang no-op.
export const migrateBookings = () => []
export const migrateList = (list) => list
export const migrateImg = (b) => b
export const migrateDates = (b) => b
