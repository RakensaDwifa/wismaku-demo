import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HotelDetailContent from './HotelDetailContent.jsx'
import { LanguageProvider } from '../i18n/index.jsx'

const mockGetReviews = vi.fn()
const mockAddReview = vi.fn()
const mockUpdateReview = vi.fn()
const mockDeleteReview = vi.fn()
const mockGetActiveUser = vi.fn()

vi.mock('../services/review.js', () => ({
  getReviews: (...args) => mockGetReviews(...args),
  addReview: (...args) => mockAddReview(...args),
  updateReview: (...args) => mockUpdateReview(...args),
  deleteReview: (...args) => mockDeleteReview(...args),
}))

vi.mock('../services/member.js', () => ({
  getActiveUser: (...args) => mockGetActiveUser(...args),
  getMember: vi.fn().mockResolvedValue(null),
  openAuthModal: vi.fn(),
}))

const sampleHotel = {
  id: '1',
  name: 'Rumah Tandur Syariah Near Kelapa Gading',
  area: 'Kelapa Gading',
  city: 'Jakarta',
  rating: 4.5,
  reviews: 2,
  gallery: ['https://example.com/1.jpg'],
  amenities: ['WiFi Gratis', 'AC'],
  policy: {
    checkIn: '14:00',
    checkOut: '12:00',
    cancelRule: 'Pembatalan gratis hingga 1 hari sebelum check-in',
  },
  reviewList: [],
}

const seedReviews = [
  {
    id: 'seed-1',
    hotelId: '1',
    userId: null,
    name: 'Sari W.',
    city: 'Jakarta',
    rating: 5,
    text: 'Kamar bersih, check-in cepat, dekat mall. Sangat puas!',
    verifiedGuest: false,
    date: '2026-10-26',
  },
  {
    id: 'seed-2',
    hotelId: '1',
    userId: null,
    name: 'Rudi H.',
    city: 'Bekasi',
    rating: 4,
    text: 'Nyaman untuk keluarga, sarapan sederhana tapi cukup.',
    verifiedGuest: false,
    date: '2026-10-26',
  },
]

const renderDetail = () =>
  render(
    <LanguageProvider>
      <HotelDetailContent hotel={sampleHotel} />
    </LanguageProvider>,
  )

describe('HotelDetailContent (fitur ulasan penginapan)', () => {
  beforeEach(() => {
    window.localStorage.setItem('wismaku.lang', 'id')
    mockGetReviews.mockReset().mockResolvedValue(seedReviews)
    mockAddReview.mockReset()
    mockUpdateReview.mockReset()
    mockDeleteReview.mockReset()
    mockGetActiveUser.mockReset().mockResolvedValue({
      id: 'u-1',
      name: 'Budi Santoso',
      email: 'budi@email.com',
    })
  })

  it('menampilkan ulasan seed beserta kota tanpa badge Ulasan Anda dan tetap membuka form Tulis Ulasan', async () => {
    renderDetail()

    expect(await screen.findByText('Sari W.')).toBeInTheDocument()
    expect(screen.getByText(/Jakarta ·/)).toBeInTheDocument()
    expect(screen.getByText(/Bekasi ·/)).toBeInTheDocument()
    expect(screen.queryByText('Ulasan Anda')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tulis Ulasan' })).toBeInTheDocument()
  })

  it('mendukung tambah, ubah, dan hapus ulasan milik sendiri beserta badge Tamu Terverifikasi', async () => {
    const user = userEvent.setup()
    const createdReview = {
      id: 'rev-u1',
      hotelId: '1',
      userId: 'u-1',
      name: 'Budi Santoso',
      city: 'Surabaya',
      rating: 5,
      text: 'Pelayanan sangat ramah dan kamar bersih.',
      verifiedGuest: true,
      date: '2026-10-31',
    }
    mockAddReview.mockResolvedValue(createdReview)
    mockUpdateReview.mockResolvedValue({
      ...createdReview,
      rating: 4,
      text: 'Kamar bersih, lokasi dekat akses tol.',
    })
    mockDeleteReview.mockResolvedValue(undefined)

    renderDetail()
    await waitFor(() => {
      expect(screen.getByLabelText('Nama')).toHaveValue('Budi Santoso')
    })

    await user.click(screen.getByRole('radio', { name: '5 bintang' }))
    await user.type(screen.getByLabelText(/Kota/), 'Surabaya')
    await user.type(screen.getByLabelText('Ulasan'), 'Pelayanan sangat ramah dan kamar bersih.')
    await user.click(screen.getByRole('button', { name: 'Kirim Ulasan' }))

    expect(await screen.findByText('Terima kasih, ulasan Anda telah tersimpan.')).toBeInTheDocument()
    expect(screen.getByText('Ulasan Anda')).toBeInTheDocument()
    expect(screen.getByText(/Tamu Terverifikasi/)).toBeInTheDocument()
    expect(screen.getByText('Dari 3 ulasan')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ubah' }))
    expect(screen.getByRole('heading', { name: 'Ubah Ulasan Anda' })).toBeInTheDocument()
    const textInput = screen.getByLabelText('Ulasan')
    await user.clear(textInput)
    await user.type(textInput, 'Kamar bersih, lokasi dekat akses tol.')
    await user.click(screen.getByRole('radio', { name: '4 bintang' }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    expect(await screen.findByText('Kamar bersih, lokasi dekat akses tol.')).toBeInTheDocument()
    expect(mockUpdateReview).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Hapus' }))
    expect(screen.getByRole('heading', { name: 'Hapus Ulasan?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ya, Hapus' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tulis Ulasan' })).toBeInTheDocument()
    })
    expect(mockDeleteReview).toHaveBeenCalledWith('rev-u1')
    expect(screen.queryByText('Ulasan Anda')).not.toBeInTheDocument()
  })

  it('menerjemahkan teks ulasan seed saat bahasa diatur ke Inggris (EN)', async () => {
    window.localStorage.setItem('wismaku.lang', 'en')
    renderDetail()

    expect(
      await screen.findByText('Clean room, fast check-in, near the mall. Very satisfied!'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Write a Review' })).toBeInTheDocument()
  })
})
