import { useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import HotelDetailPanel from '../components/HotelDetailPanel.jsx'
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
      <div className="min-h-screen bg-[#f7f7f7] py-6 pb-16">
        <div className="mx-auto mb-6 w-full max-w-[1200px] px-5">
          <Link className="btn btn-outline btn-sm" to="/">
            &larr; Kembali
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <p>Memuat detail penginapan...</p>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] py-6 pb-16">
        <div className="mx-auto mb-6 w-full max-w-[1200px] px-5">
          <Link className="btn btn-outline btn-sm" to="/">
            &larr; Kembali
          </Link>
        </div>
        <div className="mx-auto mt-6 w-full max-w-[1200px] rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
          <p className="mb-[18px] text-rd-muted">Penginapan tidak ditemukan.</p>
          <Link className="btn btn-primary" to="/hasil">
            Lihat Semua Hotel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-6 pb-16">
      <div className="mx-auto mb-6 w-full max-w-[1200px] px-5">
        <Link className="btn btn-outline btn-sm" to="/">
          &larr; Kembali
        </Link>
      </div>
      <HotelDetailPanel
        hotel={hotel}
        search={parseSearchParams(searchParams)}
        onClose={() => navigate(-1)}
        isPage
      />
    </div>
  )
}
