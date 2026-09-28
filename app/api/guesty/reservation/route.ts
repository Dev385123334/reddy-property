import { NextRequest, NextResponse } from "next/server";
import { finalizeBooking } from "@/lib/guesty/booking";
import { getPropertyById } from "@/lib/guesty/listings";
import { reservationRequestSchema } from "@/lib/validators";
import {
  BOOKING_COOKIE,
  bookingCookieOptions,
  loadSession,
  markSessionCreated,
  persistSession,
} from "@/lib/booking/session";
import { saveConfirmationSnapshot } from "@/lib/db";
import { jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * POST /api/guesty/reservation
 *
 * Final "Confirm Booking" step. Re-validates property, dates, guest count,
 * live availability and quote freshness server-side immediately before
 * creating the reservation. Payment is intentionally not part of this step.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = reservationRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonApiError(parsed.error);
    }
    const input = parsed.data;

    // The session cookie is the authoritative identifier.
    const sessionId = request.cookies.get(BOOKING_COOKIE)?.value;
    if (!sessionId || sessionId !== input.sessionId) {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_INVALID",
            message: "Your booking session has expired. Please select your dates again.",
          },
        },
        { status: 409 }
      );
    }

    const session = await loadSession(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_INVALID",
            message: "We couldn't find your booking. Please select your dates again.",
          },
        },
        { status: 409 }
      );
    }

    // Guard: the request must match the quoted session.
    const sessionMatches =
      session.listingId === input.listingId &&
      session.checkIn === input.checkIn &&
      session.checkOut === input.checkOut &&
      session.guests === input.guests;
    if (!sessionMatches) {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_INVALID",
            message: "Your booking details have changed. Please review and try again.",
          },
        },
        { status: 409 }
      );
    }

    // Use the server-side session snapshot (what the guest actually saw) as
    // the price baseline — never trust the client for price integrity.
    const outcome = await finalizeBooking({
      quoteId: session.quoteId,
      listingId: input.listingId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      expectedQuote: {
        total: session.total,
        currency: session.currency,
        fingerprint: session.fingerprint,
      },
      guest: input.guest,
    });

    if (outcome.status === "created") {
      const { reservation } = outcome;
      await markSessionCreated(sessionId, reservation.reservationId);

      const property = await getPropertyById(reservation.listingId).catch(() => null);
      const snapshot = {
        reservationId: reservation.reservationId,
        status: reservation.status,
        listingId: reservation.listingId,
        propertyTitle: property?.title ?? null,
        propertySlug: property?.slug ?? null,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        guests: reservation.guests,
        total: reservation.total,
        currency: reservation.currency,
        guest: {
          firstName: input.guest.firstName,
          lastName: input.guest.lastName,
          email: input.guest.email,
          phone: input.guest.phone,
          country: input.guest.country,
        },
        createdAt: new Date().toISOString(),
        paymentRequired: false,
      };
      await saveConfirmationSnapshot(reservation.reservationId, snapshot).catch(() => {});

      const response = NextResponse.json({ status: "created", reservation }, { status: 201 });
      response.cookies.set({
        ...bookingCookieOptions(),
        maxAge: 0,
      });
      return response;
    }

    if (outcome.status === "quote_changed") {
      const fresh = outcome.quote;
      const freshSession = await loadSession(sessionId);
      if (freshSession) {
        await persistSession({
          ...freshSession,
          quoteId: fresh.quoteId,
          total: fresh.total,
          currency: fresh.currency,
          fingerprint: fresh.fingerprint,
          breakdown: fresh.breakdown,
          rawQuote: (fresh.raw as unknown as Record<string, unknown>) ?? freshSession.rawQuote,
        });
      }
      return NextResponse.json(
        {
          status: "quote_changed",
          quote: {
            quoteId: fresh.quoteId,
            total: fresh.total,
            currency: fresh.currency,
            breakdown: fresh.breakdown,
            fingerprint: fresh.fingerprint,
          },
          message: "The price has changed. Please review the updated quote.",
        },
        { status: 409 }
      );
    }

    if (outcome.status === "payment_required") {
      return NextResponse.json(
        {
          status: "payment_required",
          message: outcome.message,
        },
        { status: 402 }
      );
    }

    // unavailable
    return NextResponse.json(
      {
        status: "unavailable",
        message: outcome.reason,
      },
      { status: 409 }
    );
  } catch (error) {
    return jsonApiError(error);
  }
}