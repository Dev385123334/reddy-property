import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGuestyConfig } from "@/lib/guesty/config";
import { recordWebhookEvent, webhookEventExists } from "@/lib/db";
import { logGuesty } from "@/lib/guesty/errors";

/**
 * POST /api/guesty/webhook
 *
 * Receives Guesty reservation events (created / updated / cancelled / status
 * changes as exposed by the account). Processing is idempotent: events are
 * stored by their event id so the same event is never handled twice.
 *
 * @returns 200 always for valid events (webhooks shouldn't be retried when
 * the integration is healthy); 401 for failed signature verification.
 */

const SUPPORTED_EVENT_PREFIXES = [
  "reservation.",
  "booking.",
];

function digest(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHash("sha256")
    .update(secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function resolveEventId(payload: Record<string, unknown>): string {
  const object = payload.object as Record<string, unknown> | undefined;
  const candidate =
    payload.eventId ??
    payload.event_id ??
    payload.id ??
    object?.["id"] ??
    payload._id;
  return typeof candidate === "string" || typeof candidate === "number"
    ? String(candidate)
    : "";
}

function resolveEventType(payload: Record<string, unknown>): string {
  const candidate =
    payload.eventType ??
    payload.event_type ??
    payload.type ??
    payload.event;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    const sub = (candidate as Record<string, unknown>);
    if (typeof sub.name === "string") return sub.name;
    if (typeof sub.type === "string") return sub.type;
  }
  return "reservation.unknown";
}

export async function POST(request: NextRequest) {
  const config = getGuestyConfig();
  const rawBody = await request.text();

  if (config.webhookSecret) {
    const signature = request.headers.get("x-guesty-signature");
    if (!signature) {
      logGuesty("webhook", "Rejected request missing X-Guesty-Signature.");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    if (!verifySignature(rawBody, signature, config.webhookSecret)) {
      logGuesty("webhook", "Rejected request with invalid signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = resolveEventId(payload);
  const eventType = resolveEventType(payload);

  if (!eventId) {
    // Events without an id can't be made idempotent — drop them loudly.
    logGuesty("webhook", "Dropped event without an id.", { eventType });
    return NextResponse.json({ ok: true, skipped: "no_event_id" });
  }

  // Idempotency: already processed -> ack without reprocessing.
  const seen = await webhookEventExists(eventId).catch(() => false);
  if (seen) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const object = payload.object as Record<string, unknown> | undefined;
  const reservationId =
    typeof payload.reservationId === "string"
      ? payload.reservationId
      : typeof object?.id === "string"
        ? String(object.id)
        : undefined;
  const listingId =
    typeof payload.listingId === "string"
      ? payload.listingId
      : typeof object?.listingId === "string"
        ? String(object.listingId)
        : undefined;

  const relevant = SUPPORTED_EVENT_PREFIXES.some((prefix) =>
    eventType.toLowerCase().startsWith(prefix)
  );

  logGuesty("webhook", `Received ${relevant ? "relevant" : "unrelated"} event ${eventType}.`, {
    eventId,
    reservationId,
    listingId,
  });

  await recordWebhookEvent({
    eventId,
    eventType,
    reservationId,
    listingId,
    payloadHash: digest(rawBody),
  }).catch(() => {
    logGuesty("webhook", "Failed to persist event (idempotency may degrade).", { eventId });
  });

  return NextResponse.json({ ok: true, duplicate: false });
}