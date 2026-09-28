import type { Metadata } from "next";
import Link from "next/link";
import ConfirmationCard, {
  type ConfirmationSnapshotData,
} from "@/components/ConfirmationCard";
import { getConfirmationSnapshot } from "@/lib/db";
import { getSiteConfig } from "@/lib/guesty/config";

interface PageProps {
  params: Promise<{ reservationId: string }>;
}

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: PageProps) {
  const { reservationId } = await params;
  const site = getSiteConfig();
  const snapshot = await getConfirmationSnapshot(reservationId);

  if (!snapshot) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5 pt-24">
        <div className="card-rp mx-auto max-w-lg p-10 text-center">
          <h1 className="font-display text-2xl font-medium text-ink-900">
            Booking reference not found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            We couldn&apos;t find {reservationId.slice(0, 10)}… in our system. If
            you just made a booking, give it a moment and reload. Otherwise,
            email{" "}
            <a href={`mailto:${site.supportEmail}`} className="font-medium text-gold-700 hover:underline">
              {site.supportEmail}
            </a>{" "}
            and we&apos;ll help you right away.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="btn-outline btn-md">
              Back to home
            </Link>
            <Link href="/properties" className="btn-gold btn-md">
              Browse properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] bg-ivory-200/40 px-5 py-12 sm:py-20">
      <ConfirmationCard snapshot={snapshot as unknown as ConfirmationSnapshotData} />
    </div>
  );
}