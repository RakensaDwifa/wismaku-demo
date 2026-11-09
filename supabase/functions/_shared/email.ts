import nodemailer from 'npm:nodemailer@6'

export interface BookingEmailData {
  id: string
  guest_name: string
  email: string
  hotel_name: string
  check_in?: string | null
  check_out?: string | null
  nights: number
  rooms: number
  total_price: number | string
  payment_method?: string | null
}

const escHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function sendBookingConfirmationEmail(booking: BookingEmailData): Promise<boolean> {
  const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('GMAIL_USER') || 'rakensadwifa@gmail.com'
  const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD')

  if (!smtpPass) {
    console.warn('[EMAIL] SMTP_PASS / GMAIL_APP_PASSWORD not set. Skipping email dispatch.')
    return false
  }

  const host = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
  const port = Number(Deno.env.get('SMTP_PORT')) || 465
  const from = Deno.env.get('SMTP_FROM') || `"WismaKu" <${smtpUser}>`

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const fmtPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(booking.total_price) || 0)

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Konfirmasi Pemesanan - WismaKu</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(95deg, #10b981 0%, #0d9488 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">WISMAKU</h1>
      <p style="margin: 6px 0 0; font-size: 15px; opacity: 0.95;">Konfirmasi Pemesanan Penginapan</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
        Halo <strong>${escHtml(booking.guest_name)}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Terima kasih atas pemesanan Anda di WismaKu. Pembayaran Anda telah kami terima dan pesanan Anda telah <strong>dikonfirmasi</strong>.
      </p>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Kode Booking</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f766e; font-size: 14px;">${escHtml(booking.id)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Penginapan</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b;">${escHtml(booking.hotel_name)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Jadwal Menginap</td>
            <td style="padding: 6px 0; text-align: right; color: #1e293b;">${escHtml(booking.check_in ?? '-')} s.d. ${escHtml(booking.check_out ?? '-')} (${Number(booking.nights) || 1} malam)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Jumlah Kamar</td>
            <td style="padding: 6px 0; text-align: right; color: #1e293b;">${Number(booking.rooms) || 1} kamar</td>
          </tr>
          <tr style="border-top: 1px dashed #cbd5e1;">
            <td style="padding: 10px 0 4px; font-weight: 700; color: #1e293b;">Total Bayar</td>
            <td style="padding: 10px 0 4px; text-align: right; font-weight: 800; font-size: 16px; color: #10b981;">${fmtPrice}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px;">
        Silakan tunjukkan voucher ini atau sebutkan Kode Booking Anda kepada staf resepsionis saat proses check-in di penginapan.
      </p>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} WismaKu &middot; Semua Hak Cipta Dilindungi
    </div>
  </div>
</body>
</html>
    `

    await transporter.sendMail({
      from,
      to: booking.email,
      subject: `Konfirmasi Pemesanan [${booking.id}] - ${booking.hotel_name}`,
      text: `Halo ${booking.guest_name},\n\nPembayaran untuk pesanan ${booking.id} (${booking.hotel_name}) telah berhasil dikonfirmasi.\nTotal: ${fmtPrice}\n\nTerima kasih telah memesan melalui WismaKu!`,
      html,
    })

    return true
  } catch (err) {
    console.error('[EMAIL] Gagal mengirim email konfirmasi:', err)
    return false
  }
}

export interface PayoutEmailData {
  id: string
  partner_email: string
  amount: number | string
  period_start: string
  period_end: string
  transfer_ref: string
  paid_at?: string | null
}

export async function sendPayoutPaidEmail(payout: PayoutEmailData): Promise<boolean> {
  const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('GMAIL_USER') || 'rakensadwifa@gmail.com'
  const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD')

  if (!smtpPass) {
    console.warn('[EMAIL] SMTP_PASS / GMAIL_APP_PASSWORD not set. Skipping payout email dispatch.')
    return false
  }

  const host = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
  const port = Number(Deno.env.get('SMTP_PORT')) || 465
  const from = Deno.env.get('SMTP_FROM') || `"WismaKu Keuangan" <${smtpUser}>`

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const fmtAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(payout.amount) || 0)

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Bukti Pembayaran Payout - WismaKu</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(95deg, #0f766e 0%, #115e59 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">WISMAKU HQ</h1>
      <p style="margin: 6px 0 0; font-size: 15px; opacity: 0.95;">Bukti Transfer Pencairan Bagi Hasil Mitra</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
        Yth. Rekan Mitra <strong>${escHtml(payout.partner_email)}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Pencairan bagi hasil Anda untuk periode <strong>${escHtml(payout.period_start)} s.d. ${escHtml(payout.period_end)}</strong> telah berhasil kami transfer.
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">ID Payout</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f766e;">${escHtml(payout.id)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">No. Referensi Bank</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b; font-family: monospace;">${escHtml(payout.transfer_ref)}</td>
          </tr>
          <tr style="border-top: 1px dashed #cbd5e1;">
            <td style="padding: 10px 0 4px; font-weight: 700; color: #1e293b;">Dana Bersih Ditransfer</td>
            <td style="padding: 10px 0 4px; text-align: right; font-weight: 800; font-size: 16px; color: #16a34a;">${fmtAmount}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px;">
        Silakan periksa mutasi rekening bank Anda. Anda juga dapat mengunduh kwitansi digital resmi melalui menu Keuangan di portal Extranet Mitra.
      </p>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} WismaKu HQ Finance &middot; Semua Hak Cipta Dilindungi
    </div>
  </div>
</body>
</html>
    `

    await transporter.sendMail({
      from,
      to: payout.partner_email,
      subject: `[Bukti Transfer Payout] ${fmtAmount} - WismaKu HQ (${payout.transfer_ref})`,
      text: `Halo Rekan Mitra,\n\nPayout bagi hasil ${payout.id} sebesar ${fmtAmount} telah berhasil ditransfer.\nNo. Referensi: ${payout.transfer_ref}\n\nTerima kasih atas kerja sama Anda dengan WismaKu!`,
      html,
    })

    return true
  } catch (err) {
    console.error('[EMAIL] Gagal mengirim email bukti payout:', err)
    return false
  }
}
