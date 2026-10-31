import { useState } from 'react'
import { srcSet } from '../utils/image.js'
import Modal from './ui/Modal.jsx'
import ReviewsSection from './ReviewsSection.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function HotelDetailContent({ hotel }) {
  const { t } = useLanguage()
  const [imgIdx, setImgIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const cancelDays = hotel.policy?.cancelRule.match(/(\d+) hari/)?.[1] ?? '1'

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

      <ReviewsSection hotel={hotel} />

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
