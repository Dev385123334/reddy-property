import { NextRequest } from "next/server";
import { checkAvailability } from "@/lib/guesty/quote";
import { dateRangeSchema } from "@/lib/validators";
import { jsonOk, jsonApiError } from "@/lib/guesty/api-helpers";

/**
 * POST /api/guesty/availability
 * Live availability for a single property. Also returns the price quote
 * (authoritative) when the dates are bookable.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = dateRangeSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonApiError(parsed.error);
    }
    const result = await checkAvailability(parsed.data);
    return jsonOk(result, { status: 200 });
  } catch (error) {
    return jsonApiError(error);
  }
}