import { Component } from 'react'
import { useLanguage } from '../i18n/useLanguage.js'

function BoundaryContent() {
  const { t } = useLanguage()
  return (
    <div className="grid min-h-screen place-items-center bg-rd-soft text-center" role="alert">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h1 className="mb-3 text-[28px] font-extrabold text-rd-text">{t('errorBoundary.title')}</h1>
        <p className="mb-6 text-rd-muted">{t('errorBoundary.desc')}</p>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-rd px-[22px] py-2.5 text-sm font-bold text-white transition-all hover:bg-rd-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
          type="button"
          onClick={() => location.reload()}
        >
          {t('errors.reload')}
        </button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary menangkap error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <BoundaryContent>{this.props.children}</BoundaryContent>
    }
    return this.props.children
  }
}
