export default function ErrorBanner({ onRetry, message = 'Gagal memuat data.' }) {
  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-outline btn-sm" type="button" onClick={onRetry}>
          Coba Lagi
        </button>
      )}
    </div>
  )
}
