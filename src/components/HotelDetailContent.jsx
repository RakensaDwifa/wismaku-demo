import { useEffect, useState } from 'react'
import { addReview, deleteReview, getReviews, updateReview } from '../services/review.js'
import { getActiveUser, getMember, openAuthModal } from '../services/member.js'
import { fmtDate } from '../utils/format.js'
import { srcSet } from '../utils/image.js'
import Modal from './ui/Modal.jsx'
import { id as idDict } from '../i18n/id.js'
import { useLanguage } from '../i18n/useLanguage.js'

const REVIEW_PAGE_SIZE = 6
const REVIEW_PREVIEW_SIZE = 3

export default function HotelDetailContent({ hotel }) {
  const { t, lang } = useLanguage()
  const [imgIdx, setImgIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [reviewForm, setReviewForm] = useState({ name: '', city: '', text: '' })
  const [reviewRating, setReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewError, setReviewError] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewPage, setReviewPage] = useState(0)

  const translateSeedText = (r) => {
    if (r.userId != null) return r.text
    const seedIdx = idDict.data.reviewText?.[hotel.id]?.indexOf(r.text) ?? -1
    return seedIdx >= 0 ? t(`data.reviewText.${hotel.id}.${seedIdx}`) : r.text
  }

  const rawReviews = [
    ...reviews.map((r) => ({ ...r, translated: translateSeedText(r) })),
    ...(hotel.reviewList ?? []).map((r, i) => ({
      ...r,
      userId: r.userId ?? null,
      translated: t(`data.reviewText.${hotel.id}.${i}`),
    })),
  ]
  const isOwnReview = (r) => Boolean(activeUser?.id && r.userId === activeUser.id)
  const myReview = rawReviews.find(isOwnReview) ?? null
  const allReviews = myReview ? [myReview, ...rawReviews.filter((r) => r !== myReview)] : rawReviews
  const previewReviews = allReviews.slice(0, REVIEW_PREVIEW_SIZE)
  const reviewTotalPages = Math.max(1, Math.ceil(allReviews.length / REVIEW_PAGE_SIZE))
  const cancelDays = hotel.policy?.cancelRule.match(/(\d+) hari/)?.[1] ?? '1'

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getReviews(hotel.id)
        if (live) setReviews(list)
      } catch {
        if (live) setReviews([])
      }
    }
    sync()
    window.addEventListener('wismaku:reviews-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:reviews-changed', sync)
    }
  }, [hotel.id])

  useEffect(() => {
    let live = true
    const prefill = async () => {
      try {
        const u = await getActiveUser()
        const m = u ? null : await getMember()
        const name = u?.name ?? m?.name
        if (live) {
          setActiveUser(u ?? null)
          if (name) setReviewForm((f) => (f.name ? f : { ...f, name }))
        }
      } catch {
        if (live) setActiveUser(null)
      }
    }
    prefill()
    window.addEventListener('wismaku:session-changed', prefill)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', prefill)
    }
  }, [])

  const submitReview = async (e) => {
    e.preventDefault()
    const currentUser = await getActiveUser()
    if (!currentUser) {
      setReviewError(t('review.loginRequired'))
      openAuthModal('login')
      return
    }
    const name = reviewForm.name.trim()
    const city = reviewForm.city.trim()
    const text = reviewForm.text.trim()
    if (name.length < 3) return setReviewError(t('review.nameTooShort'))
    if (city && city.length < 2) return setReviewError(t('review.cityTooShort'))
    if (!reviewRating) return setReviewError(t('review.ratingRequired'))
    if (text.length < 5) return setReviewError(t('review.textTooShort'))
    setReviewBusy(true)
    try {
      const payload = {
        hotelId: hotel.id,
        name,
        city: city || undefined,
        rating: reviewRating,
        text,
      }
      const rev = editing && myReview ? await updateReview(myReview.id, payload) : await addReview(payload)
      setActiveUser(currentUser)
      setReviews((list) =>
        editing
          ? list.map((x) => (x.id === rev.id ? rev : x))
          : [rev, ...list.filter((x) => x.id !== rev.id)],
      )
      setEditing(false)
      setReviewForm({ name: currentUser.name ?? name, city: '', text: '' })
      setReviewRating(0)
      setReviewError('')
    } catch (err) {
      setReviewError(err.message || t('review.sendFailed'))
    } finally {
      setReviewBusy(false)
    }
  }

  const startEditReview = () => {
    if (!myReview) return
    setReviewForm({ name: myReview.name, city: myReview.city ?? '', text: myReview.text })
    setReviewRating(myReview.rating)
    setReviewError('')
    setEditing(true)
  }

  const cancelEditReview = () => {
    setEditing(false)
    setReviewForm({ name: activeUser?.name ?? '', city: '', text: '' })
    setReviewRating(0)
    setReviewError('')
  }

  const confirmDeleteReview = async () => {
    if (!myReview) return
    setReviewBusy(true)
    try {
      await deleteReview(myReview.id)
      setReviews((list) => list.filter((x) => x.id !== myReview.id))
      setDeleteOpen(false)
      setEditing(false)
      setReviewForm({ name: activeUser?.name ?? '', city: '', text: '' })
      setReviewRating(0)
      setReviewError('')
    } catch (err) {
      setDeleteOpen(false)
      setReviewError(err.message || t('review.deleteFailed'))
    } finally {
      setReviewBusy(false)
    }
  }

  const setReviewField = (key) => (e) => {
    setReviewForm((f) => ({ ...f, [key]: e.target.value }))
    setReviewError('')
  }

  const renderReviewItem = (r, key) => (
    <li className="rounded-[10px] bg-rd-soft px-[14px] py-3 text-[13.5px]" key={key}>
      <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2.5">
        <b className="inline-flex flex-wrap items-center gap-1.5 text-[13.5px]">
          {r.name}
          {isOwnReview(r) && (
            <span className="rounded-full bg-[rgba(20,184,166,0.15)] px-2 py-[2px] text-[10.5px] font-extrabold tracking-[0.4px] uppercase text-rd-teal">
              {t('review.yours')}
            </span>
          )}
          {r.verifiedGuest && (
            <span className="rounded-full bg-[rgba(16,185,129,0.14)] px-2 py-[2px] text-[10.5px] font-extrabold tracking-[0.3px] text-[#047857]">
              ✓ {t('review.verifiedGuest')}
            </span>
          )}
        </b>
        <span className="text-[12px] text-[#f5a623] tracking-[1px]">{'★'.repeat(r.rating)}</span>
      </div>
      <span className="text-[11.5px] text-rd-muted">
        {r.city ? `${r.city} · ${fmtDate(r.date, lang)}` : fmtDate(r.date, lang)}
      </span>
      <p className="mt-1.5 leading-[1.55]">{r.translated ?? r.text}</p>
    </li>
  )

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
        <p className="mt-4 text-[14px] leading-[1.7] text-rd-muted">{t(`data.hotelDesc.${hotel.id}`)}</p>
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

      <section className="rounded-2xl border border-rd-border bg-white p-5">
        <h2 className="text-[18px] font-extrabold">{t('detail.reviews')}</h2>
        {allReviews.length > 0 ? (
          <>
            <div className="mt-3 mb-[14px] flex items-center gap-3">
              <span className="text-[22px] font-extrabold text-rd">{hotel.rating}</span>
              <span className="text-[13px] text-rd-muted">
                {t('detail.reviewsMeta', {
                  total: hotel.reviews,
                  recent: allReviews.length,
                })}
              </span>
            </div>
            <ul className="mb-5 flex list-none flex-col gap-[14px] p-0">
              {previewReviews.map((r, i) => renderReviewItem(r, r.id || i))}
            </ul>
            {allReviews.length > REVIEW_PREVIEW_SIZE && (
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
          </>
        ) : (
          <p className="mt-3 text-[13.5px] text-rd-muted">{t('review.empty')}</p>
        )}
        {!myReview || editing ? (
          <form
            className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-rd-border p-4"
            onSubmit={submitReview}
            noValidate
          >
            <h3 className="text-[14px] font-extrabold">
              {editing ? t('review.editTitle') : t('review.writeTitle')}
            </h3>
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
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-primary btn-sm" type="submit" disabled={reviewBusy}>
                {reviewBusy
                  ? t('booking.processing')
                  : editing
                    ? t('review.saveChanges')
                    : t('review.submit')}
              </button>
              {editing && (
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={reviewBusy}
                  onClick={cancelEditReview}
                >
                  {t('review.cancelEdit')}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[rgba(20,184,166,0.1)] px-[14px] py-3">
            <div>
              <p className="text-[13.5px] font-bold text-rd-teal">{t('review.thanks')}</p>
              {reviewError && <p className="mt-1 text-[12px] font-bold text-rd">{reviewError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                disabled={reviewBusy}
                onClick={startEditReview}
              >
                {t('review.editBtn')}
              </button>
              <button
                className="btn btn-outline btn-sm text-rd hover:border-rd"
                type="button"
                disabled={reviewBusy}
                onClick={() => setDeleteOpen(true)}
              >
                {t('review.deleteBtn')}
              </button>
            </div>
          </div>
        )}
      </section>

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
            <li>{t(`data.cancelRules.${cancelDays}`)}</li>
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
                .map((r, i) => renderReviewItem(r, r.id ?? `r-${reviewPage}-${i}`))}
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

      {deleteOpen && (
        <Modal onClose={() => !reviewBusy && setDeleteOpen(false)} labelledBy="delete-review-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="delete-review-title" className="text-[19px] font-extrabold leading-[1.3]">
              {t('review.deleteTitle')}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-rd-muted">{t('review.deleteDesc')}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                disabled={reviewBusy}
                onClick={() => setDeleteOpen(false)}
              >
                {t('review.cancelEdit')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={reviewBusy}
                onClick={confirmDeleteReview}
              >
                {reviewBusy ? t('booking.processing') : t('review.confirmDelete')}
              </button>
            </div>
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
