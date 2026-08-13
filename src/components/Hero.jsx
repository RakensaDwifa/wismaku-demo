import { useEffect, useRef, useState } from 'react'
import SearchWidget from './SearchWidget.jsx'
import { srcSet } from '../utils/image.js'

export default function Hero({ cities, hotels, onSearch, initial }) {
  const heroRef = useRef(null)
  const [fixed, setFixed] = useState(false)

  const heroImg =
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=70'

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      const heroBottom = heroRef.current.getBoundingClientRect().bottom
      setFixed(heroBottom <= 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={heroRef} className="relative bg-black" id="top">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          srcSet={srcSet(heroImg, [800, 1200, 1800])}
          sizes="100vw"
          alt="Suasana penginapan yang nyaman"
          fetchpriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.52),rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.55))]" />
      </div>
      <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-5 pt-24 text-white max-sm:pt-14">
        <h1 className="text-[40px] font-extrabold leading-[1.2] max-sm:text-[27px]">
          Booking Hotel Murah, <br />
          <span className="bg-[linear-gradient(95deg,#10b981,#0d9488)] bg-clip-text text-transparent">
            Harga Promo Hanya di WismaKu
          </span>
        </h1>
        <p className="mt-3.5 max-w-[640px] text-base leading-[1.6] text-white/[0.88] max-sm:text-[14.5px]">
          Penginapan bersih, nyaman, dan terjangkau di lebih dari 100 kota strategis di Indonesia.
        </p>
      </div>
      <div
        className={`${
          fixed
            ? 'fixed inset-x-0 top-0 z-[90] bg-white pb-2.5 pt-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
            : 'relative z-[5] py-10 max-sm:py-6 max-sm:pb-5'
        }`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <SearchWidget
            key={JSON.stringify(initial)}
            cities={cities}
            hotels={hotels}
            onSearch={onSearch}
            initial={initial}
          />
        </div>
      </div>
    </section>
  )
}
