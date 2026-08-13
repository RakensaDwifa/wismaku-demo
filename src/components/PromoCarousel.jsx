import { useEffect, useState } from 'react'
import { srcSet } from '../utils/image.js'
import ErrorBanner from './ErrorBanner.jsx'
import { Skeleton } from './Skeletons.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function PromoCarousel({ promos, onShowHotels, loading = false, error, onRetry }) {
  const { t } = useLanguage()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || promos.length === 0) return
    const t = setInterval(() => setActive((i) => (i + 1) % promos.length), 3000)
    return () => clearInterval(t)
  }, [promos.length, paused])

  const go = (dir) => {
    if (promos.length === 0) return
    setActive((i) => (i + dir + promos.length) % promos.length)
  }

  if (loading) {
    return (
      <section className="bg-white py-12 max-[768px]:py-8" id="promo">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
            {t('promo.title')}
          </h2>
          {error ? (
            <ErrorBanner onRetry={onRetry} message={t('errors.loadPromos')} />
          ) : (
            <Skeleton className="mt-6 h-[260px] rounded-2xl" />
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-12 max-[768px]:py-8" id="promo">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
            {t('promo.title')}
          </h2>
          <button className="btn btn-outline btn-sm" type="button" onClick={onShowHotels}>
            {t('promo.viewAll')}
          </button>
        </div>
        {error ? (
          <ErrorBanner onRetry={onRetry} message="Gagal memuat promo." />
        ) : (
          <div
            className="relative mt-6 aspect-[21/7] overflow-hidden rounded-2xl bg-[#eee]"
            role="region"
            aria-roledescription="carousel"
            aria-label={t('promo.title')}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {promos.map((p, i) => (
              <div
                className={`absolute inset-0 opacity-0 transition-opacity duration-[0.6s] pointer-events-none after:absolute after:inset-0 after:content-[''] after:bg-[linear-gradient(90deg,rgba(0,0,0,0.55),transparent_65%)] ${
                  i === active ? 'opacity-100 pointer-events-auto' : ''
                }`}
                key={p.id}
                aria-hidden={i !== active}
              >
                <img
                  src={p.img}
                  srcSet={srcSet(p.img, [600, 1200, 1600])}
                  sizes="100vw"
                  alt={t(`data.promos.${p.id}.title`)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-1/2 left-20 z-[2] -translate-y-1/2 text-white max-sm:left-6">
                  <h3 className="text-[30px] font-extrabold max-sm:text-[21px]">
                    {t(`data.promos.${p.id}.title`)}
                  </h3>
                  <p className="mt-2 text-base text-white/90 max-sm:text-[13.5px]">
                    {t(`data.promos.${p.id}.subtitle`)}
                  </p>
                  <button
                    className="mt-[18px] inline-block rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] px-5 py-2.5 text-[13.5px] font-extrabold text-white transition-all hover:-translate-y-0.5 hover:shadow-rd"
                    type="button"
                    onClick={onShowHotels}
                    title={t('promo.bookTitle')}
                  >
                    {t('promo.bookNow')}
                  </button>
                </div>
              </div>
            ))}
            <button
              className="absolute top-1/2 left-[18px] z-[5] grid size-[42px] -translate-y-1/2 place-items-center rounded-full bg-white text-[26px] leading-none text-rd-text shadow-rd-lg transition-all hover:bg-rd hover:text-white max-sm:hidden"
              type="button"
              onClick={() => go(-1)}
              aria-label={t('promo.prev')}
            >
              &#8249;
            </button>
            <button
              className="absolute top-1/2 right-[18px] z-[5] grid size-[42px] -translate-y-1/2 place-items-center rounded-full bg-white text-[26px] leading-none text-rd-text shadow-rd-lg transition-all hover:bg-rd hover:text-white max-sm:hidden"
              type="button"
              onClick={() => go(1)}
              aria-label={t('promo.next')}
            >
              &#8250;
            </button>
            <div className="absolute inset-x-0 bottom-4 z-[5] flex justify-center gap-2">
              {promos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={`relative size-2 rounded-full bg-white/55 transition-all before:absolute before:-inset-2.5 before:content-[''] ${
                    i === active ? 'w-6 bg-white' : ''
                  }`}
                  onClick={() => setActive(i)}
                  aria-label={t('promo.slide', { n: i + 1 })}
                  aria-current={i === active}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
