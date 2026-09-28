import { getGuestyConfig, getSiteConfig } from "@/lib/guesty/config";
import { getAllProperties } from "@/lib/guesty/listings";
import { jsonOk, jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * GET /api/guesty/health — safe diagnostics. No credentials, ever.
 */
export async function GET() {
  try {
    const config = getGuestyConfig();
    const site = getSiteConfig();
    let listingCount = 0;
    if (!config.mockMode) {
      try {
        listingCount = (await getAllProperties()).length;
      } catch {
        // keep 0 — connectivity problem is reported via status field
      }
    }
    return jsonOk({
      status: "ok",
      mock: config.mockMode,
      bookingType: config.bookingType,
      listingCount,
      currency: site.defaultCurrency,
    });
  } catch (error) {
    return jsonApiError(error);
  }
}