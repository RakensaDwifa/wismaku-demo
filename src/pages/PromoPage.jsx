import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import PromoCard from '../components/PromoCard.jsx'
import HotelCard from '../components/HotelCard.jsx'
import { HotelCardSkeleton, Skeleton } from '../components/Skeletons.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { useHotels, usePromos } from '../hooks/useCatalog.js'
import { coupons } from '../data/coupons.js'
import { fmtRupiah } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

const INITIAL_LIMIT = 8
const STEP = 4

export default function PromoPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data: promos, loading: promosLoading, error: promosError, refetch: refetchPromos } = usePromos()
  const { hotels, loading: hotelsLoading, error: hotelsError, refetch: refetchHotels } = useHotels()
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)
  const [copied, setCopied] = useState('')

  const discounted = hotels.filter((h) => h.discount > 0)
  const visible = discounted.slice(0, visibleCount)
  const remaining = discounted.length - visibleCount

  usePageMeta(t('promoPage.title'), t('promoPage.subtitle'))

  const copyCode = async (code) => {
    let ok
    try {
      await navigator.clipboard.writeText(code)
      ok = true
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = code
        el.setAttribute('readonly', '')
        el.style.position = 'absolute'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.select()
        ok = document.execCommand('copy')
        document.body.removeChild(el)
      } catch {
        ok = false
      }
    }
    setCopied(ok ? code : '')
    if (ok) setTimeout(() => setCopied((c) => (c === code ? '' : c)), 2000)
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main">
        <section className="bg-white pt-9 pb-2 max-[768px]:pt-7">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <h1 className="text-[30px] font-extrabold text-black max-[768px]:text-2xl">
              {t('promoPage.title')}
            </h1>
            <p className="mt-1.5 mb-4 text-sm text-rd-muted">{t('promoPage.subtitle')}</p>
          </div>
        </section>
        <section className="bg-white pb-2">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            {promosLoading ? (
              <Skeleton className="h-[220px] rounded-2xl" />
            ) : promosError ? (
              <ErrorBanner onRetry={refetchPromos} message={t('errors.loadPromos')} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">
                {promos.map((p) => (
                  <PromoCard key={p.id} promo={p} onBook={() => navigate('/hasil')} />
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="bg-rd-soft py-12 max-[768px]:py-9">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('promoPage.couponsTitle')}
            </h2>
            <p className="mt-1 mb-6 text-sm text-rd-muted">{t('promoPage.couponsSubtitle')}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-rd-border bg-white p-5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[22px] font-extrabold tracking-[0.12em] text-rd">{c.code}</p>
                    <p className="mt-1 text-[14.5px] font-extrabold text-rd-text">
                      {t(`data.coupons.${c.code}.label`)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-rd-muted">
                      {t(`data.coupons.${c.code}.desc`, { amount: fmtRupiah(c.maxDiscount) })}
                    </p>
                  </div>
                  <button
                    className={`btn btn-sm ${copied === c.code ? 'btn-primary' : 'btn-outline'}`}
                    type="button"
                    onClick={() => copyCode(c.code)}
                    aria-live="polite"
                  >
                    {copied === c.code ? t('promoPage.copied') : t('promoPage.copy')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white py-12 max-[768px]:py-9">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
                  {t('promoPage.discountTitle')}
                </h2>
                <p className="mt-1 text-sm text-rd-muted">{t('promoPage.discountSubtitle')}</p>
              </div>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate('/hasil')}>
                {t('promoPage.viewAllStays')}
              </button>
            </div>
            <div className="mt-6">
              {hotelsLoading ? (
                <div
                  className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
                  aria-hidden="true"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <HotelCardSkeleton key={i} />
                  ))}
                </div>
              ) : hotelsError ? (
                <ErrorBanner onRetry={refetchHotels} message={t('errors.loadStays')} />
              ) : (
                <>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
                    {visible.map((h) => (
                      <HotelCard key={h.id} hotel={h} onOpen={(hotel) => navigate(`/hotel/${hotel.id}`)} />
                    ))}
                  </div>
                  {remaining > 0 && (
                    <div className="mt-7 flex justify-center">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => setVisibleCount((v) => v + STEP)}
                      >
                        {t('home.loadMore', { count: remaining })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
