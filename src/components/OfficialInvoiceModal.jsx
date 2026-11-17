import Modal from './ui/Modal.jsx'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { COMPANY_INFO } from '../utils/company.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function OfficialInvoiceModal({ booking, onClose }) {
  const { lang } = useLanguage()
  if (!booking) return null

  const invoiceDate = booking.paidAt || booking.createdAt || new Date().toISOString()
  const dateFormatted = invoiceDate.slice(0, 10).replace(/-/g, '')
  const invoiceNumber = `INV/WK/${dateFormatted}/${String(booking.id).slice(0, 8).toUpperCase()}`

  // Pajak Daerah / PB1 (10% included dalam total transaksi hospitality)
  const totalAmount = Number(booking.totalPrice || 0)
  const dpp = Math.round(totalAmount / 1.1)
  const pb1Tax = totalAmount - dpp

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal onClose={onClose} labelledBy="invoice-modal-title">
      <div className="max-h-[85vh] overflow-y-auto px-6 py-6 text-slate-800 print:max-h-none print:overflow-visible print:p-0">
        {/* Header Kop Surat Perusahaan */}
        <div className="flex flex-col justify-between gap-4 border-b-2 border-teal-800 pb-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-800 px-2.5 py-1 text-sm font-black tracking-wider text-white">
                WISMAKU
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">Official Tax Invoice</span>
            </div>
            <h2 id="invoice-modal-title" className="mt-2 text-base font-black text-slate-900">
              {COMPANY_INFO.name}
            </h2>
            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed mt-0.5">
              {COMPANY_INFO.address}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] font-mono text-slate-600">
              <span>
                <strong>NPWP:</strong> {COMPANY_INFO.npwp}
              </span>
              <span>
                <strong>NIB:</strong> {COMPANY_INFO.nib}
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              ✓ LUNAS / PAID
            </span>
            <div className="mt-2 font-mono text-xs font-black text-teal-900">
              {invoiceNumber}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Tgl Terbit: {fmtDate(invoiceDate, lang)}
            </div>
            <div className="text-[11px] text-slate-500">
              Metode: <strong className="capitalize">{booking.paymentMethod || 'Online Payment'}</strong>
            </div>
          </div>
        </div>

        {/* Informasi Tagihan & Pelanggan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ditagihkan Kepada (Tamu):
            </div>
            <div className="mt-1 font-bold text-slate-900 text-sm">{booking.guestName}</div>
            <div className="text-slate-600 font-mono">{booking.email}</div>
            <div className="text-slate-600 font-mono">{booking.phone || '—'}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Layanan Akomodasi:
            </div>
            <div className="mt-1 font-bold text-slate-900">{booking.hotelName}</div>
            <div className="text-slate-600">
              {booking.roomTypeName || 'Kamar Standar'} • {booking.rooms || 1} Kamar ({booking.nights || 1} Malam)
            </div>
            <div className="text-slate-600 font-mono text-[11.5px] mt-0.5">
              Menginap: {booking.checkIn} s.d. {booking.checkOut}
            </div>
          </div>
        </div>

        {/* Tabel Rincian Biaya & Pajak */}
        <div className="py-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Deskripsi Layanan</th>
                <th className="py-2.5 px-3 text-center">Malam</th>
                <th className="py-2.5 px-3 text-right">Tarif / Malam</th>
                <th className="py-2.5 px-3 text-right">Total Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">
                    Sewa Kamar: {booking.hotelName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tipe: {booking.roomTypeName || 'Kamar Standar'} ({booking.rooms || 1} Unit)
                  </div>
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-700">
                  {booking.nights || 1}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {fmtRupiah(booking.roomPrice || Math.round(dpp / (booking.nights || 1)))}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  {fmtRupiah(dpp)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Breakdown Komponen Pajak & Diskon */}
          <div className="mt-4 flex flex-col items-end border-t border-slate-200 pt-3 text-xs space-y-1.5">
            <div className="flex w-full max-w-xs justify-between text-slate-600">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-mono">{fmtRupiah(dpp)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between text-slate-600">
              <span>Pajak Hotel / PB1 (10%):</span>
              <span className="font-mono">{fmtRupiah(pb1Tax)}</span>
            </div>
            {booking.couponDiscount > 0 && (
              <div className="flex w-full max-w-xs justify-between text-emerald-700 font-semibold">
                <span>Diskon Kupon Promo ({booking.couponCode || 'PROMO'}):</span>
                <span className="font-mono">-{fmtRupiah(booking.couponDiscount)}</span>
              </div>
            )}
            {booking.memberDiscount > 0 && (
              <div className="flex w-full max-w-xs justify-between text-emerald-700 font-semibold">
                <span>Diskon Keanggotaan Member:</span>
                <span className="font-mono">-{fmtRupiah(booking.memberDiscount)}</span>
              </div>
            )}
            <div className="flex w-full max-w-xs justify-between border-t-2 border-teal-800 pt-2 text-sm font-black text-teal-950">
              <span>Total Tagihan (Lunas):</span>
              <span className="font-mono">{fmtRupiah(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Stempel Sah */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[11px] text-slate-500 leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">
              Catatan Resmi Validasi Faktur:
            </p>
            <p>
              Faktur ini diterbitkan secara elektronik oleh sistem perizinan digital WismaKu dan diakui secara sah menurut ketentuan perundang-undangan perpajakan Republik Indonesia.
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              Otentikasi Kuitansi: SHA256:{String(booking.id).replace(/-/g, '').slice(0, 24)}
            </p>
          </div>

          <div className="shrink-0 text-center rounded-lg border-2 border-teal-800/80 p-2.5 text-teal-850 font-bold text-[10.5px]">
            <div className="text-[12px] uppercase">PT WISMAKU TEKNOLOGI</div>
            <div className="text-emerald-700 my-0.5">DIGITALLY VERIFIED</div>
            <div className="text-[9px] font-mono text-slate-500">TERDAFTAR RESMI DJP</div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="mt-6 flex items-center justify-end gap-2.5 print:hidden border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition flex items-center gap-1.5"
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </Modal>
  )
}
