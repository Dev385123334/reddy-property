import "server-only";

/**
 * Typed, user-safe errors for the Guesty integration layer.
 * Guesty error payloads are normalized here so callers never touch raw
 * upstream errors and no technical details leak to the browser.
 */

export type GuestyErrorCode =
  | "CONFIGURATION"
  | "AUTHENTICATION"
  | "AUTH_RATE_LIMIT"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK"
  | "NOT_FOUND"
  | "LISTING_NOT_AVAILABLE"
  | "QUOTE_EXPIRED"
  | "QUOTE_CHANGED"
  | "PAYMENT_REQUIRED"
  | "VALIDATION"
  | "UPSTREAM"
  | "UNKNOWN";

export class GuestyApiError extends Error {
  readonly kind: GuestyErrorCode;
  readonly status?: number;
  readonly upstreamCode?: string;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(opts: {
    kind: GuestyErrorCode;
    message: string;
    status?: number;
    upstreamCode?: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = "GuestyApiError";
    this.kind = opts.kind;
    this.status = opts.status;
    this.upstreamCode = opts.upstreamCode;
    this.retryable = opts.retryable ?? false;
    this.details = opts.details;
  }
}

export class ConfigurationError extends GuestyApiError {
  constructor(message: string) {
    super({ kind: "CONFIGURATION", message });
    this.name = "ConfigurationError";
  }
}

export class PaymentRequiredError extends GuestyApiError {
  constructor(message: string, details?: unknown) {
    super({
      kind: "PAYMENT_REQUIRED",
      message,
      retryable: false,
      details,
    });
    this.name = "PaymentRequiredError";
  }
}

/**
 * Friendly, non-technical messages for end users. Maps every upstream
 * failure to a calm, actionable sentence. Never exposes secrets or stack traces.
 */
const USER_MESSAGES: Record<GuestyErrorCode, string> = {
  CONFIGURATION:
    "This page isn't ready yet. Please contact the property team.",
  AUTHENTICATION:
    "We couldn't connect to our booking system right now. Please try again shortly.",
  AUTH_RATE_LIMIT:
    "Our booking system is busy. Please try again in a few minutes.",
  RATE_LIMIT:
    "We're receiving a lot of enquiries right now. Please wait a moment and try again.",
  TIMEOUT: "The request took too long. Please try again.",
  NETWORK: "We couldn't reach our booking system. Please check your connection and try again.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  LISTING_NOT_AVAILABLE:
    "These dates are no longer available. Please select different dates.",
  QUOTE_EXPIRED:
    "Your quote has expired. Please select your dates again for an updated price.",
  QUOTE_CHANGED:
    "The price has changed. Please review the updated quote before continuing.",
  PAYMENT_REQUIRED:
    "This property requires payment to confirm instantly. Online payment isn't available yet — please submit a booking request instead or contact us.",
  VALIDATION: "Please check your details and try again.",
  UPSTREAM: "Something went wrong on our side. Please try again.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function userFacingMessage(error: unknown): string {
  if (error instanceof GuestyApiError) {
    return USER_MESSAGES[error.kind];
  }
  return USER_MESSAGES.UNKNOWN;
}

export function classifyGuestyError(opts: {
  status: number;
  body?: unknown;
  upstreamCode?: string;
}): GuestyApiError {
  const { status, body, upstreamCode = "" } = opts;
  const code = upstreamCode.toUpperCase();

  if (status === 401 || status === 403) {
    return new GuestyApiError({
      kind: "AUTHENTICATION",
      status,
      upstreamCode: code,
      retryable: true,
      message: "Authentication with the booking system failed.",
    });
  }
  if (status === 400 && code.includes("LISTING_IS_NOT_AVAILABLE")) {
    return new GuestyApiError({
      kind: "LISTING_NOT_AVAILABLE",
      status,
      upstreamCode: code,
      details: body,
      message: "The listing is not available for the selected dates.",
    });
  }
  if (status === 410) {
    return new GuestyApiError({
      kind: "UPSTREAM",
      status,
      upstreamCode: code,
      message: "An outdated Guesty endpoint was requested.",
    });
  }
  if (status === 429) {
    return new GuestyApiError({
      kind: "RATE_LIMIT",
      status,
      upstreamCode: code,
      retryable: true,
      message: "Guesty API rate limit reached.",
    });
  }
  if (status >= 500) {
    return new GuestyApiError({
      kind: "UPSTREAM",
      status,
      upstreamCode: code,
      retryable: true,
      message: "Guesty API returned a server error.",
    });
  }
  if (status === 404) {
    return new GuestyApiError({
      kind: "NOT_FOUND",
      status,
      upstreamCode: code,
      message: "Resource not found.",
    });
  }
  return new GuestyApiError({
    kind: status >= 400 ? "VALIDATION" : "UPSTREAM",
    status,
    upstreamCode: code,
    message: "Guesty API returned an unexpected response.",
  });
}

/**
 * Best-effort safe logging. Strips anything that could contain tokens or
 * credentials. Callers are responsible for never passing secrets.
 */
export function logGuesty(scope: string, message: string, extra?: Record<string, unknown>): void {
  const safe: Record<string, unknown> = {
    ...extra,
    scope,
  };
  if (safe.token) safe.token = "[redacted]";
  if (safe.accessToken) safe.accessToken = "[redacted]";
  console.warn(`[guesty:${scope}] ${message}`, JSON.stringify(safe));
}