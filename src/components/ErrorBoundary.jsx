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
        <div className="error-boundary" role="alert">
          <div className="container">
            <h1>Ups, terjadi kesalahan</h1>
            <p>Terjadi kesalahan tak terduga saat memuat halaman. Silakan muat ulang.</p>
            <button className="btn btn-primary" type="button" onClick={() => location.reload()}>
              Muat Ulang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
