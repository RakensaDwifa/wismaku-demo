import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HotelDetailPage from './pages/HotelDetailPage.jsx'
import BookingsPage from './pages/BookingsPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import BookingSuccessPage from './pages/BookingSuccessPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import SearchResultsPage from './pages/SearchResultsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
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
  )
}
