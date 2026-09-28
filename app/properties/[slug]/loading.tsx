export default function PropertyLoading() {
  return (
    <div className="container-rp animate-pulse pb-16 pt-24">
      <div className="h-4 w-32 rounded-full bg-ink-900/10" />
      <div className="mt-6 h-9 w-1/2 rounded-lg bg-ink-900/10" />
      <div className="mt-8 aspect-[16/9] w-full rounded-2xl bg-ink-900/10" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="h-5 w-1/3 rounded-full bg-ink-900/10" />
          <div className="h-4 w-full rounded-full bg-ink-900/5" />
          <div className="h-4 w-3/4 rounded-full bg-ink-900/5" />
        </div>
        <div className="h-72 rounded-2xl bg-ink-900/5" />
      </div>
    </div>
  );
}