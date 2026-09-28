import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock, BadgeCheck, CircleDollarSign } from "lucide-react";
import CheckoutForm from "@/components/CheckoutForm";
import BookingSidebar from "@/components/BookingSidebar";
import { BOOKING_COOKIE, loadSession } from "@/lib/booking/session";
import { getPropertyById } from "@/lib/guesty/listings";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Checkout",
  description:
    "Complete your booking request. No payment is taken today — our team confirms each stay personally.",
  path: "/booking/checkout",
  keywords: ["booking", "checkout", "vacation rental"],
});

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(BOOKING_COOKIE)?.value;
  if (!sessionId) redirect("/properties");

  const session = await loadSession(sessionId);
  if (!session) redirect("/properties");

  if (session.status === "confirmed" && session.reservationId) {
    redirect(`/booking/confirmation/${session.reservationId}`);
  }
  if (session.status !== "quoted") redirect("/properties");

  const property = await getPropertyById(session.listingId).catch(() => null);

  const place = property
    ? [property.location.neighborhood, property.location.city, property.location.country]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="pt-16 sm:pt-20">
      <section className="bg-ivory-100">
        <div className="container-rp pb-10 pt-14 sm:pb-14 sm:pt-20">
          <p className="eyebrow mb-3">Almost there</p>
          <h1 className="display-1">Booking details</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
            Confirm your details and we&apos;ll send your request. No payment is
            taken today, and the price you see is guaranteed for 24 hours.
          </p>
        </div>
      </section>

      <section className="container-rp grid gap-12 py-12 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div className="min-w-0">
          <CheckoutForm
            session={{
              id: session.id,
              listingId: session.listingId,
              quoteId: session.quoteId,
              checkIn: session.checkIn,
              checkOut: session.checkOut,
              guests: session.guests,
            }}
            quote={{
              total: session.total,
              currency: session.currency,
              fingerprint: session.fingerprint,
            }}
            propertyTitle={property?.title ?? session.listingId}
          />

          <ul className="mt-10 grid gap-3 text-sm text-ink-600 sm:grid-cols-3">
            <li className="card-rp flex items-start gap-2.5 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
              Your details are private and never shared beyond the booking team.
            </li>
            <li className="card-rp flex items-start gap-2.5 p-4">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
              Availability is re-checked live before your request is sent.
            </li>
            <li className="card-rp flex items-start gap-2.5 p-4">
              <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
              The price shown is the price you pay on confirmation.
            </li>
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <BookingSidebar
            quote={{
              listingId: session.listingId,
              checkIn: session.checkIn,
              checkOut: session.checkOut,
              guests: session.guests,
              total: session.total,
              currency: session.currency,
              breakdown: session.breakdown ?? [],
            }}
            property={{
              id: property?.id ?? session.listingId,
              slug: property?.slug ?? "",
              title: property?.title ?? "Guest property",
              location: place,
              imageUrl: property?.featuredImage?.url,
            }}
          />
        </aside>
      </section>
    </div>
  );
}