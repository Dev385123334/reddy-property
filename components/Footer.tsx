import Link from "next/link";
import { siteBase } from "@/lib/site";

const EXPLORE_LINKS = [
  { href: "/properties", label: "All properties" },
  { href: "/properties?location=London", label: "London" },
  { href: "/properties?location=Cornwall", label: "Cornwall" },
  { href: "/properties?location=Cotswold", label: "The Cotswolds" },
];

export default function Footer() {
  const { name, email } = siteBase();

  return (
    <footer className="mt-24 border-t border-ink-900/10 bg-ivory-200/60">
      <div className="container-rp grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl font-medium text-ink-900">
            Reddy<span className="text-gold-500"> Properties</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            Handpicked luxury homes across the United Kingdom — verified
            availability, transparent pricing and a booking experience designed
            around you.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Explore</h3>
          <ul className="space-y-3">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-600 transition-colors hover:text-gold-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="space-y-3 text-sm text-ink-600">
            <li>
              <a
                href={`mailto:${email}`}
                className="transition-colors hover:text-gold-600"
              >
                {email}
              </a>
            </li>
            <li>United Kingdom</li>
            <li>Mon–Sun · 9:00–21:00 BST</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-900/10">
        <div className="container-rp flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p>Bookings are processed securely through our booking engine.</p>
        </div>
      </div>
    </footer>
  );
}