import { useEffect, useRef, useState } from 'react'
import Modal from './ui/Modal.jsx'
import AuthModal from './AuthModal.jsx'
import MemberModal from './MemberModal.jsx'
import { getMember, logoutMember } from '../services/member.js'
import { useLanguage } from '../i18n/useLanguage.js'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"
      />
    </svg>
  )
}

export default function TopBar() {
  const { lang, setLang, t } = useLanguage()
  const [helpOpen, setHelpOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [member, setMember] = useState(null)
  const popRef = useRef(null)

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const m = await getMember()
        if (live) setMember(m)
      } catch {
        if (live) setMember(null)
      }
    }
    sync()
    window.addEventListener('wismaku:members-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:members-changed', sync)
    }
  }, [])

  useEffect(() => {
    if (!langOpen) return
    const close = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setLangOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setLangOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [langOpen])

  return (
    <div className="border-b border-gray-100 bg-white text-xs text-rd-muted">
      <div className="mx-auto flex h-9 w-full max-w-[1200px] items-center justify-between px-5 max-sm:justify-end">
        <div className="flex items-center max-sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <svg className="text-rd" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M6.6 10.8c1.5 2.9 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
            {t('topbar.supportPhone')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-md px-2 py-1 transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
            type="button"
            onClick={() => setHelpOpen(true)}
          >
            {t('topbar.help')}
          </button>
          <span className="mx-1 h-3.5 w-px bg-rd-border" />
          <div className="relative" ref={popRef}>
            <button
              className="rounded-md px-2 py-1 transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
              type="button"
              aria-haspopup="true"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((v) => !v)}
            >
              IDR &bull; {lang === 'id' ? 'ID' : 'EN'}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[120] w-[230px] rounded-lg border border-rd-border bg-white p-2 shadow-rd-lg">
                <p className="px-2 pt-1.5 pb-1 text-[10.5px] font-extrabold tracking-[0.6px] uppercase text-rd-muted">
                  {t('topbar.language')}
                </p>
                <button
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-rd-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd ${
                    lang === 'id' ? 'font-bold text-rd' : 'text-rd-text'
                  }`}
                  type="button"
                  onClick={() => {
                    setLang('id')
                    setLangOpen(false)
                  }}
                >
                  {t('languages.id')}
                  {lang === 'id' && <CheckIcon />}
                </button>
                <button
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-rd-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd ${
                    lang === 'en' ? 'font-bold text-rd' : 'text-rd-text'
                  }`}
                  type="button"
                  onClick={() => {
                    setLang('en')
                    setLangOpen(false)
                  }}
                >
                  {t('languages.en')}
                  {lang === 'en' && <CheckIcon />}
                </button>
                <p className="border-t border-[#f4f4f4] px-2 pt-2 pb-1 text-[10.5px] font-extrabold tracking-[0.6px] uppercase text-rd-muted">
                  {t('topbar.currency')}
                </p>
                <button
                  className="flex w-full cursor-default items-center justify-between rounded-md px-2 py-1.5 text-left font-bold text-rd"
                  type="button"
                  disabled
                >
                  {t('topbar.idr')}
                  <CheckIcon />
                </button>
              </div>
            )}
          </div>
          <span className="mx-1 h-3.5 w-px bg-rd-border" />
          {member ? (
            <>
              <span className="px-2 py-1 font-bold text-rd-text">
                {t('auth.welcome', { name: member.name.split(' ')[0] })}
              </span>
              <button
                className="rounded-md px-2 py-1 font-extrabold text-rd-text transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                type="button"
                onClick={() => logoutMember()}
              >
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <>
              <button
                className="rounded-md px-2 py-1 transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                type="button"
                onClick={() => setAuthOpen(true)}
              >
                {t('topbar.login')}
              </button>
              <button
                className="rounded-md px-2 py-1 font-extrabold text-rd-text transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                type="button"
                onClick={() => setRegisterOpen(true)}
              >
                {t('topbar.register')}
              </button>
            </>
          )}
        </div>
      </div>
      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} labelledBy="help-title">
          <div className="p-6">
            <h2 id="help-title" className="text-xl font-extrabold text-rd-text">
              {t('help.title')}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-rd-muted">{t('help.subtitle')}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-rd-soft px-4 py-3">
                <span className="text-[13px] font-bold text-rd-text">{t('help.phone')}</span>
                <a className="text-[13px] font-extrabold text-rd hover:underline" href="tel:02180635835">
                  {t('help.phoneValue')}
                </a>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rd-soft px-4 py-3">
                <span className="text-[13px] font-bold text-rd-text">{t('help.email')}</span>
                <a
                  className="text-[13px] font-extrabold text-rd hover:underline"
                  href="mailto:dukungan@wismaku.id"
                >
                  {t('help.emailValue')}
                </a>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rd-soft px-4 py-3">
                <span className="text-[13px] font-bold text-rd-text">{t('help.hours')}</span>
                <span className="text-[13px] font-extrabold text-rd-text">{t('help.hoursValue')}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSwitchToRegister={() => {
            setAuthOpen(false)
            setRegisterOpen(true)
          }}
        />
      )}
      {registerOpen && <MemberModal onClose={() => setRegisterOpen(false)} />}
    </div>
  )
}
