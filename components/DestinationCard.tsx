import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

interface DestinationCardProps {
  label: string;
  count: number;
  imageUrl?: string;
  href: string;
}

export default function DestinationCard({
  label,
  count,
  imageUrl,
  href,
}: DestinationCardProps) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-soft transition-all duration-500 ease-lux hover:shadow-lift"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-lux group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Explore
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-medium text-ivory-50">{label}</h3>
            <p className="mt-0.5 text-xs text-ivory-100/70">
              {count} handpicked {count === 1 ? "stay" : "stays"}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivory-50/15 text-ivory-50 backdrop-blur-sm transition-all duration-300 ease-lux group-hover:bg-gold-500 group-hover:text-ivory-50">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}