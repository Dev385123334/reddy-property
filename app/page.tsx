import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, BadgeDollarSign, Headset, CalendarCheck, ArrowRight } from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import PropertyCard from "@/components/PropertyCard";
import TrustBar from "@/components/TrustBar";
import DestinationCard from "@/components/DestinationCard";
import TestimonialCard from "@/components/TestimonialCard";
import { getAllProperties } from "@/lib/guesty/listings";
import { getSiteConfig } from "@/lib/guesty/config";
import { buildDestinations } from "@/lib/utils/destinations";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Luxury Stays Across the UK",
  description:
    "Handpicked luxury villas, apartments and retreats across the United Kingdom. Live availability, transparent pricing and effortless booking.",
  path: "/",
});

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Verified properties",
    body: "Every home is managed through our booking platform — live availability and current details, never stale listings.",
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent pricing",
    body: "Final prices come straight from the booking engine, with a clear breakdown before you confirm anything.",
  },
  {
    icon: CalendarCheck,
    title: "Flexible booking requests",
    body: "Pay nothing today. Request your stay and our team confirms availability with you directly.",
  },
  {
    icon: Headset,
    title: "Dedicated support",
    body: "Real people, real answers — before, during and after your stay.",
  },
] as const;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = getSiteConfig();
  const properties = await getAllProperties();
  const featured = properties.slice(0, 6);
  const destinations = buildDestinations(
    properties.map((p) => ({ location: p.location, featuredImage: p.featuredImage })),
    6
  );
  const hero = properties.find((p) => p.featuredImage) ?? properties[0];
  const heroImage = hero?.featuredImage?.url;
  const heroPlace = hero?.location?.city
    ? [hero.location.neighborhood, hero.location.city, hero.location.country]
        .filter(Boolean)
        .join(", ")
    : "United Kingdom";

  return (
    <>
      {/* ---------------------------------------------------------- HERO */}
      <section className="relative flex min-h-[92svh] flex-col justify-end">
        <div className="absolute inset-0 overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage}
              alt="Luxury property in the United Kingdom"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/15 to-ink-950/70" />
        </div>

        <div className="container-rp flex flex-1 flex-col justify-center pb-10 pt-36">
          <p className="eyebrow mb-5 text-gold-300!">
            {properties.length > 0
              ? `Handpicked luxury stays · ${properties.length} ${properties.length === 1 ? "home" : "homes"} across the UK`
              : "Handpicked luxury stays · United Kingdom"}
          </p>
          <h1 className="max-w-4xl font-display text-4xl font-medium leading-[1.06] tracking-[-0.02em] text-ivory-50 sm:text-5xl lg:text-6xl">
            Exceptional homes for unforgettable stays.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-100/85 sm:text-lg">
            Live availability. Transparent pricing. A booking experience that
            feels as considered as the properties themselves.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ivory-50/25 bg-ivory-50/10 px-4 py-1.5 text-xs font-medium tracking-wide text-ivory-100 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
            Trusted stays · Live availability · No payment today
          </div>
        </div>

        <div className="container-rp pb-8">
          <HeroSearch />
          <TrustBar />
          {heroPlace && (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ivory-100/70">
              Featuring · {heroPlace}
            </p>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- VALUE PROPS */}
      <section className="container-rp py-20 sm:py-28" aria-label="Why book with us">
        <p className="eyebrow mb-3">Why Reddy Properties</p>
        <h2 className="display-2 max-w-2xl">
          Stay with confidence, from first search to front door.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="card-rp group p-7 transition-all duration-500 ease-lux hover:-translate-y-0.5 hover:shadow-lift hover:ring-gold-500/20"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/12 text-gold-600 ring-1 ring-gold-500/20">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl font-medium text-ink-900">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- DESTINATIONS */}
      <section className="container-rp py-20 sm:py-28" aria-label="Browse by destination">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Browse by destination</p>
            <h2 className="display-2 max-w-2xl">Where will the UK take you?</h2>
          </div>
          <Link href="/properties" className="btn-outline btn-md">
            View all properties
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {destinations.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                label={destination.label}
                count={destination.count}
                imageUrl={destination.imageUrl}
                href={`/properties?location=${encodeURIComponent(destination.query)}`}
              />
            ))}
          </div>
        ) : (
          <div className="card-rp mt-12 p-10 text-center text-sm text-ink-500">
            Destination tiles will appear as properties load from our booking system.
          </div>
        )}
      </section>

      {/* --------------------------------------------------- FEATURED */}
      <section className="bg-ivory-200/50 py-20 sm:py-28">
        <div className="container-rp">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">Featured homes</p>
              <h2 className="display-2">A handpicked collection</h2>
            </div>
            <Link href="/properties" className="btn-outline btn-md">
              View all properties
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, i) => (
                <PropertyCard key={property.id} property={property} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="card-rp mt-12 p-10 text-center text-sm text-ink-500">
              Our property collection is being refreshed. Please check back shortly.
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------- TESTIMONIALS */}
      <section className="container-rp py-20 sm:py-28" aria-label="Guest testimonials">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Kind words</p>
          <h2 className="display-2">Stays our guests remember</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Nothing says more than a guest&apos;s own words. A glimpse of how
            our homes are experienced.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <TestimonialCard
            quote="The Camden stay was immaculate — every detail felt considered. The booking process was effortless and personal."
            name="J. R."
            location="London"
          />
          <TestimonialCard
            quote="Beautifully curated stay in the Cotswolds. Communication was prompt and thoughtful from start to finish."
            name="A. M."
            location="Oxfordshire"
          />
          <TestimonialCard
            quote="Exactly the kind of stay we love — understated luxury, spot-on location and seamless from enquiry to arrival."
            name="S. P."
            location="Bath"
          />
        </div>
      </section>

      {/* -------------------------------------------------------- CTA */}
      <section className="container-rp py-24 sm:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-16 text-center shadow-lift sm:px-16 sm:py-20">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
            aria-hidden="true"
          />
          <p className="eyebrow mb-4 text-gold-300!">Begin your stay</p>
          <h2 className="font-display text-3xl font-medium text-ivory-50 sm:text-4xl">
            Where will the UK take you next?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ivory-100/70 sm:text-base">
            Browse live availability across our portfolio and request your stay —
            no payment required until it&apos;s confirmed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/properties" className="btn-gold btn-lg">
              Explore properties
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href={`mailto:${site.supportEmail}`} className="btn-outline btn-lg border-ivory-50/30! text-ivory-50! hover:border-gold-300! hover:text-gold-300!">
              Contact us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}