import { getAllProperties } from "@/lib/guesty/listings";
import { jsonOk, jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * GET /api/guesty/listings
 * Full property catalogue (metadata is cached server-side ~1h).
 */
export async function GET() {
  try {
    const properties = await getAllProperties();
    return jsonOk({ properties });
  } catch (error) {
    return jsonApiError(error);
  }
}