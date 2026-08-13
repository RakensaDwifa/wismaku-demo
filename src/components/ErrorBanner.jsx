import { useLanguage } from '../i18n/useLanguage.js'

export default function ErrorBanner({ onRetry, message }) {
  const { t } = useLanguage()
  return (
    <div
      className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700"
      role="alert"
    >
      <span>{message ?? t('errors.loadData')}</span>
      {onRetry && (
        <button
          className="inline-flex items-center justify-center rounded-lg border border-rd bg-white px-4 py-2 text-[13px] font-bold text-rd transition-all hover:bg-[#f0fdfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
          type="button"
          onClick={onRetry}
        >
          {t('errors.retry')}
        </button>
      )}
    </div>
  )
}
