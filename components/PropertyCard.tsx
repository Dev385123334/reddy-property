import Image from "next/image";
import Link from "next/link";
import { Users, BedDouble, Bath } from "lucide-react";
import type { Property } from "@/lib/guesty/types";

export default function PropertyCard({
  property,
  className = "",
  priority = false,
}: {
  property: Property;
  className?: string;
  priority?: boolean;
}) {
  const image = property.featuredImage?.url;
  const href = `/properties/${property.slug}`;
  const place = [property.location.neighborhood, property.location.city]
    .filter(Boolean)
    .join(", ");

  return (
    <article className={`group relative transition-transform duration-500 ease-lux hover:-translate-y-0.5 ${className}`}>
      <Link href={href} className="focus-visible:outline-2 focus-visible:outline-offset-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink-900/5 transition-shadow duration-500 group-hover:shadow-lift">
          {image ? (
            <Image
              src={image}
              alt={property.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-lux group-hover:scale-[1.05]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-ivory-200 to-sand-100" />
          )}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ink-900/5"
            aria-hidden="true"
          />
          {property.propertyType && (
            <span className="absolute left-4 top-4 rounded-full bg-ivory-50/90 px-3 py-1 text-xs font-medium text-ink-800 backdrop-blur">
              {property.propertyType}
            </span>
          )}
          {place && (
            <span className="absolute bottom-4 left-4 rounded-full bg-ink-950/55 px-3 py-1 text-xs font-medium text-ivory-50 backdrop-blur">
              {place}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="eyebrow mb-1 truncate">{place || property.location.country}</p>
          <h3 className="font-display text-xl font-medium text-ink-900 transition-colors group-hover:text-gold-700">
            {property.title}
          </h3>

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <li className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gold-500" aria-hidden="true" />
              {property.guests}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-gold-500" aria-hidden="true" />
              {property.bedrooms}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-gold-500" aria-hidden="true" />
              {property.bathrooms}
            </li>
          </ul>

          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-700">
            View property
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}