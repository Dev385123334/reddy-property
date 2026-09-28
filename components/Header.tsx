"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** Brand wordmark + wordmark mark. */
export function RayLogo() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-2" aria-label="Reddy Properties home">
      <span className="font-display text-xl font-medium tracking-tight text-ink-900 sm:text-2xl">
        Reddy<span className="text-gold-500"> Properties</span>
      </span>
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "mailto:stay@reddyproperties.com", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onHomeDark = pathname === "/" && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "bg-ivory-100/85 backdrop-blur-md shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="container-rp flex h-16 items-center justify-between sm:h-20">
        <span className={onHomeDark && !open ? "mix-blend-difference" : ""}>
          <RayLogo />
        </span>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors hover:text-gold-600 ${
                pathname === link.href ? "text-gold-600" : "text-ink-800"
              } ${onHomeDark ? "text-ivory-50 hover:text-gold-300" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/properties" className="btn-gold btn-sm">
            Book a stay
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors md:hidden ${
            onHomeDark ? "text-ivory-50" : "text-ink-900"
          }`}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-ink-900/10 bg-ivory-100/95 backdrop-blur-md md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="container-rp flex flex-col gap-1 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ivory-200"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/properties"
              onClick={() => setOpen(false)}
              className="btn-gold btn-md mt-3"
            >
              Book a stay
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}