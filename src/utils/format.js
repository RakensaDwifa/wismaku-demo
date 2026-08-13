export const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

export const fmtDate = (iso, lang = 'id') => {
  if (!iso) return '-'
  const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00')
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseYMD = (ymd) => {
  const [y, m, d] = (ymd || '').split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
