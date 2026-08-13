import { useLanguage } from '../i18n/useLanguage.js'

const items = [
  {
    titleKey: 'assurance.clean',
    descKey: 'assurance.cleanDesc',
    icon: (
      <path d="M12 2a5 5 0 0 1 5 5v6a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zm7 9a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z" />
    ),
  },
  {
    titleKey: 'assurance.price',
    descKey: 'assurance.priceDesc',
    icon: <path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 15.9 6.6 18.5l1.2-6L3.3 8.3l6.1-.7z" />,
  },
  {
    titleKey: 'assurance.easy',
    descKey: 'assurance.easyDesc',
    icon: (
      <path d="M8 12l2 2L16 8m1-6h-3V1H10v1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-1 8H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1z" />
    ),
  },
  {
    titleKey: 'assurance.network',
    descKey: 'assurance.networkDesc',
    icon: (
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 17.9A8 8 0 0 1 4 12c0-.3 0-.6.1-.9L9 16v1a2 2 0 0 0 2 2v.9zm6.4-3.2A2 2 0 0 0 16 15h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V6h2a2 2 0 0 0 2-2v-.4A8 8 0 0 1 17.4 16.7z" />
    ),
  },
]

export default function AssuranceBar() {
  const { t } = useLanguage()
  return (
    <section className="bg-rd-soft py-[42px]">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-4 gap-[26px] px-5 max-[640px]:grid-cols-1">
        {items.map((it) => (
          <div className="flex items-start gap-3.5" key={it.titleKey}>
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="currentColor"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-rd-teal"
            >
              {it.icon}
            </svg>
            <div>
              <h3 className="mb-1 text-[15px] font-extrabold">{t(it.titleKey)}</h3>
              <p className="text-[12.5px] leading-[1.55] text-rd-muted">{t(it.descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
