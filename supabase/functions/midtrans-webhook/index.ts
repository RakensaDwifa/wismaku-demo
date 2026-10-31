import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const normalizeMethod = (paymentType?: string | null): string | null => {
  if (!paymentType) return null
  if (
    ['bank_transfer', 'echannel', 'permata', 'bca_va', 'bni_va', 'bri_va', 'cimb_va'].includes(paymentType)
  ) {
    return 'va'
  }
  if (paymentType === 'qris') return 'qris'
  if (['gopay', 'shopeepay', 'dana', 'ovo'].includes(paymentType)) return 'ewallet'
  return paymentType
}

const sha512Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-512', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const timingSafeEqualStr = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''

  if (!supabaseUrl || !serviceRoleKey || !serverKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400)
  }

  const orderId = String(payload.order_id ?? '')
  const statusCode = String(payload.status_code ?? '')
  const grossAmount = String(payload.gross_amount ?? '')
  const signatureKey = String(payload.signature_key ?? '').toLowerCase()
  const txStatus = String(payload.transaction_status ?? '')
  const fraudStatus = String(payload.fraud_status ?? '')
  const paymentType = typeof payload.payment_type === 'string' ? payload.payment_type : null

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !txStatus) {
    return json({ error: 'Missing required notification fields' }, 400)
  }

  const expectedSig = await sha512Hex(`${orderId}${statusCode}${grossAmount}${serverKey}`)
  if (!timingSafeEqualStr(expectedSig, signatureKey)) {
    return json({ error: 'Invalid signature_key' }, 401)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('id, status, paid_at, payment_method')
    .eq('midtrans_order_id', orderId)
    .maybeSingle()

  if (fetchErr) {
    return json({ error: 'Database lookup failed' }, 500)
  }
  if (!booking || booking.status === 'cancelled') {
    return json({ ok: true, ignored: true })
  }

  const method = normalizeMethod(paymentType) ?? booking.payment_method

  if (txStatus === 'settlement' || (txStatus === 'capture' && (!fraudStatus || fraudStatus === 'accept'))) {
    const { error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_method: method,
        paid_at: booking.paid_at ?? new Date().toISOString(),
      })
      .eq('id', booking.id)
    if (updErr) return json({ error: 'Failed to confirm booking' }, 500)
    return json({ ok: true, status: 'confirmed' })
  }

  if (booking.status === 'pending') {
    if (txStatus === 'pending' && method && method !== booking.payment_method) {
      await supabaseAdmin.from('bookings').update({ payment_method: method }).eq('id', booking.id)
    } else if (txStatus === 'cancel' || txStatus === 'expire') {
      await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    } else if (txStatus === 'deny') {
      await supabaseAdmin.from('bookings').update({ snap_token: null }).eq('id', booking.id)
    }
  }

  return json({ ok: true, status: booking.status })
})
