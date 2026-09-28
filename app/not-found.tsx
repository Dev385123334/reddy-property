import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 pt-24">
      <div className="card-rp mx-auto max-w-lg p-10 text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="font-display text-2xl font-medium text-ink-900">
          This page isn&apos;t part of the portfolio
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
          Explore our handpicked properties instead.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold btn-md">
            Back to home
          </Link>
          <Link href="/properties" className="btn-outline btn-md">
            Browse properties
          </Link>
        </div>
      </div>
    </div>
  );
}