export const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

export const fmtDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso + 'T00:00:00'))
    : '-'

export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseYMD = (ymd) => {
  const [y, m, d] = (ymd || '').split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
