import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/guesty/config";

/** Central site metadata. */

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Reddy Properties";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function siteBase(): { name: string; url: string; email: string } {
  const cfg = unsafeSiteConfig();
  return {
    name: cfg.siteName,
    url: trimTrailingSlash(cfg.siteUrl),
    email: cfg.supportEmail,
  };
}

function unsafeSiteConfig() {
  try {
    return getSiteConfig();
  } catch {
    return {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      supportEmail: "stay@reddyproperties.com",
      defaultCurrency: "GBP",
    };
  }
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  images?: string[];
  keywords?: string[];
}

export function createMetadata(opts: PageMetadataOptions): Metadata {
  const { name, url } = siteBase();
  const canonical = `${url}${opts.path}`;
  const imageUrl = opts.images?.[0]
    ? `${url}/og${opts.path.replace(/\/$/, "")}.png`
    : undefined;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical },
    keywords: opts.keywords,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: name,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}