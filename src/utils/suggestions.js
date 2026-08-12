const normalize = (s) => (s || '').trim().toLowerCase()

export function buildSuggestions(cities, hotels, query) {
  const q = normalize(query)
  const list = []
  const seen = new Set()

  const push = (item) => {
    if (seen.has(item.key)) return
    seen.add(item.key)
    list.push(item)
  }

  const rank = (text) => {
    const t = normalize(text)
    if (!q) return 0
    if (t === q) return 0
    if (t.startsWith(q)) return 1
    if (t.includes(q)) return 2
    return 3
  }

  cities.forEach((c) => push({ type: 'city', key: `city-${c.name}`, name: c.name, rank: rank(c.name) }))
  hotels.forEach((h) => {
    push({
      type: 'hotel',
      key: `hotel-${h.id}`,
      name: h.name,
      area: h.area,
      city: h.city,
      rank: rank(h.name),
    })
    if (h.area && h.area !== h.city) {
      push({
        type: 'hotel',
        key: `area-${h.area}`,
        name: h.area,
        area: null,
        city: h.city,
        rank: rank(h.area),
      })
    }
  })

  return q ? list.filter((i) => i.rank <= 2).sort((a, b) => a.rank - b.rank) : list.slice(0, 8)
}

export function highlightParts(text, query) {
  const t = normalize(text)
  const q = normalize(query)
  if (!q) return null
  const start = t.indexOf(q)
  if (start < 0) return null
  const end = start + q.length
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ]
}
