import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OfficialInvoiceModal from './OfficialInvoiceModal.jsx'
import { COMPANY_INFO } from '../utils/company.js'
import { LanguageProvider } from '../i18n/index.jsx'

describe('OfficialInvoiceModal', () => {
  const sampleBooking = {
    id: 'b-inv-12345678',
    hotelName: 'Wisma Grand Nusantara',
    roomTypeName: 'Deluxe Suite',
    rooms: 1,
    nights: 2,
    roomPrice: 500000,
    totalPrice: 1100000,
    couponDiscount: 50000,
    memberDiscount: 50000,
    guestName: 'Raden Mas Budi',
    email: 'budi@wismaku.com',
    phone: '08123456789',
    paymentMethod: 'qris',
    checkIn: '2026-11-20',
    checkOut: '2026-11-22',
    paidAt: '2026-11-19T10:00:00.000Z',
    createdAt: '2026-11-19T09:30:00.000Z',
  }

  const renderModal = (props = {}) =>
    render(
      <LanguageProvider>
        <OfficialInvoiceModal booking={sampleBooking} onClose={vi.fn()} {...props} />
      </LanguageProvider>,
    )

  it('merender KOP entitas perusahaan dan NPWP resmi', () => {
    renderModal()
    expect(screen.getByText(COMPANY_INFO.name)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(COMPANY_INFO.npwp))).toBeInTheDocument()
    expect(screen.getByText(/LUNAS \/ PAID/i)).toBeInTheDocument()
  })

  it('menampilkan data tamu dan rincian transaksi akomodasi', () => {
    renderModal()
    expect(screen.getByText('Raden Mas Budi')).toBeInTheDocument()
    expect(screen.getByText('budi@wismaku.com')).toBeInTheDocument()
    expect(screen.getAllByText(/Wisma Grand Nusantara/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Deluxe Suite/).length).toBeGreaterThan(0)
  })

  it('memuat komponen pajak PB1 dan DPP resmi', () => {
    renderModal()
    expect(screen.getByText(/Dasar Pengenaan Pajak \(DPP\):/)).toBeInTheDocument()
    expect(screen.getByText(/Pajak Hotel \/ PB1 \(10%\):/)).toBeInTheDocument()
    expect(screen.getByText(/Total Tagihan \(Lunas\):/)).toBeInTheDocument()
  })

  it('tombol cetak memicu window.print', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderModal()
    const printBtn = screen.getByRole('button', { name: /Cetak \/ Simpan PDF/i })
    fireEvent.click(printBtn)
    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
