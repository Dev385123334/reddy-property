import Link from "next/link";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  Phone,
  Mail,
} from "lucide-react";
import CopyReference from "@/components/CopyReference";
import { formatPrice } from "@/lib/utils/format";
import { formatDateRange } from "@/lib/utils/dates";
import { getSiteConfig } from "@/lib/guesty/config";

export interface ConfirmationSnapshotData {
  reservationId: string;
  status?: string;
  listingId: string;
  propertyTitle?: string | null;
  propertySlug?: string | null;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  total?: number;
  currency?: string;
  guest?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  createdAt?: string;
}

export default function ConfirmationCard({
  snapshot,
}: {
  snapshot: ConfirmationSnapshotData;
}) {
  const site = getSiteConfig();
  const guestName = [snapshot.guest?.firstName, snapshot.guest?.lastName]
    .filter(Boolean)
    .join(" ");
  const hasDates = Boolean(snapshot.checkIn && snapshot.checkOut);
  const dateRange = hasDates
    ? formatDateRange(snapshot.checkIn as string, snapshot.checkOut as string)
    : ""

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-ink-900/10">
      <div className="bg-status-success/10 px-6 py-8 text-center sm:px-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-status-success" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-medium text-ink-900">
          Booking request received
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Thank you, <span className="font-medium text-ink-900">{guestName || "guest"}</span>.
          We&apos;ve sent your request for{" "}
          <span className="font-medium text-ink-900">{snapshot.propertyTitle ?? "your stay"}</span>{" "}
          to our booking team.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-ink-900/10">
          <span className="text-ink-500">Reference</span>
          <span className="font-semibold tracking-wide text-ink-900">
            {snapshot.reservationId}
          </span>
          <CopyReference value={snapshot.reservationId} />
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {snapshot.propertySlug && (
          <Link
            href={`/properties/${snapshot.propertySlug}`}
            className="font-display text-lg font-medium text-ink-900 transition-colors hover:text-gold-700"
          >
            {snapshot.propertyTitle}
          </Link>
        )}
        {!snapshot.propertySlug && snapshot.propertyTitle && (
          <p className="font-display text-lg font-medium text-ink-900">{snapshot.propertyTitle}</p>
        )}

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {dateRange && (
            <div className="card-rp p-4">
              <dt className="label-rp">Stay</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-900">
                <CalendarDays className="h-4 w-4 text-gold-500" aria-hidden="true" />
                {dateRange}
              </dd>
            </div>
          )}
          {snapshot.guests ? (
            <div className="card-rp p-4">
              <dt className="label-rp">Guests</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink-900">
                <Users className="h-4 w-4 text-gold-500" aria-hidden="true" />
                {snapshot.guests} guest{snapshot.guests === 1 ? "" : "s"}
              </dd>
            </div>
          ) : null}
          {typeof snapshot.total === "number" && (
            <div className="card-rp p-4">
              <dt className="label-rp">Quoted total</dt>
              <dd className="mt-1 text-sm font-semibold text-ink-900">
                {formatPrice(snapshot.total, snapshot.currency)}
              </dd>
              <dd className="text-xs text-ink-400">Reconfirmed by our team before booking.</dd>
            </div>
          )}
          {guestName && (
            <div className="card-rp p-4">
              <dt className="label-rp">Lead guest</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">{guestName}</dd>
              <dd className="mt-0.5 text-xs text-ink-400">{snapshot.guest?.country}</dd>
            </div>
          )}
        </dl>

        {(snapshot.guest?.email || snapshot.guest?.phone) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-600">
            {snapshot.guest?.email && (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold-500" aria-hidden="true" />
                {snapshot.guest.email}
              </span>
            )}
            {snapshot.guest?.phone && (
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-500" aria-hidden="true" />
                {snapshot.guest.phone}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-ivory-200/60 p-5 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-900/10">
          <p className="font-semibold text-ink-900">What happens next?</p>
          <ul className="mt-2 space-y-1.5">
            <li>1. Our team reviews availability and your request.</li>
            <li>2. We contact you within 24 hours to confirm the stay.</li>
            <li>3. Payment is arranged only after everything is confirmed.</li>
          </ul>
          <p className="mt-3">
            Questions? Email{" "}
            <a href={`mailto:${site.supportEmail}`} className="font-medium text-gold-700 hover:underline">
              {site.supportEmail}
            </a>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/properties" className="btn-outline btn-md">
            Keep browsing
          </Link>
          <Link href="/" className="btn-ghost btn-md">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}