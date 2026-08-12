const UNSPLASH = /^https:\/\/images\.unsplash\.com\//

export function withWidth(url, width) {
  try {
    const u = new URL(url)
    u.searchParams.set('w', String(width))
    return u.toString()
  } catch {
    return url
  }
}

export function srcSet(url, widths = [400, 800, 1200, 1600]) {
  if (!url || !UNSPLASH.test(url)) return undefined
  return widths.map((w) => `${withWidth(url, w)} ${w}w`).join(', ')
}
