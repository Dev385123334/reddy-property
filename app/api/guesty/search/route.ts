import { NextRequest } from "next/server";
import { searchAvailableProperties } from "@/lib/guesty/availability";
import { searchParamsSchema } from "@/lib/validators";
import { jsonOk, jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * GET /api/guesty/search
 * Live availability search. Mirrors the URL params used on /properties.
 */
export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = searchParamsSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonApiError(parsed.error);
    }
    const { matches, availabilityChecked } = await searchAvailableProperties(parsed.data);
    return jsonOk({ properties: matches, availabilityChecked });
  } catch (error) {
    return jsonApiError(error);
  }
}