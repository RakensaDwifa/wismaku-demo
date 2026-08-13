export function centeredScrollTop({ elementTop, elementHeight, scrollY, viewportH, headerH }) {
  const top = elementTop + scrollY - (viewportH - elementHeight) / 2
  return Math.max(top, headerH)
}

export function scrollToCenter(id) {
  const el = document.getElementById(id)
  if (!el) return
  const headerH = document.querySelector('header')?.offsetHeight ?? 76
  const go = () => {
    if (!el.isConnected) return
    const top = centeredScrollTop({
      elementTop: el.getBoundingClientRect().top,
      elementHeight: el.offsetHeight,
      scrollY: window.scrollY,
      viewportH: window.innerHeight,
      headerH,
    })
    window.scrollTo({ top, behavior: 'smooth' })
  }
  go()
  setTimeout(go, 700)
}
