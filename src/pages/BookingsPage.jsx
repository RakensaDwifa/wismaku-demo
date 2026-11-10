import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import BookingCard from '../components/BookingCard.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import AuthModal from '../components/AuthModal.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import Modal from '../components/ui/Modal.jsx'
import { getBookings, cancelBooking, deleteBooking } from '../services/booking.js'
import { getRefundRequests, createRefundRequest, REFUND_CHANGE_EVENT } from '../services/refund.js'
import { getActiveUser } from '../services/member.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { fmtRupiah } from '../utils/format.js'

const FILTER_TABS = [
  { id: 'all', labelKey: 'bookings.filterAll' },
  { id: 'pending', labelKey: 'bookings.filterPending' },
  { id: 'confirmed', labelKey: 'bookings.filterConfirmed' },
  { id: 'cancelled', labelKey: 'bookings.filterCancelled' },
]

export default function BookingsPage() {
  const { t } = useLanguage()
  usePageMeta(t('pages.bookingsTitle'), t('pages.bookingsDesc'))
  const [orders, setOrders] = useState(null)
  const [refunds, setRefunds] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  // State Modal Pengajuan Refund
  const [refundModalBooking, setRefundModalBooking] = useState(null)
  const [refundReason, setRefundReason] = useState('Pembatalan Rencana Perjalanan')
  const [bankName, setBankName] = useState('BCA')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState('')

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const u = await getActiveUser()
        if (live) setUser(u)
        if (!u) {
          if (live) {
            setOrders([])
            setRefunds([])
            setError(null)
          }
          return
        }
        const [list, refList] = await Promise.all([
          getBookings({ email: u.email }),
          getRefundRequests({ email: u.email }).catch(() => []),
        ])
        if (live) {
          setOrders(list)
          setRefunds(refList || [])
          setError(null)
        }
      } catch (err) {
        if (live) setError(err)
      }
    }
    sync()
    window.addEventListener('wismaku:session-changed', sync)
    window.addEventListener('wismaku:bookings-changed', sync)
    window.addEventListener(REFUND_CHANGE_EVENT, sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', sync)
      window.removeEventListener('wismaku:bookings-changed', sync)
      window.removeEventListener(REFUND_CHANGE_EVENT, sync)
    }
  }, [])

  const handleOpenRefundModal = (booking) => {
    setRefundModalBooking(booking)
    setRefundReason('Pembatalan Rencana Perjalanan')
    setBankName('BCA')
    setAccountNumber('')
    setAccountHolder(booking.guestName || user?.name || '')
    setRefundError('')
  }

  const handleRefundSubmit = async (e) => {
    e.preventDefault()
    if (!refundModalBooking) return
    setRefundSubmitting(true)
    setRefundError('')
    try {
      await createRefundRequest({
        bookingId: refundModalBooking.id,
        hotelId: refundModalBooking.hotelId,
        guestName: refundModalBooking.guestName,
        email: refundModalBooking.email,
        amount: refundModalBooking.totalPrice,
        reason: refundReason,
        bankName,
        accountNumber,
        accountHolder,
      })
      setRefundModalBooking(null)
    } catch (err) {
      setRefundError(err.message || 'Gagal mengajukan refund.')
    } finally {
      setRefundSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    setActionError('')
    try {
      await cancelBooking(id)
    } catch (err) {
      setActionError(err.message || t('bookings.cancelFailed'))
    }
    load()
  }

  const handleDelete = async (id) => {
    setActionError('')
    try {
      await deleteBooking(id)
      setOrders((prev) => (prev ? prev.filter((o) => o.id !== id) : prev))
    } catch (err) {
      setActionError(err.message || t('bookings.deleteFailed'))
      load()
    }
  }

  const load = async () => {
    try {
      const u = await getActiveUser()
      setUser(u)
      if (!u) {
        setOrders([])
        setError(null)
        return
      }
      setOrders(await getBookings({ email: u.email }))
      setError(null)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('pages.bookingsTitle')}
            </h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/">
              {t('common.backHome')}
            </Link>
          </div>
          {error ? (
            <ErrorBanner message={t('errors.loadBookings')} onRetry={load} />
          ) : !user ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-1 text-[17px] font-extrabold text-rd-text">{t('account.guestTitle')}</p>
              <p className="mb-5 text-[13.5px] text-rd-muted">{t('account.guestDesc')}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setAuthTab('login')
                    setAuthOpen(true)
                  }}
                >
                  {t('account.login')}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    setAuthTab('register')
                    setAuthOpen(true)
                  }}
                >
                  {t('account.register')}
                </button>
              </div>
            </div>
          ) : !orders ? (
            <div
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
              aria-hidden="true"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="rounded-[14px]" style={{ height: 140, borderRadius: 14 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <svg
                className="mx-auto mb-4 text-rd-border"
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
              </svg>
              <p className="mb-[18px] text-rd-muted">{t('pages.bookingsEmpty')}</p>
              <Link className="btn btn-primary" to="/">
                {t('pages.searchStays')}
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              {actionError && (
                <p
                  role="alert"
                  className="mb-3 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-bold text-[#dc2626]"
                >
                  {actionError}
                </p>
              )}
              <div className="mb-4 flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.id === 'all' ? orders.length : orders.filter((o) => o.status === tab.id).length
                  const active = statusFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd ${
                        active
                          ? 'border-rd bg-rd text-white'
                          : 'border-rd-border bg-white text-rd-text hover:border-rd hover:text-rd'
                      }`}
                    >
                      {t(tab.labelKey)} ({count})
                    </button>
                  )
                })}
              </div>
              {statusFilter !== 'all' && orders.every((o) => o.status !== statusFilter) ? (
                <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-12 text-center text-[14px] text-rd-muted">
                  {t('bookings.filterEmpty')}
                </div>
              ) : (
                <ul className="grid list-none gap-[14px] p-0">
                  {(() => {
                    const refundMap = Object.fromEntries((refunds || []).map((r) => [r.bookingId, r]))
                    return (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)).map(
                      (o) => (
                        <BookingCard
                          key={o.id}
                          booking={o}
                          refundRequest={refundMap[o.id]}
                          onRequestRefund={handleOpenRefundModal}
                          onCancel={handleCancel}
                          onDelete={handleDelete}
                        />
                      ),
                    )
                  })()}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {authOpen && <AuthModal initialTab={authTab} onClose={() => setAuthOpen(false)} />}

      {/* Modal Pengajuan Refund & Dispute */}
      {refundModalBooking && (
        <Modal onClose={() => setRefundModalBooking(null)} labelledBy="refund-modal-title">
          <div className="px-6 py-5 space-y-4">
            <div>
              <h3 id="refund-modal-title" className="text-lg font-black text-slate-900">
                Pengajuan Pengembalian Dana (Refund)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pesanan #{refundModalBooking.id} • {refundModalBooking.hotelName}
              </p>
            </div>

            <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-xs text-teal-800 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Nilai Pengembalian:</span>
                <span>{fmtRupiah(refundModalBooking.totalPrice)}</span>
              </div>
              <p className="text-[11px] text-teal-700">
                Pengajuan akan ditinjau oleh tim Refund Desk HQ dalam 1x24 jam kerja.
              </p>
            </div>

            {refundError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
                {refundError}
              </div>
            )}

            <form onSubmit={handleRefundSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Pengajuan Refund</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                >
                  <option value="Pembatalan Rencana Perjalanan">Pembatalan Rencana Perjalanan / Urusan Mendadak</option>
                  <option value="Kesalahan Pemilihan Tanggal / Kamar">Kesalahan Pemilihan Tanggal / Tipe Kamar</option>
                  <option value="Keluhan Fasilitas Tidak Sesuai">Fasilitas Penginapan Tidak Sesuai Deskripsi</option>
                  <option value="Kondisi Darurat / Sakit">Kondisi Darurat Medis / Bencana Alam</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Bank / E-Wallet</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="GoPay/OVO/Dana">E-Wallet (GoPay / OVO / DANA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Rekening / No. HP</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 1234567890"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="sesuai buku tabungan / akun e-wallet"
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundModalBooking(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                  disabled={refundSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="rounded-lg bg-teal-700 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                >
                  {refundSubmitting ? 'Mengirimkan...' : 'Kirim Pengajuan Refund'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}
