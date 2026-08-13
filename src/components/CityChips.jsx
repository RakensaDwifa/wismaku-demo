import { srcSet } from '../utils/image.js'
import { CityChipsSkeleton } from './Skeletons.jsx'
import ErrorBanner from './ErrorBanner.jsx'

export default function CityChips({ cities, onPick, loading = false, error, onRetry }) {
  if (loading) {
    return (
      <section className="py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <h2 className="mb-6 text-[26px] font-extrabold text-black max-[768px]:text-xl">
            Cari Penginapan di Kota Favoritmu
          </h2>
          <CityChipsSkeleton />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <h2 className="mb-6 text-[26px] font-extrabold text-black max-[768px]:text-xl">
            Cari Penginapan di Kota Favoritmu
          </h2>
          <ErrorBanner onRetry={onRetry} message="Gagal memuat kota." />
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 max-[768px]:py-8">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="mb-6 text-[26px] font-extrabold text-black max-[768px]:text-xl">
          Cari Penginapan di Kota Favoritmu
        </h2>
        <div className="grid grid-cols-8 gap-3.5 max-[992px]:grid-cols-4 max-sm:grid-cols-2">
          {cities.map((c) => (
            <button
              className="overflow-hidden rounded-[14px] border border-[#eee] bg-[#fafafa] text-center transition-all hover:-translate-y-[3px] hover:border-[#99f6e4] hover:shadow-rd"
              type="button"
              key={c.name}
              onClick={() => onPick(c.name)}
            >
              <img
                src={c.img}
                srcSet={srcSet(c.img, [200, 400, 800])}
                sizes="(max-width: 768px) 44vw, 160px"
                alt={c.name}
                loading="lazy"
                className="h-[104px] w-full object-cover"
              />
              <span className="block px-1 py-2.5 text-[13px] font-bold text-rd-text">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
