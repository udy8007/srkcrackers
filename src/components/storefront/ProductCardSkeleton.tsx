export function ProductCardSkeleton() {
  return (
    <article
      aria-hidden
      className="product-card relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_28px_rgba(90,0,8,0.06)]"
    >
      <div className="product-card-border pointer-events-none absolute inset-0 rounded-[1.35rem]" />
      <div className="product-card-media relative aspect-square w-full">
        <div className="absolute inset-5 rounded-2xl skeleton-shimmer" />
      </div>
      <div className="relative flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="product-card-divider h-px w-full opacity-50" />
        <div className="h-5 w-4/5 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-3/5 rounded-lg skeleton-shimmer" />
        <div className="h-6 w-2/5 rounded-md skeleton-shimmer" />
        <div className="mt-1 h-[3.25rem] w-full rounded-xl skeleton-shimmer" />
        <div className="flex items-center justify-between gap-2 border-t border-line/80 pt-3">
          <div className="h-3 w-16 rounded-md skeleton-shimmer" />
          <div className="h-9 w-[7.25rem] rounded-full skeleton-shimmer" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
