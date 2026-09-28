import "server-only";

/**
 * Server-only configuration for the Guesty Booking Engine API and app settings.
 * Never import this file (or anything that imports it) from client components.
 */

export type BookingType = "both" | "inquiry" | "instant";

export interface GuestyConfig {
  clientId: string;
  clientSecret: string;
  /** Base URL for the Booking Engine API (always server-side). */
  apiBase: string;
  /** OAuth2 token endpoint. */
  authUrl: string;
  /** Booking options selected on the Guesty API instance. */
  bookingType: BookingType;
  /** When true, the isolated mock layer is used instead of the live API. */
  mockMode: boolean;
  /** Webhook verification secret (optional). */
  webhookSecret: string;
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". Set it in your .env file (local) or Vercel project settings (production).`
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export function getGuestyConfig(): GuestyConfig {
  return {
    clientId: required("GUESTY_CLIENT_ID", process.env.GUESTY_CLIENT_ID),
    clientSecret: required("GUESTY_CLIENT_SECRET", process.env.GUESTY_CLIENT_SECRET),
    apiBase: optional("GUESTY_API_BASE", "https://booking.guesty.com/api"),
    authUrl: optional(
      "GUESTY_AUTH_URL",
      "https://booking.guesty.com/oauth2/token"
    ),
    bookingType: parseBookingType(
      optional("GUESTY_BOOKING_TYPE", "both")
    ),
    mockMode: optional("GUESTY_MOCK_MODE", "false").toLowerCase() === "true",
    webhookSecret: optional("GUESTY_WEBHOOK_SECRET", ""),
  };
}

function parseBookingType(value: string): BookingType {
  if (value === "inquiry" || value === "instant" || value === "both") {
    return value;
  }
  return "both";
}

export function getSiteConfig() {
  return {
    siteName: optional("NEXT_PUBLIC_SITE_NAME", "Reddy Properties"),
    siteUrl: optional(
      "NEXT_PUBLIC_SITE_URL",
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"
    ),
    supportEmail: optional("NEXT_PUBLIC_SUPPORT_EMAIL", "stay@reddyproperties.com"),
    defaultCurrency: optional("DEFAULT_CURRENCY", "GBP"),
  };
}