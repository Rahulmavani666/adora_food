"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="h-7 bg-gray-800 rounded w-1/3 mt-2" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-gray-800 rounded" />
          <div className="h-12 bg-gray-800 rounded" />
          <div className="h-12 bg-gray-800 rounded" />
          <div className="h-12 bg-gray-800 rounded" />
        </div>
        <div className="h-10 bg-gray-800 rounded mt-3" />
      </div>
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-5 bg-gray-800 rounded w-32" />
        <div className="h-5 bg-gray-800 rounded w-20" />
      </div>
      <div className="h-3 bg-gray-800 rounded w-40" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-3/4" />
      </div>
      <div className="h-8 bg-gray-800 rounded w-28 mt-2" />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-800 rounded w-16" />
          <div className="h-5 bg-gray-800 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gray-700" />
            <div className="space-y-1.5">
              <div className="h-2.5 bg-gray-700 rounded w-14" />
              <div className="h-4 bg-gray-700 rounded w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonListingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
