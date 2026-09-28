/** Shared skeleton grid used by loading.tsx boundaries. */
export default function LoadingCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] w-full rounded-2xl bg-ink-900/10" />
          <div className="mt-4 h-4 w-3/4 rounded-full bg-ink-900/10" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-ink-900/5" />
          <div className="mt-3 h-4 w-1/4 rounded-full bg-gold-500/20" />
        </div>
      ))}
    </div>
  );
}