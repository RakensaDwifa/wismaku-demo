import { useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import HotelDetailContent from '../components/HotelDetailContent.jsx'
import BookingBox from '../components/BookingBox.jsx'
import FavButton from '../components/FavButton.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { useHotels } from '../hooks/useCatalog.js'
import { parseSearchParams } from '../utils/searchParams.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { addRecentView } from '../services/history.js'

export default function HotelDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { hotels, loading } = useHotels()
  const hotel = hotels.find((h) => String(h.id) === String(id))

  const hotelId = hotel?.id
  useEffect(() => {
    if (hotelId != null) addRecentView(hotelId)
  }, [hotelId])

  usePageMeta(
    hotel ? `${hotel.name} - ${hotel.city}` : 'Detail Penginapan',
    hotel
      ? `Pesan ${hotel.name} di ${hotel.area}, ${hotel.city} mulai ${hotel.price} rupiah per malam.`
      : 'Detail penginapan di WismaKu.',
  )

  if (loading) {
    return (
      <>
        <TopBar />
        <Header />
        <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-6 pb-16">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <Skeleton className="mb-4 h-4 w-56 rounded-md" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="mb-1 h-8 w-2/3 rounded-lg" />
            <Skeleton className="mb-6 h-4 w-1/3 rounded-md" />
            <div className="grid items-start gap-6 min-[993px]:grid-cols-[1fr_360px]">
              <div className="grid gap-6">
                <Skeleton className="h-[380px] w-full rounded-2xl max-[768px]:h-56" />
                <Skeleton className="h-44 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-[420px] w-full rounded-2xl max-[992px]:h-72" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!hotel) {
    return (
      <>
        <TopBar />
        <Header />
        <main id="main" className="min-h-[60vh] py-8">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">Penginapan tidak ditemukan.</p>
              <Link className="btn btn-primary" to="/hasil">
                Lihat Semua Hotel
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const search = parseSearchParams(searchParams)
  const rooms = Number(searchParams.get('rooms')) || 1
  const adults = Number(searchParams.get('adults')) || 2
  const children = Number(searchParams.get('children')) || 0

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-6 pb-16">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <nav
            className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-rd-muted"
            aria-label="Breadcrumb"
          >
            <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/">
              Beranda
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/hasil">
              Penginapan
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <span className="font-bold text-rd-text" aria-current="page">
              {hotel.name}
            </span>
          </nav>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate(-1)}>
              &larr; Kembali
            </button>
            {search.nights > 0 && (
              <span className="rounded-full bg-rd px-3 py-1 text-[12.5px] font-extrabold text-white">
                {search.nights} malam &middot; {search.guests} tamu
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[26px] font-extrabold leading-[1.25] text-black max-[768px]:text-xl">
                {hotel.name}
              </h1>
              <p className="mt-1 text-[13.5px] text-rd-muted">
                {hotel.area}, {hotel.city}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-[5px] rounded-full bg-rd-soft px-2.5 py-1 text-[12.5px] font-extrabold text-rd-teal">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                </svg>
                {hotel.rating} ({hotel.reviews} ulasan)
              </span>
              <FavButton hotelId={hotel.id} />
            </div>
          </div>

          <div className="mt-6 grid items-start gap-6 min-[993px]:grid-cols-[1fr_360px]">
            <HotelDetailContent hotel={hotel} />
            <BookingBox hotel={hotel} search={search} rooms={rooms} adults={adults} children={children} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
