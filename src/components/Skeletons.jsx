function Skeleton({ className = '', style }) {
  return (
    <div className={`relative overflow-hidden bg-[#e9ecef] ${className}`} style={style} aria-hidden="true">
      <span className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  )
}

export function HotelCardSkeleton() {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-[14px] border border-gray-100 bg-white shadow-rd"
      aria-hidden="true"
    >
      <Skeleton className="h-40 w-full rounded-none" style={{ height: 160 }} />
      <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <Skeleton className="h-[18px] w-3/5 rounded-md" />
      </div>
    </article>
  )
}

export function CityChipsSkeleton() {
  return (
    <div className="grid grid-cols-8 gap-3.5 max-[992px]:grid-cols-4 max-sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="rounded-[14px]" style={{ height: 104, borderRadius: 14 }} />
      ))}
    </div>
  )
}

export function PromoSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-5 h-7 w-2/5 rounded-xl" style={{ height: 28, width: '40%' }} />
      <Skeleton className="h-64 rounded-2xl" style={{ height: 260, borderRadius: 16 }} />
    </div>
  )
}
