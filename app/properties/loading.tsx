import LoadingCards from "@/components/LoadingCards";

export default function PropertiesLoading() {
  return (
    <div className="pt-16 sm:pt-20">
      <div className="bg-ivory-100">
        <div className="container-rp animate-pulse pb-10 pt-14 sm:pb-14 sm:pt-20">
          <div className="h-3 w-20 rounded-full bg-ink-900/10" />
          <div className="mt-3 h-9 w-1/2 rounded-lg bg-ink-900/10" />
          <div className="mt-4 h-4 w-2/3 rounded-full bg-ink-900/5" />
        </div>
      </div>
      <div className="container-rp py-10">
        <div className="animate-pulse h-10 w-36 rounded-xl bg-ink-900/10" />
        <div className="mt-10">
          <LoadingCards />
        </div>
      </div>
    </div>
  );
}