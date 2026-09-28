import "server-only";

import { guestyRequest } from "./client";
import { getGuestyConfig } from "./config";
import {
  GuestyApiError,
  PaymentRequiredError,
  logGuesty,
  userFacingMessage,
} from "./errors";
import type {
  GuestDetails,
  GuestyReservationResponse,
  ReservationKind,
  ReservationResult,
} from "./types";

/**
 * Reservation creation.
 *
 * Payment is intentionally out of scope. The inquiry flow (booking request,
 * no payment) is live now. The instant flow requires a valid payment token
 * (ccToken) in Guesty — without a payment gateway we surface a clear
 * "payment required" state instead of bypassing Guesty's booking policy.
 */

function resolveKind(): ReservationKind {
  const { bookingType } = getGuestyConfig();
  if (bookingType === "instant") return "instant";
  return "inquiry"; // "inquiry" and "both" both use the no-payment request flow
}

function guestPayload(guest: GuestDetails) {
  return {
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
  };
}

/** Booking request (inquiry) — no payment, host confirms in Guesty. */
async function createInquiryReservation(
  quoteId: string,
  guest: GuestDetails
): Promise<GuestyReservationResponse> {
  return await guestyRequest<GuestyReservationResponse>({
    method: "POST",
    path: `/reservations/quotes/${encodeURIComponent(quoteId)}/inquiry`,
    body: { guest: guestPayload(guest) },
  });
}

/**
 * Instant reservation requires a validated payment token from a payment
 * gateway (GuestyPay/Stripe/...), which is not integrated yet. Never faked.
 */
function assertInstantSupported(quoteId: string, guest: GuestDetails): never {
  throw new PaymentRequiredError(
    "Instant confirmation requires payment, which is not available yet.",
    { quoteId, lastName: guest.lastName }
  );
}

export function paymentRequiredMessage(): string {
  return userFacingMessage(new PaymentRequiredError(""));
}

export interface CreateReservationResult {
  ok: boolean;
  kind: ReservationKind;
  reservation?: ReservationResult;
  /** When payment is required and not provided. */
  paymentRequired?: boolean;
  message?: string;
}

export async function createReservation(opts: {
  quoteId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  currency: string;
  guest: GuestDetails;
}): Promise<CreateReservationResult> {
  const kind = resolveKind();

  if (kind === "instant") {
    assertInstantSupported(opts.quoteId, opts.guest);
  }

  const raw = await createInquiryReservation(opts.quoteId, opts.guest);
  const reservationId = String(raw._id ?? raw.id ?? "");
  if (!reservationId) {
    throw new GuestyApiError({
      kind: "UPSTREAM",
      message: "Guesty did not return a reservation id.",
    });
  }

  const result: ReservationResult = {
    reservationId,
    status: String(raw.status ?? "reserved"),
    kind,
    listingId: opts.listingId,
    checkIn: opts.checkIn,
    checkOut: opts.checkOut,
    guests: opts.guests,
    total: Number(raw.totalPrice ?? 0),
    currency: opts.currency,
    createdAt: raw.inquiredAt ?? raw.createdAt ? String(raw.inquiredAt ?? raw.createdAt) : undefined,
    paymentRequired: false,
  };

  logGuesty("reservation", `Reservation ${result.status} created (${reservationId}).`);
  return { ok: true, kind, reservation: result };
}