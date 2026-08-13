import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import PageLoader from './components/PageLoader.jsx'
import SkipLink from './components/SkipLink.jsx'
import HomePage from './pages/HomePage.jsx'

const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'))
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage.jsx'))
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'))
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  return (
    <>
      <SkipLink />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hasil" element={<SearchResultsPage />} />
          <Route path="/hotel/:id" element={<HotelDetailPage />} />
          <Route path="/pesan/:id" element={<BookingPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/pesanan/sukses/:id" element={<BookingSuccessPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
