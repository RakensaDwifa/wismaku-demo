import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

/** Halaman teks statis (syarat, privasi, bantuan). Isi ada di i18n `legal.<doc>`. */
export default function LegalPage({ doc }) {
  const { t } = useLanguage()
  const page = t(`legal.${doc}`)
  usePageMeta(page.title, page.intro)

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-8 pb-16">
        <article className="mx-auto w-full max-w-[820px] px-5">
          <h1 className="text-[28px] font-extrabold text-black max-[768px]:text-2xl">{page.title}</h1>
          <p className="mt-2 text-[14px] leading-[1.6] text-rd-muted">{page.intro}</p>
          <div className="mt-6 flex flex-col gap-4">
            {page.sections.map((s) => (
              <section key={s.h} className="rounded-2xl border border-rd-border bg-white p-5">
                <h2 className="text-[17px] font-extrabold">{s.h}</h2>
                <p className="mt-1.5 text-[14px] leading-[1.7] text-rd-text">{s.p}</p>
              </section>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-rd-muted">
            {t('legal.contactPrefix')}{' '}
            <a className="font-bold text-rd hover:underline" href="mailto:cs-indonesia@wismaku.id">
              cs-indonesia@wismaku.id
            </a>
            .{' '}
            <Link className="font-bold text-rd hover:underline" to="/">
              {t('notFoundPage.goHome')}
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
