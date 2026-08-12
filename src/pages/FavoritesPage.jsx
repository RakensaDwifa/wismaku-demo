import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import HotelCard from '../components/HotelCard.jsx'
import { HotelCardSkeleton } from '../components/Skeletons.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { useHotels } from '../hooks/useCatalog.js'
import { getFavorites } from '../services/favorite.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import '../styles/app.css'

export default function FavoritesPage() {
  usePageMeta('Hotel Favorit', 'Daftar hotel favorit yang Anda simpan di WismaKu.')
  const navigate = useNavigate()
  const { hotels, loading: hotelsLoading } = useHotels()
  const [favIds, setFavIds] = useState([])
  const [favError, setFavError] = useState(null)

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getFavorites()
        if (live) setFavIds(list)
      } catch (err) {
        if (live) setFavError(err)
      }
    }
    sync()
    window.addEventListener('wismaku:favorites-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:favorites-changed', sync)
    }
  }, [])

  const favorites = hotels.filter((h) => favIds.includes(String(h.id)))

  return (
    <>
      <TopBar />
      <Header />
      <main className="section page-main">
        <div className="container">
          <div className="promo-header">
            <h2 className="section-title">Hotel Favorit</h2>
            <Link className="btn btn-outline btn-sm" to="/">
              &larr; Kembali ke Beranda
            </Link>
          </div>
          {favError ? (
            <ErrorBanner message="Gagal memuat favorit." />
          ) : hotelsLoading ? (
            <div className="hotels-grid" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="hotels-empty">
              <p>Belum ada hotel favorit. Ketuk ikon hati pada kartu hotel untuk menyimpannya.</p>
              <Link className="btn btn-primary" to="/">
                Cari Penginapan
              </Link>
            </div>
          ) : (
            <div className="hotels-grid">
              {favorites.map((h) => (
                <HotelCard key={h.id} hotel={h} onOpen={(hotel) => navigate(`/hotel/${hotel.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
