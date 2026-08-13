import { srcSet } from '../utils/image.js'

export default function BrandCards({ brands }) {
  return (
    <section className="py-12 max-[768px]:py-8" id="brands">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="mb-6 text-[26px] font-extrabold text-black max-[768px]:text-xl">
          Pilihan Brand &amp; Akomodasi Terbaik
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {brands.map((b) => (
            <article className="flex flex-col" key={b.name}>
              <div className="h-[150px] overflow-hidden rounded-t-[14px]">
                <img
                  src={b.img}
                  srcSet={srcSet(b.img, [400, 800])}
                  sizes="(max-width: 768px) 100vw, 300px"
                  alt={b.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col rounded-b-[14px] border border-t-0 border-[#eee] bg-white p-[18px] shadow-rd">
                <h3 className="flex items-center gap-2 text-[17px] font-extrabold">
                  <span className="size-[11px] rounded-full" style={{ background: b.color }} />
                  {b.name}
                </h3>
                <p className="mt-[3px] text-[12.5px] font-bold text-rd-pink">{b.tagline}</p>
                <p className="my-2.5 mb-4 flex-1 text-[13px] leading-[1.6] text-rd-muted">{b.desc}</p>
                <button
                  className="self-start rounded-lg border border-rd bg-white px-[18px] py-2 text-[13px] font-bold text-rd transition-all hover:bg-rd hover:text-white disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-white disabled:hover:text-rd"
                  type="button"
                  disabled
                >
                  Lihat Semua
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
