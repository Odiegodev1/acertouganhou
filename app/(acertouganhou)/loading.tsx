export default function Loading() {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-7xl bg-[#080b09] px-4 py-6">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-32 animate-pulse rounded-xl bg-white/10" />
  
          <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
        </div>
  
        {/* TÍTULO */}
        <div className="mb-8 space-y-3">
          <div className="h-7 w-52 animate-pulse rounded-lg bg-white/10" />
  
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-white/5" />
        </div>
  
        {/* CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111612]"
            >
              <div className="aspect-[16/10] animate-pulse bg-white/[0.06]" />
  
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
  
                <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
  
                <div className="mt-4 h-11 animate-pulse rounded-xl bg-[#C8F31D]/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }