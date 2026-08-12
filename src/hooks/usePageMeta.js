import { useEffect } from 'react'

const SITE_NAME = 'WismaKu'

export function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    let meta = document.querySelector('meta[name="description"]')
    const prevContent = meta?.getAttribute('content')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description || '')
    return () => {
      document.title = prevTitle
      if (prevContent != null) meta.setAttribute('content', prevContent)
      else meta.remove()
    }
  }, [title, description])
}
