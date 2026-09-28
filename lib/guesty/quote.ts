import "server-only";

import { createHash } from "node:crypto";
import { guestyRequest } from "./client";
import { getGuestyConfig } from "./config";
import { GuestyApiError } from "./errors";
import type {
  AvailabilityResult,
  GuestyQuoteResponse,
  Quote,
  QuoteLine,
} from "./types";

/**
 * Reservation quotes are the authoritative price source.
 * We never compute nightly-price x nights ourselves: Guesty calculates the
 * final total (fees, taxes, discounts, promotions) and we display its
 * breakdown verbatim.
 */

export interface QuoteRequest {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guest?: { firstName?: string; lastName?: string; email?: string; phone?: string };
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function dig(obj: unknown, ...keys: string[]): unknown {
  let cursor: unknown = obj;
  for (const key of keys) {
    if (cursor && typeof cursor === "object" && key in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cursor;
}

/**
 * Tries to build a human-readable price breakdown from whatever the quote
 * response exposes. Only real values are mapped; nothing is invented.
 * Falls back to a single "Total" line for the raw response shape.
 */
function extractBreakdown(
  raw: GuestyQuoteResponse,
  currency: string,
  total: number
): QuoteLine[] {
  const lines: QuoteLine[] = [];

  // Rate-plan shape: rates may be an array of rate plans or a map.
  const rates = raw.rates;

  const accommodation = asNumber(raw.baseRate);
  if (accommodation > 0) {
    lines.push({ label: "Accommodation", amount: accommodation, currency });
  } else if (Array.isArray(rates)) {
    const acc = rates.reduce((sum, rp) => sum + asNumber((rp as { baseRate?: unknown }).baseRate), 0);
    if (acc > 0) lines.push({ label: "Accommodation", amount: acc, currency });
  } else if (rates && typeof rates === "object") {
    // Aggregate amount across rate plans inside the object.
    const acc = Object.values(rates as Record<string, unknown>).reduce<number>(
      (sum, value) =>
        sum + asNumber(dig(value, "baseRate") ?? dig(value, "amount") ?? dig(value, "total")),
      0
    );
    if (acc > 0 && acc !== total) lines.push({ label: "Accommodation", amount: acc, currency });
  }

  const possibleFeeFields: Array<[string, string]> = [
    ["cleaningFee", "Cleaning fee"],
    ["taxes", "Taxes"],
    ["cityTax", "City tax"],
    ["serviceFee", "Service fee"],
    ["additionalFees", "Additional fees"],
  ];
  for (const [field, label] of possibleFeeFields) {
    const value = asNumber(dig(raw, "priceDefinition", field) ?? dig(raw, field));
    if (value > 0) lines.push({ label, amount: value, currency });
  }

  const discount = -Math.abs(
    asNumber(dig(raw, "promotions", "adjustment") ?? dig(raw, "promotions", "total"))
  );
  if (discount !== 0) lines.push({ label: "Discount", amount: discount, currency });

  // Sanity: if no lines were meaningful, emit the total alone.
  if (lines.length === 0) {
    lines.push({ label: "Total", amount: total, currency });
  }

  // Ensure the breakdown balances against the total when possible.
  const breakdownTotal = lines.reduce((sum, l) => sum + l.amount, 0);
  if (Math.abs(breakdownTotal - total) > 0.01 && breakdownTotal > 0) {
    const diff = total - breakdownTotal;
    if (Math.abs(diff) > 0.01) lines.push({ label: "Additional charges", amount: Number(diff.toFixed(2)), currency });
  }
  return lines;
}

function fingerprintOf(raw: GuestyQuoteResponse): string {
  const core = JSON.stringify({
    total: raw.total ?? dig(raw, "rates", "total"),
    currency: raw.currency ?? dig(raw, "rates", "currency"),
    baseRate: raw.baseRate,
    rawRates: raw.rates,
    rawPrices: raw.priceDefinition,
    promotions: raw.promotions,
    coupons: raw.coupons,
  });
  return createHash("sha256").update(core).digest("hex").slice(0, 16);
}

/** Creates a reservation quote. Throws LISTING_NOT_AVAILABLE when dates fail. */
export async function createQuote(req: QuoteRequest): Promise<Quote> {
  const config = getGuestyConfig();

  if (config.mockMode) {
    const { mockCreateQuote } = await import("./mock");
    return mockCreateQuote(req);
  }

  let raw: GuestyQuoteResponse;
  try {
    raw = await guestyRequest<GuestyQuoteResponse>({
      method: "POST",
      path: "/reservations/quotes",
      body: {
        listingId: req.listingId,
        checkInDateLocalized: req.checkIn,
        checkOutDateLocalized: req.checkOut,
        guestsCount: req.guests,
        ...(req.guest?.firstName || req.guest?.email
          ? {
              guest: {
                ...(req.guest?.firstName ? { firstName: req.guest.firstName } : {}),
                ...(req.guest?.lastName ? { lastName: req.guest.lastName } : {}),
                ...(req.guest?.email ? { email: req.guest.email } : {}),
                ...(req.guest?.phone ? { phone: req.guest.phone } : {}),
              },
            }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof GuestyApiError && error.kind === "LISTING_NOT_AVAILABLE") {
      throw error;
    }
    throw error;
  }

  const quoteId = String(raw._id ?? raw.quoteId ?? "");
  if (!quoteId) {
    throw new GuestyApiError({
      kind: "UPSTREAM",
      message: "Guesty quote response did not include a quote id.",
    });
  }

  const defaultCurrency = process.env.DEFAULT_CURRENCY || "GBP";
  const total = asNumber(raw.total ?? dig(raw, "rates", "total"));
  const currency = String(raw.currency ?? dig(raw, "rates", "currency") ?? defaultCurrency);

  return {
    quoteId,
    listingId: req.listingId,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    guests: req.guests,
    total,
    currency,
    breakdown: extractBreakdown(raw, currency, total),
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    fingerprint: fingerprintOf(raw),
    raw,
  };
}

/**
 * Single-property availability check. Uses the quote endpoint because it is
 * authoritative: a successful quote means the dates are bookable at the
 * returned price; a LISTING_IS_NOT_AVAILABLE response means they are not.
 */
export async function checkAvailability(req: QuoteRequest): Promise<AvailabilityResult> {
  try {
    const quote = await createQuote(req);
    return {
      available: true,
      state: "available",
      propertyId: req.listingId,
      quoteId: quote.quoteId,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      guests: req.guests,
    };
  } catch (error) {
    if (error instanceof GuestyApiError && error.kind === "LISTING_NOT_AVAILABLE") {
      const state = availabilityStateFromError(error);
      return {
        available: false,
        state,
        reason: userReasonFor(state),
        propertyId: req.listingId,
        checkIn: req.checkIn,
        checkOut: req.checkOut,
        guests: req.guests,
      };
    }
    throw error;
  }
}

function availabilityStateFromError(error: GuestyApiError): "unavailable_dates" | "unavailable_guests" {
  // Reason is best-effort: fall back to "unavailable_dates" whenever the
  // upstream payload doesn't expose structured notApplicable flags.
  const details = error.details as Record<string, unknown> | null | undefined;
  const errorNode = details?.error as Record<string, unknown> | undefined;
  const data = (errorNode?.data ?? details?.data) as Record<string, unknown> | undefined;
  const moreDetails = data?.moreDetails as Record<string, unknown> | undefined;
  const ratePlans = moreDetails?.notApplicableRatePlans as Array<Record<string, unknown>> | undefined;
  const flags = ratePlans?.[0]?.notApplicable as Record<string, boolean> | undefined;
  if (flags?.hardBlocked || flags?.closed || flags?.allotment) return "unavailable_dates";
  return "unavailable_dates";
}

function userReasonFor(state: "unavailable_dates" | "unavailable_guests"): string {
  return state === "unavailable_guests"
    ? "This property cannot host that number of guests for the selected dates."
    : "These dates are no longer available. Please select different dates.";
}