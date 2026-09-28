import "server-only";

import { getGuestyConfig } from "./config";
import { guestyRequest } from "./client";
import { ensureListingSlug, getSlugForListing, getListingForSlug } from "@/lib/db";
import { uniqueSlug } from "./slugify";
import { logGuesty } from "./errors";
import type {
  GuestyListing,
  GuestyListingsResponse,
  Property,
  PropertyImage,
} from "./types";

/**
 * Listing fetching + normalization.
 *
 * Property metadata is NOT time-sensitive, so it is cached aggressively
 * (in-memory TTL) to protect Guesty's rate limits. Availability and quotes
 * are always fetched fresh and are implemented in availability.ts / quote.ts.
 */

const LISTINGS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const LISTINGS_PAGE_LIMIT = 50;

interface ListingsCache {
  at: number;
  properties: Property[];
}

declare global {
  var __rdpListingsCache: ListingsCache | undefined;
}

function cachedProperties(): Property[] | null {
  const cache = globalThis.__rdpListingsCache;
  if (cache && Date.now() - cache.at < LISTINGS_CACHE_TTL_MS) {
    return cache.properties;
  }
  return null;
}

function storeProperties(properties: Property[]) {
  globalThis.__rdpListingsCache = { at: Date.now(), properties };
}

export function normalizeProperty(
  listing: GuestyListing,
  slug: string
): Property {
  const address = listing.address ?? {};
  const imageOrNull = (
    pic:
      | {
          original?: string;
          large?: string;
          regular?: string;
          thumbnail?: string;
          caption?: string;
        }
      | undefined
  ): PropertyImage | null => {
    if (!pic) return null;
    const url = pic.original ?? pic.large ?? pic.regular ?? pic.thumbnail;
    if (!url) return null;
    return {
      url,
      thumbnail: pic.thumbnail ?? url,
      caption: pic.caption,
    };
  };

  const images = (listing.pictures ?? [])
    .map(imageOrNull)
    .filter((img): img is PropertyImage => img !== null);

  const featured = imageOrNull(listing.picture) ?? images[0] ?? null;

  return {
    id: listing._id,
    slug,
    title: listing.title ?? listing.nickname ?? "Untitled property",
    nickname: listing.nickname,
    location: {
      city: address.city ?? "",
      state: address.state ?? "",
      country: address.country ?? "",
      neighborhood: address.neighborhood ?? "",
      full: address.full ?? "",
      lat: address.lat,
      lng: address.lng,
    },
    guests: listing.accommodates ?? 0,
    bedrooms: listing.bedrooms ?? 0,
    bathrooms: listing.bathrooms ?? 0,
    beds: listing.beds ?? 0,
    amenities: listing.amenities ?? [],
    images,
    featuredImage: featured,
    roomType: listing.roomType ?? "Entire property",
    propertyType: listing.propertyType ?? "Property",
    timezone: listing.timezone ?? "Europe/London",
    checkInTime: listing.defaultCheckInTime ?? "15:00",
    checkOutTime: listing.defaultCheckOutTime ?? "11:00",
  };
}

/** Fetches every assigned, listed listing (follows cursor pagination). */
async function fetchAllListings(): Promise<Property[]> {
  const properties: Property[] = [];
  let cursor: string | undefined;

  for (let guard = 0; guard < 10; guard++) {
    const query: Record<string, string> = { limit: String(LISTINGS_PAGE_LIMIT) };
    if (cursor) query.cursor = cursor;

    const data = await guestyRequest<GuestyListingsResponse>({
      path: "/listings",
      query,
    });

    const raw = Array.isArray(data) ? data : data.results ?? [];
    for (const listing of raw) {
      if (!listing._id) continue;
      if (listing.isListed === false || listing.active === false) continue;
      const existingSlug = await getSlugForListing(listing._id);
      const slug = existingSlug ?? uniqueSlug(listing.title ?? listing.nickname ?? listing._id, listing._id);
      if (!existingSlug) {
        await ensureListingSlug(listing._id, slug, listing.title);
      }
      properties.push(normalizeProperty(listing, slug));
    }

    const next = data?.pagination?.cursor?.next;
    if (!next || next === cursor) break;
    cursor = next;
  }

  logGuesty("listings", `Fetched ${properties.length} listings.`);
  return properties;
}

export async function getAllProperties(): Promise<Property[]> {
  if (process.env.NODE_ENV === "test") return fetchAllListings();
  const cached = cachedProperties();
  if (cached) return cached;

  if (getGuestyConfig().mockMode) {
    const { getMockProperties } = await import("./mock");
    const properties = await getMockProperties();
    storeProperties(properties);
    return properties;
  }

  const fresh = await fetchAllListings();
  storeProperties(fresh);
  return fresh;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const all = await getAllProperties();
  return all.find((p) => p.id === id) ?? null;
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const config = getGuestyConfig();
  if (config.mockMode) {
    const { getMockProperties } = await import("./mock");
    const properties = await getMockProperties();
    return properties.find((p) => p.slug === slug) ?? null;
  }
  const listingId = await getListingForSlug(slug);
  if (listingId) return getPropertyById(listingId);
  const all = await getAllProperties();
  return all.find((p) => p.slug === slug) ?? null;
}

/** Public property id -> slug map (for sitemap and links). */
export async function getSlugMap(): Promise<Map<string, string>> {
  const all = await getAllProperties();
  return new Map(all.map((p) => [p.id, p.slug]));
}