import HotelCard from './HotelCard.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function RecentHotels({ hotels, onOpen }) {
  const { t } = useLanguage()
  if (hotels.length === 0) return null

  return (
    <section className="bg-white py-12 max-[768px]:py-8">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">{t('home.recentTitle')}</h2>
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
          {hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}
