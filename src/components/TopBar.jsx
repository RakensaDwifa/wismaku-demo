export default function TopBar() {
  return (
    <div className="border-b border-gray-100 bg-white text-xs text-rd-muted">
      <div className="mx-auto flex h-9 w-full max-w-[1200px] items-center justify-between px-5 max-sm:justify-end">
        <div className="flex items-center max-sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <svg className="text-rd" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M6.6 10.8c1.5 2.9 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
            Layanan Pelanggan: 021-8063-5835
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="cursor-not-allowed rounded-md px-2 py-1 text-rd-muted opacity-55 transition-colors hover:text-rd"
            type="button"
            disabled
          >
            Bantuan
          </button>
          <span className="mx-1 h-3.5 w-px bg-rd-border" />
          <button
            className="cursor-not-allowed rounded-md px-2 py-1 text-rd-muted opacity-55 transition-colors hover:text-rd"
            type="button"
            disabled
          >
            IDR &bull; ID
          </button>
          <span className="mx-1 h-3.5 w-px bg-rd-border" />
          <button
            className="cursor-not-allowed rounded-md px-2 py-1 text-rd-muted opacity-55 transition-colors hover:text-rd"
            type="button"
            disabled
          >
            Masuk
          </button>
          <button
            className="cursor-not-allowed rounded-md px-2 py-1 font-extrabold text-rd-text opacity-55 transition-colors hover:text-rd"
            type="button"
            disabled
          >
            Daftar
          </button>
        </div>
      </div>
    </div>
  )
}
