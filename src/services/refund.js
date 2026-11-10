import { supabase } from '../lib/supabase.js'
import { getActiveUser } from './member.js'

export const REFUND_CHANGE_EVENT = 'wismaku:refunds-changed'

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(REFUND_CHANGE_EVENT))
}

export async function getRefundRequests({ bookingId, email } = {}) {
  if (!supabase) return []
  let query = supabase.from('refund_requests').select('*').order('created_at', { ascending: false })

  if (bookingId) {
    query = query.eq('booking_id', String(bookingId))
  }
  if (email) {
    query = query.eq('email', String(email).trim().toLowerCase())
  }

  const { data, error } = await query
  if (error) return []

  return (data ?? []).map((r) => ({
    id: r.id,
    bookingId: r.booking_id,
    userId: r.user_id,
    hotelId: r.hotel_id,
    guestName: r.guest_name,
    email: r.email,
    amount: Number(r.amount),
    reason: r.reason,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    accountHolder: r.account_holder,
    status: r.status,
    hqNotes: r.hq_notes,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  }))
}

export async function createRefundRequest({
  bookingId,
  hotelId,
  guestName,
  email,
  amount,
  reason,
  bankName,
  accountNumber,
  accountHolder,
}) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  if (!bookingId) throw new Error('ID pesanan tidak valid.')
  if (!reason || reason.trim().length < 5) throw new Error('Alasan pengajuan refund minimal 5 karakter.')
  if (!bankName || !accountNumber || !accountHolder) {
    throw new Error('Informasi rekening bank tujuan refund harus lengkap.')
  }

  const user = await getActiveUser().catch(() => null)
  const cleanEmail = String(email || user?.email || '').trim().toLowerCase()

  const payload = {
    booking_id: bookingId,
    user_id: user?.id ?? null,
    hotel_id: String(hotelId),
    guest_name: guestName || user?.name || 'Tamu',
    email: cleanEmail,
    amount: Number(amount) || 0,
    reason: reason.trim(),
    bank_name: bankName.trim(),
    account_number: accountNumber.trim(),
    account_holder: accountHolder.trim(),
    status: 'pending',
  }

  const { data, error } = await supabase.from('refund_requests').insert(payload).select().single()
  if (error) throw new Error(error.message)

  notify()
  return {
    id: data.id,
    bookingId: data.booking_id,
    userId: data.user_id,
    hotelId: data.hotel_id,
    guestName: data.guest_name,
    email: data.email,
    amount: Number(data.amount),
    reason: data.reason,
    bankName: data.bank_name,
    accountNumber: data.account_number,
    accountHolder: data.account_holder,
    status: data.status,
    createdAt: data.created_at,
  }
}
