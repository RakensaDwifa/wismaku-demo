import { srcSet } from '../utils/image.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function PromoCard({ promo, onBook }) {
  const { t } = useLanguage()

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#eee] shadow-rd transition-all hover:-translate-y-1 hover:shadow-rd-lg">
      <img
        src={promo.img}
        srcSet={srcSet(promo.img, [400, 800, 1200])}
        sizes="(max-width: 640px) 100vw, 380px"
        alt={t(`data.promos.${promo.id}.title`)}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover transition-transform duration-[0.35s] group-hover:scale-[1.06]"
      />
      <div className="relative flex flex-1 flex-col bg-white p-5">
        <h3 className="text-[17px] font-extrabold text-rd-text">{t(`data.promos.${promo.id}.title`)}</h3>
        <p className="mt-1 mb-4 text-[13px] text-rd-muted">{t(`data.promos.${promo.id}.subtitle`)}</p>
        <button
          className="mt-auto self-start rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] px-4 py-2 text-[12.5px] font-extrabold text-white transition-all hover:-translate-y-0.5 hover:shadow-rd"
          type="button"
          onClick={onBook}
          title={t('promo.bookTitle')}
        >
          {t('promo.bookNow')}
        </button>
      </div>
    </article>
  )
}
