import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, BedDouble, Bath, MapPin, Clock } from "lucide-react";
import PropertyGallery from "@/components/PropertyGallery";
import AvailabilityWidget from "@/components/AvailabilityWidget";
import BookingStickyBar from "@/components/BookingStickyBar";
import { getPropertyBySlug } from "@/lib/guesty/listings";
import { createMetadata, siteBase } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) {
    return { title: "Property not found" };
  }
  const place = [property.location.neighborhood, property.location.city, property.location.country]
    .filter(Boolean)
    .join(" · ");
  return createMetadata({
    title: property.title,
    description: `${property.title} in ${place}. Sleeps ${property.guests} guests · ${property.bedrooms} bedroom(s) · ${property.bathrooms} bathroom(s). Live availability and transparent pricing.`,
    path: `/properties/${property.slug}`,
    images: property.featuredImage ? [property.featuredImage.url] : undefined,
  });
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return notFound();
  }

  const metaItems = [
    { icon: Users, label: `${property.guests} guest${property.guests === 1 ? "" : "s"}` },
    { icon: BedDouble, label: `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}` },
    { icon: Bath, label: `${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}` },
  ];

  const place = [property.location.neighborhood, property.location.city, property.location.state]
    .filter(Boolean)
    .join(", ");
  const { name } = siteBase();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: property.title,
    image: property.featuredImage?.url ?? undefined,
    description: `${property.title} — sleeps ${property.guests} guests in ${property.location.city}, United Kingdom.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location.city,
      addressRegion: property.location.state || undefined,
      addressCountry: property.location.country || "GB",
    },
    numberOfRooms: property.bedrooms,
    occupancy: { "@type": "QuantitativeValue", value: property.guests },
    numberOfBathroomsTotal: property.bathrooms,
    checkinTime: property.checkInTime,
    checkoutTime: property.checkOutTime,
    currency: property.currency ?? "GBP",
    ...(property.location.lat && property.location.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: property.location.lat, longitude: property.location.lng } }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-16 sm:pt-20">
        {/* ------------------------------- header / gallery */}
        <section className="container-rp pb-12 pt-8 sm:pt-10">
          <Link
            href="/properties"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-gold-700"
          >
            ← Back to all properties
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">{place || property.location.country || "United Kingdom"}</p>
              <h1 className="display-1 max-w-4xl">{property.title}</h1>
            </div>
            {property.propertyType && (
              <span className="chip-rp">{property.propertyType}</span>
            )}
          </div>

          <div className="mt-8">
            <PropertyGallery images={property.images} />
          </div>
        </section>

        {/* ------------------------------- body / booking */}
        <section className="container-rp grid gap-12 pb-16 lg:grid-cols-[1fr_420px] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <div>
              <h2 className="eyebrow mb-4">Overview</h2>
              <ul className="flex flex-wrap gap-3">
                {metaItems.map(({ icon: Icon, label }) => (
                  <li key={label} className="chip-rp !py-2">
                    <Icon className="h-4 w-4 text-gold-500" aria-hidden="true" />
                    {label}
                  </li>
                ))}
                {property.location.full && (
                  <li className="chip-rp !py-2">
                    <MapPin className="h-4 w-4 text-gold-500" aria-hidden="true" />
                    {property.location.full}
                  </li>
                )}
              </ul>
              <p className="mt-6 max-w-prose text-base leading-relaxed text-ink-600">
                {property.title} is one of our handpicked homes in{" "}
                {property.location.city || "the United Kingdom"}, managed to luxury
                standards. Availability and pricing are live from our booking
                system — the total you see is the total you pay.
              </p>
            </div>

            {property.amenities.length > 0 && (
              <div>
                <h2 className="eyebrow mb-4">Amenities</h2>
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-ink-700"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="eyebrow mb-4">The essentials</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card-rp p-5">
                  <Clock className="h-5 w-5 text-gold-500" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-ink-900">Check-in</p>
                  <p className="text-sm text-ink-500">From {property.checkInTime}</p>
                </div>
                <div className="card-rp p-5">
                  <Clock className="h-5 w-5 text-gold-500" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-ink-900">Check-out</p>
                  <p className="text-sm text-ink-500">By {property.checkOutTime}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                Exact house rules are shared by the {name} team when your booking
                request is confirmed.
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div id="booking-card" className="scroll-mt-28 card-rp p-7">
              <h2 className="font-display text-xl font-medium text-ink-900">
                Book your stay
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Live price from our booking system · no payment today
              </p>
              <div className="mt-6">
                <AvailabilityWidget
                  property={{ id: property.id, title: property.title, guests: property.guests }}
                />
              </div>
            </div>
          </aside>
        </section>
      </div>

      <BookingStickyBar />
    </>
  );
}