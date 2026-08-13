export default function Testimonials({ items }) {
  return (
    <section className="py-12 max-[768px]:py-8">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="mb-6 text-[26px] font-extrabold text-black max-[768px]:text-xl">
          Kata Mereka Tentang WismaKu
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-[640px]:grid-cols-1">
          {items.map((t) => (
            <article className="flex flex-col rounded-2xl border border-[#eee] bg-[#fcfcfc] p-5" key={t.name}>
              <div className="mb-3 flex gap-[3px]" aria-label={`Rating ${t.rating} dari 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill={i < t.rating ? '#F59E0B' : '#D8D8D8'}
                    aria-hidden="true"
                  >
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                ))}
              </div>
              <p className="flex-1 text-sm leading-[1.65] text-rd-text">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className="grid size-[42px] place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] font-extrabold text-white"
                  aria-hidden="true"
                >
                  {t.name.charAt(0)}
                </span>
                <div>
                  <b className="block text-sm">{t.name}</b>
                  <span className="text-xs text-rd-muted">{t.city}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
