/** Sortir dan filter ulasan di sisi klien. `pinned` (ulasan milik user) selalu paling atas bila lolos filter. */
const time = (r) => (r.date ? new Date(r.date).getTime() || 0 : 0)

const COMPARATORS = {
  newest: (a, b) => time(b) - time(a),
  highest: (a, b) => b.rating - a.rating || time(b) - time(a),
  lowest: (a, b) => a.rating - b.rating || time(b) - time(a),
}

export function sortFilterReviews(list, { sort = 'newest', star = 0, pinned = null } = {}) {
  const filtered = star ? list.filter((r) => Number(r.rating) === star) : list
  const sorted = [...filtered].sort(COMPARATORS[sort] ?? COMPARATORS.newest)
  return pinned && sorted.includes(pinned) ? [pinned, ...sorted.filter((r) => r !== pinned)] : sorted
}
