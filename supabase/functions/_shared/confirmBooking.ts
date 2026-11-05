import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendBookingConfirmationEmail, type BookingEmailData } from './email.ts'

export interface ConfirmBookingInput {
  booking: BookingEmailData & {
    status?: string | null
    paid_at?: string | null
    payment_method?: string | null
  }
  paymentMethod: string | null
}

/**
 * Mengonfirmasi pesanan secara atomik (hanya bila status belum 'confirmed')
 * sehingga email konfirmasi terkirim tepat satu kali walau verify klien
 * dan webhook Midtrans berjalan berbarengan atau di-retry.
 */
export async function confirmBookingOnce(
  supabaseAdmin: SupabaseClient,
  { booking, paymentMethod }: ConfirmBookingInput,
): Promise<{ paidAt: string; method: string | null; transitioned: boolean; error: string | null }> {
  const paidAt = booking.paid_at ?? new Date().toISOString()
  const method = paymentMethod ?? booking.payment_method ?? null

  const { data: updated, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'confirmed', payment_method: method, paid_at: paidAt })
    .eq('id', booking.id)
    .neq('status', 'confirmed')
    .select('id, paid_at, payment_method')
    .maybeSingle()

  if (error) {
    return { paidAt, method, transitioned: false, error: error.message }
  }

  if (updated) {
    await sendBookingConfirmationEmail({ ...booking, payment_method: method })
    return {
      paidAt: updated.paid_at ?? paidAt,
      method: updated.payment_method ?? method,
      transitioned: true,
      error: null,
    }
  }

  return { paidAt, method, transitioned: false, error: null }
}
