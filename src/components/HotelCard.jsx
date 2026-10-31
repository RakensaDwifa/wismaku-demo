import { fmtRupiah } from '../utils/format.js'
import { srcSet } from '../utils/image.js'
import FavButton from './FavButton.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function HotelCard({ hotel, nights = 0, onOpen }) {
  const { t } = useLanguage()
  const total = nights > 0 ? hotel.price * nights : 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#eee] bg-white shadow-rd transition-all hover:-translate-y-1 hover:shadow-rd-lg">
      <FavButton hotelId={hotel.id} className="absolute top-3 right-3 z-[2]" />
      <a
        href="#hotels"
        className="block"
        title={t('hotelCard.viewDetail')}
        onClick={(e) => {
          e.preventDefault()
          onOpen?.(hotel)
        }}
      >
        <div className="relative overflow-hidden">
          <img
            src={hotel.img}
            srcSet={srcSet(hotel.img, [400, 800, 1200])}
            sizes="(max-width: 600px) 100vw, 320px"
            alt={hotel.name}
            loading="lazy"
            className="h-44 w-full object-cover transition-transform duration-[0.35s] group-hover:scale-[1.06]"
          />
          {hotel.discount > 0 && (
            <span className="absolute top-3 left-3 rounded-md bg-rd px-2.5 py-[5px] text-xs font-extrabold text-white">
              {t('hotelCard.save', { discount: hotel.discount })}
            </span>
          )}
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-white/[0.96] px-2.5 py-[5px] text-xs font-extrabold text-rd-text">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="currentColor"
              aria-hidden="true"
              className="text-[#f59e0b]"
            >
              <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
            </svg>
            {hotel.rating} ({hotel.reviews})
          </span>
        </div>
        <div className="px-4 pt-3.5 pb-4">
          <h3 className="min-h-[41px] overflow-hidden text-[15px] font-extrabold leading-[1.35] line-clamp-2">
            {hotel.name}
          </h3>
          <p className="mt-[5px] mb-3 text-[12.5px] text-rd-muted">
            {hotel.area}, {hotel.city}
          </p>
          <div>
            <span className="block text-xs text-rd-muted">{t('hotelCard.from')}</span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <strong className="text-[19px] font-extrabold text-rd">{fmtRupiah(hotel.price)}</strong>
              <span className="text-[13px] text-rd-muted line-through">{fmtRupiah(hotel.originalPrice)}</span>
            </div>
            <span className="text-xs text-rd-muted">{t('hotelCard.perNight')}</span>
            {total > 0 && (
              <span className="mt-1.5 block text-[12.5px] font-extrabold text-rd-teal">
                {t('hotelCard.total', { total: fmtRupiah(total), nights })}
              </span>
            )}
          </div>
        </div>
      </a>
    </article>
  )
}
