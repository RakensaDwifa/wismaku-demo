import { useLanguage } from '../i18n/useLanguage.js'

export default function SkipLink() {
  const { t } = useLanguage()
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-rd focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
    >
      {t('skipLink')}
    </a>
  )
}
