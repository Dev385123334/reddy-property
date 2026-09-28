import LoadingCards from "@/components/LoadingCards";

export default function Loading() {
  return (
    <div className="container-rp py-24">
      <div className="animate-pulse">
        <div className="h-3 w-24 rounded-full bg-ink-900/10" />
        <div className="mt-3 h-8 w-1/2 rounded-lg bg-ink-900/10" />
        <div className="mt-3 h-4 w-2/3 rounded-full bg-ink-900/5" />
      </div>
      <div className="mt-12">
        <LoadingCards />
      </div>
    </div>
  );
}