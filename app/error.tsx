"use client";

import Link from "next/link";

/**
 * Route-level error boundary. Keeps the design language intact
 * and offers a retry before a full reload.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 pt-24">
      <div className="card-rp mx-auto max-w-lg p-10 text-center">
        <p className="eyebrow mb-3">Something went wrong</p>
        <h1 className="font-display text-2xl font-medium text-ink-900">
          This page hit a snag
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          Our booking system is briefly unavailable. You can try again now or
          head back to browse properties.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-gold btn-md">
            Try again
          </button>
          <Link href="/properties" className="btn-outline btn-md">
            Browse properties
          </Link>
        </div>
      </div>
    </div>
  );
}