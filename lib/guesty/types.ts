import "server-only";

/**
 * Types for the Guesty Booking Engine API layer.
 * Raw types mirror the live API responses; normalized types are the
 * contract the rest of the application depends on.
 */

// ---------------------------------------------------------------------------
// Raw Guesty types (as returned by booking.guesty.com/api)
// ---------------------------------------------------------------------------

export interface GuestyAddress {
  city?: string;
  country?: string;
  full?: string;
  lat?: number;
  lng?: number;
  state?: string;
  street?: string;
  neighborhood?: string;
}

export interface GuestyPicture {
  original?: string;
  thumbnail?: string;
  caption?: string;
}

export interface GuestyListing {
  _id: string;
  title?: string;
  nickname?: string;
  type?: string;
  roomType?: string;
  propertyType?: string;
  accommodates?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  amenities?: string[];
  timezone?: string;
  defaultCheckInTime?: string;
  defaultCheckOutTime?: string;
  address?: GuestyAddress;
  picture?: GuestyPicture;
  pictures?: GuestyPicture[];
  isListed?: boolean;
  active?: boolean;
}

export interface GuestyListingsResponse {
  results: GuestyListing[];
  pagination?: {
    total: number;
    cursor?: { next?: string };
  };
}

/** Error envelope returned by Guesty for non-2xx responses. */
export interface GuestyErrorBody {
  error?: {
    code?: string;
    message?: string;
    data?: unknown;
  };
  status?: number;
  message?: string;
}

/** A single rate plan offered inside a reservation quote. */
export interface GuestyQuoteRatePlan {
  ratePlanId?: string;
  ratePlanName?: string;
  baseRate?: number;
  total?: number;
  currency?: string;
  nightlies?: Array<{ date: string; price: number }>;
  [key: string]: unknown;
}

export interface GuestyQuoteResponse {
  _id?: string;
  quoteId?: string;
  createdAt?: string;
  expiresAt?: string;
  rates?: Record<string, unknown> | GuestyQuoteRatePlan[];
  baseRate?: number;
  total?: number;
  currency?: string;
  promotions?: unknown;
  coupons?: unknown;
  priceDefinition?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GuestyReservationResponse {
  _id?: string;
  id?: string;
  status?: string;
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
  totalPrice?: number;
  currency?: string;
  accountId?: string;
  inquiredAt?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Normalized application types
// ---------------------------------------------------------------------------

export interface Location {
  city: string;
  state: string;
  country: string;
  neighborhood: string;
  full: string;
  lat?: number;
  lng?: number;
}

export interface PropertyImage {
  url: string;
  thumbnail: string;
  caption?: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  nickname?: string;
  description?: string;
  location: Location;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  amenities: string[];
  images: PropertyImage[];
  featuredImage?: PropertyImage;
  roomType: string;
  propertyType: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  /** Optional "from" price currency; only present when the API exposes it. */
  currency?: string;
}

export type AvailabilityState = "available" | "unavailable" | "unavailable_dates" | "unavailable_guests";

export interface AvailabilityResult {
  available: boolean;
  state: AvailabilityState;
  reason?: string;
  /** Available when a fresh quote was requested along with the check. */
  quoteId?: string;
  propertyId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface QuoteLine {
  label: string;
  amount: number;
  currency: string;
}

export interface Quote {
  quoteId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  currency: string;
  breakdown: QuoteLine[];
  createdAt?: string;
  expiresAt?: string;
  /** Verification hash used to compare a displayed quote vs a fresh quote. */
  fingerprint: string;
  raw?: GuestyQuoteResponse;
}

export type ReservationKind = "inquiry" | "instant";

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
  guestsCount: number;
  specialRequests?: string;
}

export interface ReservationInput {
  quoteId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  expectedQuote: {
    total: number;
    currency: string;
    fingerprint: string;
  };
  guest: GuestDetails;
}

export interface ReservationResult {
  reservationId: string;
  status: string;
  kind: ReservationKind;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  currency: string;
  createdAt?: string;
  /** True when Guesty requires payment confirmation before a final booking. */
  paymentRequired: boolean;
}

export type BookingStatus = "reserved" | "confirmed" | "cancelled" | "pending" | "inquiry";