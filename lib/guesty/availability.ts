import "server-only";

import { guestyRequest } from "./client";
import { getGuestyConfig } from "./config";
import { getAllProperties } from "./listings";
import { logGuesty } from "./errors";
import type { GuestyListingsResponse, Property } from "./types";

/** Params for a property search. All optional. */
export interface SearchParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  location?: string;
  bedrooms?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
}

export interface SearchOutcome {
  matches: Property[];
  /** Set when date filtering was applied by Guesty (authoritative). */
  availabilityChecked: boolean;
}

function matchesLocation(property: Property, location: string): boolean {
  const q = location.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    property.location.city,
    property.location.state,
    property.location.country,
    property.location.neighborhood,
    property.location.full,
    property.title,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** Fetches the ids of listings available for a date range (Guesty-authoritative). */
async function fetchAvailableIds(checkIn: string, checkOut: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let cursor: string | undefined;

  for (let guard = 0; guard < 10; guard++) {
    const query: Record<string, string | number> = {
      limit: 50,
      checkIn,
      checkOut,
    };
    if (cursor) query.cursor = cursor;

    const data = await guestyRequest<GuestyListingsResponse>({
      path: "/listings",
      query,
    });
    for (const listing of data?.results ?? (Array.isArray(data) ? data : [])) {
      if (listing._id) ids.add(listing._id);
    }
    const next = data?.pagination?.cursor?.next;
    if (!next || next === cursor) break;
    cursor = next;
  }
  return ids;
}

/**
 * Searches available properties.
 *
 * When check-in/out are present, Guesty filters to properties it considers
 * available for the range (live, not faked). Guest occupancy is verified
 * against the real `accommodates` field locally, and location/bedroom/type
 * filters run against normalized property data.
 */
export async function searchAvailableProperties(
  params: SearchParams
): Promise<SearchOutcome> {
  const config = getGuestyConfig();

  if (config.mockMode) {
    const { mockSearch } = await import("./mock");
    return mockSearch(params);
  }

  const hasDates = !!params.checkIn && !!params.checkOut;
  const availableIds = hasDates
    ? await fetchAvailableIds(params.checkIn as string, params.checkOut as string)
    : null;

  // Safe-to-pass upstream filters (verified against this account's API).
  const priceFilters: Record<string, string> = {};
  if (params.minPrice !== undefined) priceFilters.minPrice = String(params.minPrice);
  if (params.maxPrice !== undefined) priceFilters.maxPrice = String(params.maxPrice);
  if (params.currency) priceFilters.currency = params.currency;

  // Fetch the full (cached) catalog, then apply local filters.
  const all = await getAllProperties();

  let matches = all.filter((property) => {
    if (availableIds && property.id && !availableIds.has(property.id)) return false;
    if (params.guests && params.guests > property.guests) return false;
    if (params.bedrooms && params.bedrooms > property.bedrooms) return false;
    if (params.location && !matchesLocation(property, params.location)) return false;
    if (
      params.propertyType &&
      params.propertyType.toLowerCase() !== property.propertyType.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const upstream = await guestyRequest<GuestyListingsResponse>({
      path: "/listings",
      query: {
        limit: 50,
        ...priceFilters,
        ...(params.checkIn ? { checkIn: params.checkIn } : {}),
        ...(params.checkOut ? { checkOut: params.checkOut } : {}),
      },
    });
    const upstreamIds = new Set(
      (upstream?.results ?? (Array.isArray(upstream) ? upstream : [])).map((l) => l._id)
    );
    matches = matches.filter((p) => upstreamIds.has(p.id));
  }

  logGuesty("search", `Search matched ${matches.length} properties.`);
  return { matches, availabilityChecked: hasDates };
}