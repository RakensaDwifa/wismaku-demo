import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'WismaKu'
const DEFAULT_ORIGIN = 'https://wismaku-demo.vercel.app'

const ensureMeta = (attr, key) => {
  let meta = document.querySelector(`meta[${attr}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    document.head.appendChild(meta)
  }
  return meta
}

const ensureLink = (rel) => {
  let link = document.querySelector(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    document.head.appendChild(link)
  }
  return link
}

// ponytail: injeksi head di sisi klien; naikkan ke prerender/SSR bila crawler sosial tanpa JS menjadi target.
export function usePageMeta(title, description, options = {}) {
  const { pathname } = useLocation()
  const image = typeof options === 'string' ? options : options?.image

  useEffect(() => {
    const prevTitle = document.title
    const pageTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    document.title = pageTitle

    const origin =
      typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
        ? window.location.origin
        : DEFAULT_ORIGIN
    const canonicalUrl = `${origin}${pathname || '/'}`

    const meta = ensureMeta('name', 'description')
    const prevContent = meta.getAttribute('content')
    meta.setAttribute('content', description || '')

    const canonical = ensureLink('canonical')
    const prevCanonical = canonical.getAttribute('href')
    canonical.setAttribute('href', canonicalUrl)

    const ogUrl = ensureMeta('property', 'og:url')
    const prevOgUrl = ogUrl.getAttribute('content')
    ogUrl.setAttribute('content', canonicalUrl)

    const ogTitle = ensureMeta('property', 'og:title')
    const prevOgTitle = ogTitle.getAttribute('content')
    ogTitle.setAttribute('content', pageTitle)

    const ogDesc = ensureMeta('property', 'og:description')
    const prevOgDesc = ogDesc.getAttribute('content')
    ogDesc.setAttribute('content', description || '')

    const twTitle = ensureMeta('name', 'twitter:title')
    const prevTwTitle = twTitle.getAttribute('content')
    twTitle.setAttribute('content', pageTitle)

    const twDesc = ensureMeta('name', 'twitter:description')
    const prevTwDesc = twDesc.getAttribute('content')
    twDesc.setAttribute('content', description || '')

    let ogImage = null
    let prevOgImage = null
    let twImage = null
    let prevTwImage = null
    if (image) {
      ogImage = ensureMeta('property', 'og:image')
      prevOgImage = ogImage.getAttribute('content')
      ogImage.setAttribute('content', image)

      twImage = ensureMeta('name', 'twitter:image')
      prevTwImage = twImage.getAttribute('content')
      twImage.setAttribute('content', image)
    }

    return () => {
      document.title = prevTitle
      const restore = (el, attr, prev) => {
        if (!el) return
        if (prev != null) el.setAttribute(attr, prev)
        else el.remove()
      }
      restore(meta, 'content', prevContent)
      restore(canonical, 'href', prevCanonical)
      restore(ogUrl, 'content', prevOgUrl)
      restore(ogTitle, 'content', prevOgTitle)
      restore(ogDesc, 'content', prevOgDesc)
      restore(twTitle, 'content', prevTwTitle)
      restore(twDesc, 'content', prevTwDesc)
      restore(ogImage, 'content', prevOgImage)
      restore(twImage, 'content', prevTwImage)
    }
  }, [title, description, pathname, image])
}
