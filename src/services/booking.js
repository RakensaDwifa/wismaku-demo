import { supabase } from '../lib/supabase.js'
import { BookingPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { getActiveUser } from './member.js'

const CHANGE_EVENT = 'wismaku:bookings-changed'

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function initBookingsRealtime() {
  if (typeof window === 'undefined' || !supabase) return () => {}
  try {
    const channel = supabase
      .channel('wismaku-guest-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        notify()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  } catch (err) {
    console.warn('[initBookingsRealtime] Realtime init warning:', err)
    return () => {}
  }
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
  expiresAt: row.expires_at,
  snapToken: row.snap_token ?? null,
  midtransOrderId: row.midtrans_order_id ?? null,
  platformFee: row.platform_fee ?? 0,
  partnerNet: row.partner_net ?? 0,
  payoutId: row.payout_id ?? null,
  originalCheckIn: row.original_check_in ?? null,
  originalCheckOut: row.original_check_out ?? null,
  rescheduleCount: Number(row.reschedule_count ?? 0),
  rescheduledAt: row.rescheduled_at ?? null,
  weekendSurchargePercent: Number(row.weekend_surcharge_percent ?? 0),
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

export async function rescheduleBooking(id, { newCheckIn, newCheckOut }) {
  if (!newCheckIn || !newCheckOut) {
    throw new Error('Tanggal check-in dan check-out baru wajib dipilih.')
  }
  const inDate = new Date(newCheckIn)
  const outDate = new Date(newCheckOut)
  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    throw new Error('Format tanggal tidak valid.')
  }
  if (outDate <= inDate) {
    throw new Error('Tanggal check-out harus setelah tanggal check-in.')
  }

  const booking = await getBookingById(id)
  if (!booking) throw new Error('Data reservasi tidak ditemukan.')
  if (booking.status === 'cancelled') {
    throw new Error('Pesanan yang telah dibatalkan tidak dapat diubah tanggalnya.')
  }

  const newNights = Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)))
  const oldNights = Math.max(1, Number(booking.nights) || 1)
  // ponytail: tarif per malam diturunkan dari total (termasuk surcharge weekend lama).
  // Ganti dengan lookup katalog hotel bila harga pokok perlu presisi penuh.
  const pricePerNight = Math.round(Number(booking.totalPrice) / oldNights)
  const newTotalPrice = pricePerNight * newNights
  const priceDifference = newTotalPrice - Number(booking.totalPrice)

  const origIn = booking.originalCheckIn || booking.checkIn
  const origOut = booking.originalCheckOut || booking.checkOut
  const newCount = (booking.rescheduleCount || 0) + 1
  const rescheduledAt = new Date().toISOString()

  if (!supabase) {
    notify()
    return {
      ...booking,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights: newNights,
      totalPrice: newTotalPrice,
      originalCheckIn: origIn,
      originalCheckOut: origOut,
      rescheduleCount: newCount,
      rescheduledAt,
      priceDifference,
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      check_in: newCheckIn,
      check_out: newCheckOut,
      nights: newNights,
      total_price: newTotalPrice,
      original_check_in: origIn,
      original_check_out: origOut,
      reschedule_count: newCount,
      rescheduled_at: rescheduledAt,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  notify()
  return {
    ...fromDb(data),
    priceDifference,
  }
}

// Kompatibilitas: migrateBookings dipanggil di modul lama. Sekarang no-op.
export const migrateBookings = () => []
export const migrateList = (list) => list
export const migrateImg = (b) => b
export const migrateDates = (b) => b
