import "server-only";

import { randomUUID } from "node:crypto";
import {
  getBookingSession,
  saveBookingSession,
  updateBookingSession,
  type BookingSession,
} from "@/lib/db";
import type { Quote } from "@/lib/guesty/types";

/**
 * Booking sessions keep the checkout flow stable across refreshes and
 * navigation. The browser only ever holds a random session id in an httpOnly
 * cookie; the quote snapshot lives server-side (Supabase, memory-fallback).
 */

export const BOOKING_COOKIE = "rdp_booking";
export const BOOKING_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h (matches quote lifetime)

export function quoteToSession(quote: Quote): BookingSession {
  return {
    id: randomUUID(),
    listingId: quote.listingId,
    quoteId: quote.quoteId,
    checkIn: quote.checkIn,
    checkOut: quote.checkOut,
    guests: quote.guests,
    total: quote.total,
    currency: quote.currency,
    fingerprint: quote.fingerprint,
    status: "quoted",
    rawQuote: (quote.raw as unknown as Record<string, unknown>) ?? undefined,
    breakdown: quote.breakdown,
  };
}

export async function persistSession(session: BookingSession): Promise<void> {
  await saveBookingSession(session);
}

export async function loadSession(sessionId: string): Promise<BookingSession | null> {
  if (!sessionId) return null;
  return await getBookingSession(sessionId);
}

export async function markSessionCreated(
  sessionId: string,
  reservationId: string
): Promise<void> {
  await updateBookingSession(sessionId, {
    status: "confirmed",
    reservationId,
  });
}

export function bookingCookieOptions(overrides?: {
  maxAge?: number;
  path?: string;
}) {
  return {
    name: BOOKING_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: overrides?.maxAge ?? BOOKING_COOKIE_MAX_AGE,
    path: overrides?.path ?? "/",
  };
}