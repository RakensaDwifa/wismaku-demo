export const SORT_OPTIONS = [
  { value: 'relevance', labelKey: 'filter.sortPopular' },
  { value: 'price_asc', labelKey: 'filter.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'filter.sortPriceDesc' },
  { value: 'rating_desc', labelKey: 'filter.sortRatingDesc' },
]

export const DEFAULT_FILTERS = { sort: 'relevance', amenities: [], minPrice: 0, maxPrice: 0, minRating: 0 }

export function countActiveFilters(filters) {
  return (
    (filters.sort !== 'relevance' ? 1 : 0) +
    filters.amenities.length +
    (filters.minPrice > 0 ? 1 : 0) +
    (filters.maxPrice > 0 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0)
  )
}

export const ALL_AMENITIES = [
  'WiFi Gratis',
  'AC',
  'Sarapan',
  'Parkir',
  'TV',
  'Kamar Mandi Dalam',
  'Kolam Renang',
  'Dapur',
]

export function parseFilters(params) {
  const sort = SORT_OPTIONS.some((o) => o.value === params.get('sort')) ? params.get('sort') : 'relevance'
  const amenities = (params.get('amenities') || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
  const minPrice = Number(params.get('minPrice')) || 0
  const maxPrice = Number(params.get('maxPrice')) || 0
  const minRating = Number(params.get('minRating')) || 0
  return { sort, amenities, minPrice, maxPrice, minRating }
}

export function applyFilters(hotels, { amenities, minPrice, maxPrice, minRating } = {}) {
  return hotels.filter((h) => {
    if (amenities?.length > 0 && !amenities.every((a) => h.amenities.includes(a))) return false
    if (minPrice > 0 && h.price < minPrice) return false
    if (maxPrice > 0 && h.price > maxPrice) return false
    if (minRating > 0 && h.rating < minRating) return false
    return true
  })
}

export function applySort(hotels, sort) {
  const list = [...hotels]
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return list.sort((a, b) => b.price - a.price)
    case 'rating_desc':
      return list.sort((a, b) => b.rating - a.rating)
    default:
      return list
  }
}

export function priceBounds(hotels) {
  const prices = hotels.map((h) => h.price)
  if (prices.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
