import { Component } from 'react'

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
      return (
        <div className="grid min-h-screen place-items-center bg-rd-soft text-center" role="alert">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <h1 className="mb-3 text-[28px] font-extrabold text-rd-text">Ups, terjadi kesalahan</h1>
            <p className="mb-6 text-rd-muted">
              Terjadi kesalahan tak terduga saat memuat halaman. Silakan muat ulang.
            </p>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-rd px-[22px] py-2.5 text-sm font-bold text-white transition-all hover:bg-rd-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
              type="button"
              onClick={() => location.reload()}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
