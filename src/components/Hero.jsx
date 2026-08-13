import { useEffect, useRef, useState } from 'react'
import SearchWidget from './SearchWidget.jsx'
import { srcSet } from '../utils/image.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function Hero({ cities, hotels, onSearch, initial }) {
  const { t } = useLanguage()
  const heroRef = useRef(null)
  const wrapperRef = useRef(null)
  const hideTimer = useRef(null)
  const [bar, setBar] = useState({ fixed: false, top: 68, ph: 0, anim: true, shown: false })

  const heroImg =
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=70'

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      const heroBottom = heroRef.current.getBoundingClientRect().bottom
      const top = document.querySelector('header')?.offsetHeight ?? 68
      setBar((prev) => {
        if (heroBottom <= 0 && prev.fixed) return { ...prev, top, anim: true }
        if (heroBottom <= 0 && !prev.fixed) {
          return { fixed: true, top, ph: wrapperRef.current?.offsetHeight ?? 0, anim: true, shown: false }
        }
        if (heroBottom > 0 && prev.fixed && prev.anim) return { ...prev, anim: false }
        return prev
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (bar.fixed && bar.anim && !bar.shown) {
      const t = setTimeout(() => {
        if (wrapperRef.current) void wrapperRef.current.offsetHeight
        setBar((prev) => ({ ...prev, shown: true }))
      }, 50)
      return () => clearTimeout(t)
    }
  }, [bar.fixed, bar.anim, bar.shown])

  useEffect(() => {
    if (bar.fixed && bar.anim) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      return
    }
    if (!bar.fixed || bar.anim) return
    hideTimer.current = setTimeout(() => setBar((prev) => ({ ...prev, fixed: false, shown: false })), 220)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [bar.fixed, bar.anim])

  useEffect(() => () => hideTimer.current && clearTimeout(hideTimer.current), [])

  return (
    <section ref={heroRef} className="relative bg-black" id="top">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          srcSet={srcSet(heroImg, [800, 1200, 1800])}
          sizes="100vw"
          alt={t('hero.imgAlt')}
          fetchpriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.52),rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.55))]" />
      </div>
      <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-5 pt-24 text-white max-sm:pt-14">
        <h1 className="text-[40px] font-extrabold leading-[1.2] max-sm:text-[27px]">
          {t('hero.title1')} <br />
          <span className="bg-[linear-gradient(95deg,#10b981,#0d9488)] bg-clip-text text-transparent">
            {t('hero.title2')}
          </span>
        </h1>
        <p className="mt-3.5 max-w-[640px] text-base leading-[1.6] text-white/[0.88] max-sm:text-[14.5px]">
          {t('hero.subtitle')}
        </p>
      </div>
      <div
        ref={wrapperRef}
        className={`transition-[opacity,transform] duration-200 ${
          bar.fixed
            ? `fixed inset-x-0 z-[90] bg-white pb-2.5 pt-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)] ${
                bar.anim && bar.shown ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
              }`
            : 'relative z-[5] py-10 max-sm:py-6 max-sm:pb-5'
        }`}
        style={bar.fixed ? { top: bar.top } : undefined}
      >
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <SearchWidget
            key={JSON.stringify(initial)}
            cities={cities}
            hotels={hotels}
            onSearch={onSearch}
            initial={initial}
          />
        </div>
      </div>
      <div aria-hidden="true" style={{ height: bar.fixed ? bar.ph : 0 }} />
    </section>
  )
}
