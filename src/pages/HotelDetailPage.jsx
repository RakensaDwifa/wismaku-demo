import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import HotelDetailPanel from '../components/HotelDetailPanel.jsx'
import { useHotels } from '../hooks/useCatalog.js'
import { parseSearchParams } from '../utils/searchParams.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import '../styles/app.css'

export default function HotelDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { hotels, loading } = useHotels()
  const hotel = hotels.find((h) => String(h.id) === String(id))

  usePageMeta(
    hotel ? `${hotel.name} - ${hotel.city}` : 'Detail Penginapan',
    hotel
      ? `Pesan ${hotel.name} di ${hotel.area}, ${hotel.city} mulai ${hotel.price} rupiah per malam.`
      : 'Detail penginapan di WismaKu.',
  )

  if (loading) {
    return (
      <div className="hotel-page">
        <div className="container hotel-page__bar">
          <Link className="btn btn-outline btn-sm" to="/">
            &larr; Kembali
          </Link>
        </div>
        <div className="container">
          <p>Memuat detail penginapan...</p>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="hotel-page">
        <div className="container hotel-page__bar">
          <Link className="btn btn-outline btn-sm" to="/">
            &larr; Kembali
          </Link>
        </div>
        <div className="container hotels-empty">
          <p>Penginapan tidak ditemukan.</p>
          <Link className="btn btn-primary" to="/">
            Lihat Semua Hotel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="hotel-page">
      <div className="container hotel-page__bar">
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
