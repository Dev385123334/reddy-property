import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Users, Moon } from "lucide-react";
import PriceBreakdown from "@/components/PriceBreakdown";
import { formatDateRange, nightsBetween } from "@/lib/utils/dates";
import type { Quote } from "@/lib/guesty/types";

interface BookingSidebarProps {
  quote: Pick<
    Quote,
    "listingId" | "checkIn" | "checkOut" | "guests" | "total" | "currency" | "breakdown"
  >;
  property: {
    id: string;
    slug: string;
    title: string;
    location: string;
    imageUrl?: string;
  };
  /** When the quote is live-but-outdated (price change review). */
  stale?: boolean;
}

export default function BookingSidebar({ quote, property, stale = false }: BookingSidebarProps) {
  const nights = nightsBetween(quote.checkIn, quote.checkOut);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-ink-900/10">
      {property.imageUrl && (
        <Link
          href={`/properties/${property.slug}`}
          className="relative block h-44 w-full overflow-hidden"
        >
          <Image
            src={property.imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover transition duration-500 hover:scale-105"
          />
        </Link>
      )}

      <div className="p-6">
        <Link
          href={`/properties/${property.slug}`}
          className="font-display text-lg font-medium leading-snug text-ink-900 transition-colors hover:text-gold-700"
        >
          {property.title}
        </Link>
        {property.location && (
          <p className="mt-1 text-sm text-ink-500">{property.location}</p>
        )}

        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 text-gold-500" aria-hidden="true" />
            {formatDateRange(quote.checkIn, quote.checkOut)}
          </li>
          <li className="flex items-center gap-2.5">
            <Moon className="h-4 w-4 text-gold-500" aria-hidden="true" />
            {nights} night{nights === 1 ? "" : "s"}
          </li>
          <li className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-gold-500" aria-hidden="true" />
            {quote.guests} guest{quote.guests === 1 ? "" : "s"}
          </li>
        </ul>

        <div className="mt-5 border-t border-ink-900/10 pt-5">
          <PriceBreakdown quote={quote as Quote} />
        </div>

        {stale && (
          <p className="mt-4 rounded-xl bg-status-warning/10 px-3.5 py-2.5 text-xs leading-relaxed text-ink-700">
            The price below is the latest from our booking system. Please review
            it before confirming.
          </p>
        )}
      </div>
    </div>
  );
}