import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function NotFoundPage() {
  const { t } = useLanguage()
  usePageMeta(t('notFoundPage.title'), t('notFoundPage.desc'))

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
            <svg
              className="mx-auto mb-4 text-rd-border"
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <h2 className="mb-2 text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('notFoundPage.title')}
            </h2>
            <p className="mb-[18px] text-rd-muted">{t('notFoundPage.message')}</p>
            <Link className="btn btn-primary" to="/">
              {t('notFoundPage.goHome')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
