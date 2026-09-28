import "server-only";

import { getPropertyById } from "./listings";
import { createQuote } from "./quote";
import { createReservation } from "./reservations";
import { PaymentRequiredError, userFacingMessage } from "./errors";
import { validateDateRange, nightsBetween } from "@/lib/utils/dates";
import type { Quote, ReservationInput, ReservationResult } from "./types";

/**
 * Final booking pipeline.
 *
 * Everything the "Confirm Booking" button triggers:
 *   1. validate property + dates + guest count
 *   2. re-check real availability (fresh Guesty quote)
 *   3. compare the fresh quote to what the guest actually saw
 *      (price/fingerprint) — a change returns QUOTE_CHANGED and forces review
 *   4. create the reservation (inquiry now; instant requires payment)
 *
 * No step is faked, and availability/quote are always re-validated server-side
 * just before the reservation is created.
 */

export type BookingOutcome =
  | { status: "created"; reservation: ReservationResult }
  | { status: "quote_changed"; quote: Quote }
  | { status: "unavailable"; reason: string }
  | { status: "payment_required"; message: string };

export async function finalizeBooking(input: ReservationInput): Promise<BookingOutcome> {
  const property = await getPropertyById(input.listingId);
  if (!property) {
    return { status: "unavailable", reason: "This property is no longer available." };
  }

  const range = validateDateRange(input.checkIn, input.checkOut);
  if (!range.ok) {
    const reason =
      range.reason === "past"
        ? "Check-in cannot be in the past."
        : range.reason === "reversed"
          ? "Check-out must be after check-in."
          : "Please check the selected dates.";
    return { status: "unavailable", reason };
  }

  if (input.guests < 1) {
    return { status: "unavailable", reason: "Please select at least one guest." };
  }
  if (input.guests > property.guests) {
    return {
      status: "unavailable",
      reason: `This property accommodates up to ${property.guests} guests.`,
    };
  }
  if (nightsBetween(input.checkIn, input.checkOut) > 60) {
    return { status: "unavailable", reason: "We can't book stays longer than 60 nights online." };
  }

  // 1. Fresh availability + quote (authoritative).
  let freshQuote: Quote;
  try {
    freshQuote = await createQuote({
      listingId: input.listingId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      guest: {
        firstName: input.guest.firstName,
        lastName: input.guest.lastName,
        email: input.guest.email,
        phone: input.guest.phone,
      },
    });
  } catch {
    return {
      status: "unavailable",
      reason: "These dates are no longer available. Please select different dates.",
    };
  }

  // 2. Price integrity — the price shown must be the price charged.
  const priceChanged =
    Math.abs(freshQuote.total - input.expectedQuote.total) > 0.01 ||
    freshQuote.currency !== input.expectedQuote.currency ||
    freshQuote.fingerprint !== input.expectedQuote.fingerprint;

  if (priceChanged) {
    return { status: "quote_changed", quote: freshQuote };
  }

  // 3. Create the reservation.
  try {
    const result = await createReservation({
      quoteId: input.quoteId,
      listingId: input.listingId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      currency: freshQuote.currency,
      guest: input.guest,
    });

    if (result.paymentRequired) {
      return {
        status: "payment_required",
        message: userFacingMessage(new PaymentRequiredError("")),
      };
    }
    if (!result.reservation) {
      return {
        status: "unavailable",
        reason: "We couldn't complete the booking right now. Please try again.",
      };
    }
    return { status: "created", reservation: result.reservation };
  } catch (error) {
    if (error instanceof PaymentRequiredError) {
      return { status: "payment_required", message: error.message };
    }
    return {
      status: "unavailable",
      reason: "We couldn't complete the booking right now. Please try again.",
    };
  }
}