"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Search, MapPin, CalendarDays, Users } from "lucide-react";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import GuestsStepper from "@/components/GuestsStepper";

/**
 * Homepage hero search. Builds shareable search URLs:
 * /properties?location=...&checkIn=...&checkOut=...&guests=...
 */
export default function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [range, setRange] = useState<DateRange>({});
  const [guests, setGuests] = useState(2);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (range.checkIn) params.set("checkIn", range.checkIn);
    if (range.checkOut) params.set("checkOut", range.checkOut);
    if (guests > 0) params.set("guests", String(guests));
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
  };

  return (
    <form
      onSubmit={submit}
      className="lux-hero-search w-full"
      aria-label="Search properties"
    >
      <div className="group grid gap-px rounded-3xl bg-white/70 shadow-lift ring-1 ring-ink-900/10 backdrop-blur-2xl sm:grid-cols-[1.25fr_1.15fr_1fr_auto] lg:grid-cols-[1.4fr_1.25fr_1fr_auto]">
        <label className="relative block rounded-l-3xl bg-ivory-50/95 p-5 transition-colors group-focus-within:bg-white sm:p-6">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            <MapPin className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
            Destination
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where in the UK?"
            className="w-full bg-transparent text-[15px] font-medium text-ink-900 placeholder:text-ink-300 focus:outline-none sm:text-base"
            aria-label="Destination"
          />
          <span className="pointer-events-none absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-ink-900/5 sm:block" />
        </label>

        <div className="relative bg-ivory-50/95 p-5 transition-colors group-focus-within:bg-white sm:p-6">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            <CalendarDays className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
            Stay dates
          </span>
          <DateRangePicker value={range} onChange={setRange} variant="pill" />
          <span className="pointer-events-none absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-ink-900/5 sm:block" />
        </div>

        <div className="relative bg-ivory-50/95 p-5 transition-colors group-focus-within:bg-white sm:p-6">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            <Users className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
            Guests
          </span>
          <GuestsStepper value={guests} onChange={setGuests} max={40} compact />
          <span className="pointer-events-none absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-ink-900/5 sm:block" />
        </div>

        <div className="flex items-stretch rounded-r-3xl bg-ivory-50/95">
          <button
            type="submit"
            className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-r-3xl bg-gold-500 px-8 py-5 text-sm font-semibold tracking-wide text-ivory-50 shadow-soft transition-colors duration-300 hover:bg-gold-600 focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-gold-700 sm:px-10 sm:py-6"
          >
            <span className="absolute inset-0 -translate-y-full bg-gradient-to-b from-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-y-0" />
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}