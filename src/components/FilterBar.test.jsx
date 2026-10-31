import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBar from './FilterBar.jsx'
import { DEFAULT_FILTERS } from '../utils/filtering.js'
import { LanguageProvider } from '../i18n/index.jsx'

const sampleHotels = [
  { id: '1', price: 150000, rating: 4.2, amenities: ['WiFi Gratis'] },
  { id: '2', price: 499000, rating: 4.8, amenities: ['WiFi Gratis', 'AC'] },
]

function ControlledFilterBar({ initial = DEFAULT_FILTERS }) {
  const [filters, setFilters] = useState(initial)
  return (
    <LanguageProvider>
      <FilterBar hotels={sampleHotels} allHotels={sampleHotels} filters={filters} onChange={setFilters} />
    </LanguageProvider>
  )
}

describe('FilterBar input harga', () => {
  it('menampilkan prefix Rp dan placeholder ribuan terformat', () => {
    const { container } = render(<ControlledFilterBar />)

    const minInput = screen.getByLabelText('Min')
    const maxInput = screen.getByLabelText('Maks')

    expect(minInput).toHaveAttribute('placeholder', '150.000')
    expect(maxInput).toHaveAttribute('placeholder', '499.000')
    expect(container.textContent).toContain('Rp')
  })

  it('memformat angka ribuan otomatis saat diketik dan mengabaikan huruf', async () => {
    const user = userEvent.setup()
    render(<ControlledFilterBar />)

    const minInput = screen.getByLabelText('Min')
    const maxInput = screen.getByLabelText('Maks')

    await user.type(minInput, 'abc250000')
    expect(minInput).toHaveValue('250.000')

    await user.type(maxInput, '350000')
    expect(maxInput).toHaveValue('350.000')
  })

  it('menyesuaikan batas silang saat blur bila Min melebihi Maks', async () => {
    const user = userEvent.setup()
    render(<ControlledFilterBar initial={{ ...DEFAULT_FILTERS, minPrice: 300000, maxPrice: 200000 }} />)

    const minInput = screen.getByLabelText('Min')
    const maxInput = screen.getByLabelText('Maks')

    await user.click(minInput)
    await user.tab()

    expect(maxInput).toHaveValue('300.000')
  })
})
