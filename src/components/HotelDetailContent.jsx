import { useEffect, useState } from 'react'
import { addReview, getReviews } from '../services/review.js'
import { fmtDate } from '../utils/format.js'
import { srcSet } from '../utils/image.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

const REVIEW_PAGE_SIZE = 6

export default function HotelDetailContent({ hotel }) {
  const { t, lang } = useLanguage()
  const [imgIdx, setImgIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [userReviews, setUserReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ name: '', city: '', text: '' })
  const [reviewRating, setReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewError, setReviewError] = useState('')
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewPage, setReviewPage] = useState(0)

  const allReviews = [...userReviews, ...(hotel.reviewList ?? [])]
  const reviewTotalPages = Math.max(1, Math.ceil(allReviews.length / REVIEW_PAGE_SIZE))

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getReviews(hotel.id)
        if (live) setUserReviews(list)
      } catch {
        if (live) setUserReviews([])
      }
    }
    sync()
    window.addEventListener('wismaku:reviews-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:reviews-changed', sync)
    }
  }, [hotel.id])

  const submitReview = async (e) => {
    e.preventDefault()
    const name = reviewForm.name.trim()
    const city = reviewForm.city.trim()
    const text = reviewForm.text.trim()
    if (name.length < 3) return setReviewError(t('review.nameTooShort'))
    if (city && city.length < 2) return setReviewError(t('review.cityTooShort'))
    if (!reviewRating) return setReviewError(t('review.ratingRequired'))
    if (text.length < 5) return setReviewError(t('review.textTooShort'))
    try {
      const rev = await addReview({
        hotelId: hotel.id,
        name,
        city: city || undefined,
        rating: reviewRating,
        text,
      })
      setUserReviews((list) => [rev, ...list])
      setReviewForm({ name: '', city: '', text: '' })
      setReviewRating(0)
      setReviewError('')
    } catch (err) {
      setReviewError(err.message || t('review.sendFailed'))
    }
  }

  const setReviewField = (key) => (e) => {
    setReviewForm((f) => ({ ...f, [key]: e.target.value }))
    setReviewError('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section>
        <div className="overflow-hidden rounded-2xl border border-rd-border bg-white">
          <button
            className="block w-full cursor-zoom-in p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
            type="button"
            onClick={() => setLightboxOpen(true)}
            title={t('detail.zoomPhoto')}
            aria-label={t('detail.photoAria', { n: imgIdx + 1 })}
          >
            <img
              className="h-[380px] w-full object-cover max-[768px]:h-[240px]"
              src={hotel.gallery[imgIdx]}
              srcSet={srcSet(hotel.gallery[imgIdx], [600, 1200, 1600])}
              sizes="(max-width: 992px) 100vw, 800px"
              alt={t('detail.photoAlt', { name: hotel.name, n: imgIdx + 1 })}
            />
          </button>
          <div className="flex gap-2 px-[14px] pt-2.5 pb-3">
            {hotel.gallery.map((g, i) => (
              <button
                key={g}
                type="button"
                className={`h-[58px] w-[86px] overflow-hidden rounded-lg border-2 border-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd aria-pressed:border-rd max-[768px]:h-16 max-[768px]:w-24`}
                onClick={() => setImgIdx(i)}
                aria-label={t('detail.thumbAria', { n: i + 1 })}
                aria-pressed={i === imgIdx}
              >
                <img className="h-full w-full object-cover" src={g} alt="" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rd-border bg-white p-5">
        <h2 className="text-[18px] font-extrabold">{t('detail.facilities')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {hotel.amenities.map((a) => (
            <span
              className="rounded-full border border-rd-border bg-rd-soft px-[11px] py-[5px] text-[12px] font-semibold text-rd-teal"
              key={a}
            >
              {t('filter.amenities')[a] ?? a}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[14px] leading-[1.7] text-rd-muted">{hotel.desc}</p>
      </section>

      {hotel.lat != null && hotel.lng != null && (
        <section className="rounded-2xl border border-rd-border bg-white p-5">
          <h2 className="text-[18px] font-extrabold">{t('detail.location')}</h2>
          <div className="mt-3 overflow-hidden rounded-[10px] border border-rd-border">
            <iframe
              title={t('detail.mapTitle', { name: hotel.name })}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${hotel.lng - 0.005}%2C${
                hotel.lat - 0.0035
              }%2C${hotel.lng + 0.005}%2C${hotel.lat + 0.0035}&layer=mapnik&marker=${hotel.lat}%2C${
                hotel.lng
              }`}
              className="h-[260px] w-full border-0"
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-[12px] text-rd-muted">
            {t('detail.mapSource', { area: hotel.area, city: hotel.city })}
          </p>
        </section>
      )}

      {(userReviews.length > 0 || hotel.reviewList?.length > 0) && (
        <section className="rounded-2xl border border-rd-border bg-white p-5">
          <h2 className="text-[18px] font-extrabold">{t('detail.reviews')}</h2>
          <div className="mt-3 mb-[14px] flex items-center gap-3">
            <span className="text-[22px] font-extrabold text-rd">{hotel.rating}</span>
            <span className="text-[13px] text-rd-muted">
              {t('detail.reviewsMeta', {
                total: hotel.reviews,
                recent: hotel.reviewList.length + userReviews.length,
              })}
            </span>
          </div>
          <ul className="mb-5 flex list-none flex-col gap-[14px] p-0">
            {allReviews.map((r, i) => (
              <li className="rounded-[10px] bg-rd-soft px-[14px] py-3 text-[13.5px]" key={r.id || i}>
                <div className="mb-0.5 flex items-center justify-between gap-2.5">
                  <b className="inline-flex items-center gap-2 text-[13.5px]">
                    {r.name}
                    {userReviews.includes(r) && (
                      <span className="rounded-full bg-[rgba(20,184,166,0.15)] px-2 py-[2px] text-[10.5px] font-extrabold tracking-[0.4px] uppercase text-rd-teal">
                        {t('review.yours')}
                      </span>
                    )}
                  </b>
                  <span className="text-[12px] text-[#f5a623] tracking-[1px]">{'★'.repeat(r.rating)}</span>
                </div>
                <span className="text-[11.5px] text-rd-muted">{fmtDate(r.date, lang)}</span>
                <p className="mt-1.5 leading-[1.55]">{r.text}</p>
              </li>
            ))}
          </ul>
          {allReviews.length > 3 && (
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => {
                setReviewPage(0)
                setReviewsOpen(true)
              }}
            >
              {t('review.viewAll', { count: allReviews.length })}
            </button>
          )}
          {userReviews.length === 0 ? (
            <form
              className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-rd-border p-4"
              onSubmit={submitReview}
              noValidate
            >
              <h3 className="text-[14px] font-extrabold">{t('review.writeTitle')}</h3>
              <div
                className="inline-flex gap-0.5"
                role="radiogroup"
                aria-label={t('review.ratingAria')}
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`text-[26px] leading-none text-rd-border transition-[color,transform] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:scale-[1.15]${n <= (hoverRating || reviewRating) ? ' text-[#f5a623]' : ''}`}
                    onClick={() => {
                      setReviewRating(n)
                      setReviewError('')
                    }}
                    onMouseEnter={() => setHoverRating(n)}
                    role="radio"
                    aria-checked={reviewRating === n}
                    aria-label={t('review.starAria', { n })}
                  >
                    ★
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                {t('review.name')}
                <input
                  className="rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                  type="text"
                  value={reviewForm.name}
                  onChange={setReviewField('name')}
                  placeholder={t('review.namePlaceholder')}
                  maxLength={50}
                />
              </label>
              <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                {t('review.city')} <span className="font-medium text-rd-muted">{t('review.optional')}</span>
                <input
                  className="rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                  type="text"
                  value={reviewForm.city}
                  onChange={setReviewField('city')}
                  placeholder={t('review.cityPlaceholder')}
                  maxLength={40}
                />
              </label>
              <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                {t('review.text')}
                <textarea
                  className="resize-y rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                  value={reviewForm.text}
                  onChange={setReviewField('text')}
                  placeholder={t('review.textPlaceholder')}
                  rows={3}
                  maxLength={500}
                />
              </label>
              {reviewError && <p className="text-[12.5px] font-bold text-rd">{reviewError}</p>}
              <button className="btn btn-primary btn-sm self-start" type="submit">
                {t('review.submit')}
              </button>
            </form>
          ) : (
            <p className="mt-4 rounded-[10px] bg-[rgba(20,184,166,0.1)] px-[14px] py-3 text-[13.5px] font-bold text-rd-teal">
              {t('review.thanks')}
            </p>
          )}
        </section>
      )}

      {hotel.policy && (
        <section className="rounded-2xl border border-rd-border bg-white p-5">
          <h2 className="text-[18px] font-extrabold">{t('detail.policy')}</h2>
          <ul className="mt-3 list-none space-y-1 p-0 text-[14px] text-rd-text">
            <li>
              <b>{t('detail.checkIn', { time: hotel.policy.checkIn })}</b>
            </li>
            <li>
              <b>{t('detail.checkOut', { time: hotel.policy.checkOut })}</b>
            </li>
            <li>{hotel.policy.cancelRule}</li>
          </ul>
        </section>
      )}

      {reviewsOpen && (
        <Modal onClose={() => setReviewsOpen(false)} labelledBy="all-reviews-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="all-reviews-title" className="text-[19px] font-extrabold leading-[1.3]">
              {t('review.allTitle', { count: allReviews.length })}
            </h3>
            <div className="mt-1 mb-3 flex items-center gap-2">
              <span className="text-[18px] font-extrabold text-rd">{hotel.rating}</span>
              <span className="text-[12.5px] text-rd-muted">
                {t('review.fromReviews', { total: hotel.reviews })}
              </span>
            </div>
            <ul className="flex list-none flex-col gap-3 p-0">
              {allReviews
                .slice(reviewPage * REVIEW_PAGE_SIZE, (reviewPage + 1) * REVIEW_PAGE_SIZE)
                .map((r, i) => (
                  <li
                    className="rounded-[10px] bg-rd-soft px-[14px] py-3 text-[13.5px]"
                    key={r.id ?? `r-${reviewPage}-${i}`}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2.5">
                      <b className="inline-flex items-center gap-2 text-[13.5px]">
                        {r.name}
                        {userReviews.includes(r) && (
                          <span className="rounded-full bg-[rgba(20,184,166,0.15)] px-2 py-[2px] text-[10.5px] font-extrabold tracking-[0.4px] uppercase text-rd-teal">
                            Ulasan Anda
                          </span>
                        )}
                      </b>
                      <span className="text-[12px] text-[#f5a623] tracking-[1px]">
                        {'★'.repeat(r.rating)}
                      </span>
                    </div>
                    <span className="text-[11.5px] text-rd-muted">{fmtDate(r.date, lang)}</span>
                    <p className="mt-1.5 leading-[1.55]">{r.text}</p>
                  </li>
                ))}
            </ul>
            {reviewTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={reviewPage === 0}
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                >
                  {t('review.prev')}
                </button>
                <span className="text-[13px] font-bold text-rd-muted">
                  {t('review.page', { current: reviewPage + 1, total: reviewTotalPages })}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={reviewPage === reviewTotalPages - 1}
                  onClick={() => setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1))}
                >
                  {t('review.next')}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {lightboxOpen && (
        <Modal onClose={() => setLightboxOpen(false)} labelledBy="lightbox-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="lightbox-title" className="mb-3 text-[19px] font-extrabold leading-[1.3]">
              {t('detail.lightboxTitle', {
                name: hotel.name,
                n: imgIdx + 1,
                total: hotel.gallery.length,
              })}
            </h3>
            <img
              className="w-full rounded-lg"
              src={hotel.gallery[imgIdx]}
              alt={t('detail.photoAlt', { name: hotel.name, n: imgIdx + 1 })}
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setImgIdx((i) => (i - 1 + hotel.gallery.length) % hotel.gallery.length)}
              >
                {t('review.prev')}
              </button>
              <span>
                {imgIdx + 1} / {hotel.gallery.length}
              </span>
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setImgIdx((i) => (i + 1) % hotel.gallery.length)}
              >
                {t('review.next')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
