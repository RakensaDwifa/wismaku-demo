import { useEffect } from 'react'

const SITE_NAME = 'WismaKu'

const ensureMeta = (attr, key) => {
  let meta = document.querySelector(`meta[${attr}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    document.head.appendChild(meta)
  }
  return meta
}

export function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title
    const pageTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    document.title = pageTitle

    let meta = document.querySelector('meta[name="description"]')
    const prevContent = meta?.getAttribute('content')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description || '')

    const ogTitle = ensureMeta('property', 'og:title')
    const prevOgTitle = ogTitle.getAttribute('content')
    ogTitle.setAttribute('content', pageTitle)

    const ogDesc = ensureMeta('property', 'og:description')
    const prevOgDesc = ogDesc.getAttribute('content')
    ogDesc.setAttribute('content', description || '')

    return () => {
      document.title = prevTitle
      if (prevContent != null) meta.setAttribute('content', prevContent)
      else meta.remove()
      if (prevOgTitle != null) ogTitle.setAttribute('content', prevOgTitle)
      else ogTitle.remove()
      if (prevOgDesc != null) ogDesc.setAttribute('content', prevOgDesc)
      else ogDesc.remove()
    }
  }, [title, description])
}
