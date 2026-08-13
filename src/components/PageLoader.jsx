import { Skeleton } from './Skeletons.jsx'

export default function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10" role="status">
      <Skeleton className="mb-6 h-8 w-2/5 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-[14px]" />
        ))}
      </div>
      <span className="sr-only">Memuat halaman...</span>
    </div>
  )
}
