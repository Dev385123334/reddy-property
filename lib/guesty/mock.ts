import "server-only";

/**
 * ISOLATED DEVELOPMENT MOCK.
 *
 * Used ONLY when GUESTY_MOCK_MODE=true (set in .env for UI development).
 * These are clearly-labelled representative values so the premium UI and
 * booking flow can be refined before/without live Guesty credentials.
 *
 * Removal: delete every export in this file and keep GUESTY_MOCK_MODE=false.
 * The live integration in listings.ts / availability.ts / quote.ts /
 * reservations.ts takes over automatically.
 */

import { addDays, todayString, validateDateRange } from "@/lib/utils/dates";
import type { AvailabilityResult, Property, Quote } from "./types";
import { logGuesty } from "./errors";

const MOCK_IMG =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80";

function mockProperty(partial: Omit<Property, "images" | "featuredImage" | "roomType" | "timezone" | "checkInTime" | "checkOutTime" | "amenities">): Property {
  return {
    images: [
      { url: MOCK_IMG, thumbnail: MOCK_IMG, caption: "The lounge" },
      { url: MOCK_IMG, thumbnail: MOCK_IMG, caption: "The master bedroom" },
    ],
    featuredImage: { url: MOCK_IMG, thumbnail: MOCK_IMG, caption: partial.title },
    roomType: "Entire home/apt",
    timezone: "Europe/London",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    amenities: [
      "Wi-Fi",
      "Private garden",
      "Hot tub",
      "Washer & dryer",
      "Smart TV",
      "Fully equipped kitchen",
      "Free parking",
      "Barbecue",
    ],
    ...partial,
  };
}

function mockProperties(): Property[] {
  return [
    mockProperty({
      id: "mock-uk-001",
      slug: "luxury-cornish-coast-villa-mock-001",
      title: "The Cove House — Cornish Coast",
      nickname: "Cove House",
      location: {
        city: "St Ives",
        state: "Cornwall",
        country: "United Kingdom",
        neighborhood: "Porthmeor Beach",
        full: "Porthmeor, St Ives, Cornwall",
        lat: 50.2139,
        lng: -5.4802,
      },
      guests: 6,
      bedrooms: 3,
      bathrooms: 2,
      beds: 3,
      propertyType: "House",
    }),
    mockProperty({
      id: "mock-uk-002",
      slug: "cotswolds-stone-barn-mock-002",
      title: "Stone Barn Retreat — Cotswolds",
      nickname: "Stone Barn",
      location: {
        city: "Burford",
        state: "Oxfordshire",
        country: "United Kingdom",
        neighborhood: "Cotswolds",
        full: "Burford, Oxfordshire",
        lat: 51.8088,
        lng: -1.6366,
      },
      guests: 4,
      bedrooms: 2,
      bathrooms: 2,
      beds: 2,
      propertyType: "Country house",
    }),
    mockProperty({
      id: "mock-uk-003",
      slug: "lakeside-chalet-ambleside-mock-003",
      title: "Lakeside Chalet — Lake District",
      nickname: "Lakeside Chalet",
      location: {
        city: "Ambleside",
        state: "Cumbria",
        country: "United Kingdom",
        neighborhood: "Windermere",
        full: "Ambleside, Lake District",
        lat: 54.4322,
        lng: -2.9611,
      },
      guests: 5,
      bedrooms: 3,
      bathrooms: 1,
      beds: 3,
      propertyType: "Chalet",
    }),
    mockProperty({
      id: "mock-uk-004",
      slug: "mayfair-penthouse-london-mock-004",
      title: "Mayfair Penthouse — Mayfair, London",
      nickname: "Mayfair Penthouse",
      location: {
        city: "London",
        state: "England",
        country: "United Kingdom",
        neighborhood: "Mayfair",
        full: "Mayfair, London",
        lat: 51.5098,
        lng: -0.1464,
      },
      guests: 8,
      bedrooms: 4,
      bathrooms: 4,
      beds: 4,
      propertyType: "Apartment",
    }),
  ];
}

/** Deterministic nightly rate per mock property. */
function mockNightly(propertyId: string): number {
  const seed = propertyId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 185 + (seed % 7) * 45;
}

export async function getMockProperties(): Promise<Property[]> {
  return mockProperties().sort((a, b) => a.title.localeCompare(b.title));
}

export async function mockSearch(params: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  location?: string;
  bedrooms?: number;
  propertyType?: string;
}): Promise<{ matches: Property[]; availabilityChecked: boolean }> {
  const all = await getMockProperties();
  const q = (params.location ?? "").toLowerCase();
  const matches = all.filter((p) => {
    if (params.guests && params.guests > p.guests) return false;
    if (params.bedrooms && params.bedrooms > p.bedrooms) return false;
    if (
      q &&
      !`${p.location.city} ${p.location.state} ${p.location.country}`.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (params.propertyType && p.propertyType.toLowerCase() !== params.propertyType.toLowerCase()) {
      return false;
    }
    return true;
  });
  return { matches, availabilityChecked: !!params.checkIn && !!params.checkOut };
}

export async function mockCreateQuote(req: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<Quote> {
  const a = new Date(`${req.checkIn}T12:00:00Z`);
  const b = new Date(`${req.checkOut}T12:00:00Z`);
  const nights = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
  const nightly = mockNightly(req.listingId);
  const accommodation = nightly * nights;
  const cleaning = 65;
  const taxes = Math.round(accommodation * 0.11);
  const total = accommodation + cleaning + taxes;
  return {
    quoteId: `mock-quote-${req.listingId}-${Date.now()}`,
    listingId: req.listingId,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    guests: req.guests,
    total,
    currency: "GBP",
    breakdown: [
      { label: "Accommodation", amount: accommodation, currency: "GBP" },
      { label: "Cleaning fee", amount: cleaning, currency: "GBP" },
      { label: "Taxes", amount: taxes, currency: "GBP" },
    ],
    createdAt: new Date().toISOString(),
    expiresAt: addDays(todayString(), 1),
    fingerprint: `mock-${nights}-${nightly}`,
  };
}

export async function mockCheckAvailability(req: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<AvailabilityResult> {
  const rangeOk = validateDateRange(req.checkIn, req.checkOut);
  const blocked = req.listingId === "mock-uk-003"; // simulated stay unavailable
  const base: AvailabilityResult = {
    available: rangeOk.ok && !blocked,
    state: !rangeOk.ok
      ? "unavailable_dates"
      : blocked
        ? "unavailable_dates"
        : "available",
    propertyId: req.listingId,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    guests: req.guests,
    reason:
      rangeOk.ok && blocked
        ? "These dates are no longer available. Please select different dates."
        : undefined,
  };
  if (base.available) {
    const quote = await mockCreateQuote(req);
    base.quoteId = quote.quoteId;
  }
  return base;
}

export function mockReservationId(): string {
  const id = `mock-res-${Date.now()}`;
  logGuesty("mock", "Mock inquiry reservation id generated (development only).");
  return id;
}