import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HotelDetailPage from './pages/HotelDetailPage.jsx'
import BookingsPage from './pages/BookingsPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import BookingSuccessPage from './pages/BookingSuccessPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/hotel/:id" element={<HotelDetailPage />} />
      <Route path="/bookings" element={<BookingsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/pesanan/sukses/:id" element={<BookingSuccessPage />} />
    </Routes>
  )
}
