import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { GuestyApiError, PaymentRequiredError, userFacingMessage } from "@/lib/guesty/errors";

/**
 * Route-handler helpers: consistent JSON errors that never leak
 * upstream/technical details to the client.
 */

export interface ApiErrorShape {
  error: { code: string; message: string };
}

function statusFor(kind: string): number {
  switch (kind) {
    case "VALIDATION":
    case "QUOTE_EXPIRED":
    case "QUOTE_CHANGED":
      return 409;
    case "LISTING_NOT_AVAILABLE":
      return 409;
    case "PAYMENT_REQUIRED":
      return 402;
    case "AUTHENTICATION":
      return 503;
    case "RATE_LIMIT":
      return 429;
    case "CONFIGURATION":
      return 503;
    default:
      return 500;
  }
}

export function jsonApiError(error: unknown): NextResponse<ApiErrorShape> {
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: first?.message ?? "Please check your details and try again.",
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof GuestyApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.kind,
          message: userFacingMessage(error),
        },
      },
      { status: statusFor(error.kind) }
    );
  }

  if (error instanceof PaymentRequiredError) {
    return NextResponse.json(
      {
        error: { code: "PAYMENT_REQUIRED", message: error.message },
      },
      { status: 402 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "UNKNOWN",
        message: "We couldn't complete this request right now. Please try again.",
      },
    },
    { status: 500 }
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}