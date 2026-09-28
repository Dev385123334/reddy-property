import { NextRequest, NextResponse } from "next/server";
import { createQuote } from "@/lib/guesty/quote";
import { quoteRequestSchema } from "@/lib/validators";
import {
  bookingCookieOptions,
  persistSession,
  quoteToSession,
} from "@/lib/booking/session";
import { jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * POST /api/guesty/quote
 * Creates a Guesty reservation quote (authoritative price), persists a
 * booking session server-side and sets an httpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = quoteRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonApiError(parsed.error);
    }

    const { firstName, lastName, email, phone, ...quoteRequest } = parsed.data;

    const quote = await createQuote({
      ...quoteRequest,
      guest: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
    });

    const session = quoteToSession(quote);
    await persistSession(session);

    const response = NextResponse.json({
      ok: true,
      sessionId: session.id,
      quote: {
        quoteId: quote.quoteId,
        total: quote.total,
        currency: quote.currency,
        breakdown: quote.breakdown,
        fingerprint: quote.fingerprint,
      },
    });
    response.cookies.set({
      ...bookingCookieOptions(),
      value: session.id,
    });
    return response;
  } catch (error) {
    return jsonApiError(error);
  }
}