import "server-only";

import { getSupabase, isTableMissing, dbWarning } from "./supabase";
import { mem } from "./memory-store";

/**
 * Typed data-access layer over Supabase (PostgreSQL) with a clearly-isolated
 * in-memory fallback for development until the schema.sql tables exist.
 *
 * NOTE: never store Guesty credentials here. Only app-side state.
 */

type Row = Record<string, unknown>;

function toTimestamp(expiresAt: Date | string | number | null | undefined): number {
  if (!expiresAt) return 0;
  const ms = typeof expiresAt === "string" || typeof expiresAt === "number"
    ? new Date(expiresAt).getTime()
    : expiresAt.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function rowData(row: Row | null | undefined): Row | null {
  return row && typeof row === "object" ? row : null;
}

// ---------------------------------------------------------------------------
// Key/value cache (access token + optional listing metadata cache)
// ---------------------------------------------------------------------------

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("guesty_kv")
        .select("value, expires_at")
        .eq("key", key)
        .maybeSingle();
      const row = rowData(data as Row | null);
      if (!row) return null;
      const expiresAt = toTimestamp(row.expires_at as string | number | Date | null | undefined);
      if (expiresAt && expiresAt <= Date.now()) return null;
      return (row.value as T) ?? null;
    } catch (error) {
      if (isTableMissing(error)) {
        dbWarning(
          "The guesty_kv table doesn't exist yet. Run supabase/schema.sql in the Supabase SQL Editor (falling back to memory)."
        );
      } else {
        dbWarning(`kvGet failed, using memory fallback: ${(error as Error).message}`);
      }
    }
  }
  const entry = mem.kvGet(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) return null;
  return entry.value as T;
}

export async function kvSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      await supabase.client
        .from("guesty_kv")
        .upsert(
          { key, value, expires_at: expiresAt, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`kvSet failed, using memory fallback: ${(error as Error).message}`);
      }
    }
  }
  mem.kvSet(key, value, ttlSeconds);
}

// ---------------------------------------------------------------------------
// Slug mapping
// ---------------------------------------------------------------------------

export async function ensureListingSlug(listingId: string, slug: string, title?: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      await supabase.client
        .from("listing_slugs")
        .upsert(
          {
            listing_id: listingId,
            slug,
            title: title ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "listing_id" }
        );
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`ensureListingSlug failed: ${(error as Error).message}`);
      }
    }
  }
  mem.addSlug(listingId, slug);
}

export async function getSlugForListing(listingId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("listing_slugs")
        .select("slug")
        .eq("listing_id", listingId)
        .maybeSingle();
      const row = rowData(data as Row | null);
      if (row && typeof row.slug === "string") return row.slug;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`getSlugForListing failed: ${(error as Error).message}`);
      }
    }
  }
  return mem.slugFor(listingId) ?? null;
}

export async function getListingForSlug(slug: string): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("listing_slugs")
        .select("listing_id")
        .eq("slug", slug)
        .maybeSingle();
      const row = rowData(data as Row | null);
      if (row && typeof row.listing_id === "string") return row.listing_id;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`getListingForSlug failed: ${(error as Error).message}`);
      }
    }
  }
  return mem.listingFor(slug) ?? null;
}

export async function listAllSlugs(): Promise<Array<{ slug: string; listing_id: string }>> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("listing_slugs")
        .select("slug, listing_id");
      return (data as Row[] | null)?.map((r) => ({
        slug: String(r.slug),
        listing_id: String(r.listing_id),
      })) ?? [];
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`listAllSlugs failed: ${(error as Error).message}`);
      }
    }
  }
  return Array.from(mem.memory().slugsBySlug.entries()).map(([slug, listing_id]) => ({
    slug,
    listing_id,
  }));
}

// ---------------------------------------------------------------------------
// Booking sessions (quote snapshots)
// ---------------------------------------------------------------------------

export interface BookingSession {
  id: string;
  listingId: string;
  quoteId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  currency: string;
  fingerprint: string;
  status: string;
  guestInfo?: Row;
  reservationId?: string;
  rawQuote?: Row;
  breakdown?: Array<{ label: string; amount: number; currency: string }>;
}

export async function saveBookingSession(session: BookingSession): Promise<void> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      await supabase.client
        .from("booking_sessions")
        .upsert(
          {
            id: session.id,
            listing_id: session.listingId,
            quote_id: session.quoteId,
            check_in: session.checkIn,
            check_out: session.checkOut,
            guests: session.guests,
            total: session.total,
            currency: session.currency,
            fingerprint: session.fingerprint,
            status: session.status,
            guest_info: session.guestInfo ?? null,
            reservation_id: session.reservationId ?? null,
            raw_quote: session.rawQuote ?? null,
            breakdown: session.breakdown ?? null,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`saveBookingSession failed: ${(error as Error).message}`);
      }
    }
  }
  mem.sessionSet(session.id, session as unknown as Row);
}

export async function getBookingSession(id: string): Promise<BookingSession | null> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("booking_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      const r = rowData(data as Row | null);
      if (!r) return null;
      return {
        id: String(r.id),
        listingId: String(r.listing_id),
        quoteId: String(r.quote_id),
        checkIn: String(r.check_in),
        checkOut: String(r.check_out),
        guests: Number(r.guests),
        total: Number(r.total),
        currency: String(r.currency),
        fingerprint: String(r.fingerprint),
        status: String(r.status),
        guestInfo: (r.guest_info as Row) ?? undefined,
        reservationId: r.reservation_id ? String(r.reservation_id) : undefined,
        rawQuote: (r.raw_quote as Row) ?? undefined,
        breakdown: (r.breakdown as BookingSession["breakdown"]) ?? undefined,
      };
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`getBookingSession failed: ${(error as Error).message}`);
      }
    }
  }
  const m = mem.sessionGet(id);
  return m ? (m as unknown as BookingSession) : null;
}

export async function updateBookingSession(
  id: string,
  patch: Partial<BookingSession>
): Promise<void> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("booking_sessions")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (rowData(data as Row | null)) {
        await supabase.client
          .from("booking_sessions")
          .update({
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.reservationId ? { reservation_id: patch.reservationId } : {}),
            ...(patch.guestInfo ? { guest_info: patch.guestInfo } : {}),
            ...(patch.guestInfo === undefined ? {} : {}),
          })
          .eq("id", id);
      }
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`updateBookingSession failed: ${(error as Error).message}`);
      }
    }
  }
  const existing = mem.sessionGet(id);
  if (existing) mem.sessionSet(id, { ...existing, ...patch });
}

// ---------------------------------------------------------------------------
// Webhook idempotency
// ---------------------------------------------------------------------------

export async function webhookEventExists(eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("webhook_events")
        .select("event_id")
        .eq("event_id", eventId)
        .maybeSingle();
      return Boolean(rowData(data as Row | null));
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`webhookEventExists failed: ${(error as Error).message}`);
      }
    }
  }
  return mem.hasWebhookEvent(eventId);
}

export async function recordWebhookEvent(event: {
  eventId: string;
  eventType: string;
  reservationId?: string;
  listingId?: string;
  payloadHash: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      await supabase.client
        .from("webhook_events")
        .upsert(
          {
            event_id: event.eventId,
            event_type: event.eventType,
            reservation_id: event.reservationId ?? null,
            listing_id: event.listingId ?? null,
            payload_hash: event.payloadHash,
            status: "processed",
            received_at: new Date().toISOString(),
          },
          { onConflict: "event_id", ignoreDuplicates: true }
        );
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`recordWebhookEvent failed: ${(error as Error).message}`);
      }
    }
  }
  mem.addWebhookEvent(event.eventId);
}

// ---------------------------------------------------------------------------
// Reservation confirmation snapshots (used by the confirmation page)
// ---------------------------------------------------------------------------

export interface ConfirmationSnapshot extends BookingSession {
  reservation: Row;
}

export async function saveConfirmationSnapshot(
  reservationId: string,
  snapshot: Row
): Promise<void> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      await supabase.client
        .from("guest_confirmation_cards")
        .upsert(
          {
            reservation_id: reservationId,
            snapshot,
            created_at: new Date().toISOString(),
          },
          { onConflict: "reservation_id" }
        );
      return;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`saveConfirmationSnapshot failed: ${(error as Error).message}`);
      }
    }
  }
  mem.reservationSet(reservationId, snapshot);
}

export async function getConfirmationSnapshot(reservationId: string): Promise<Row | null> {
  const supabase = getSupabase();
  if (supabase.kind === "ready") {
    try {
      const { data } = await supabase.client
        .from("guest_confirmation_cards")
        .select("snapshot, created_at")
        .eq("reservation_id", reservationId)
        .maybeSingle();
      const r = rowData(data as Row | null);
      if (r && r.snapshot) return r.snapshot as Row;
    } catch (error) {
      if (!isTableMissing(error)) {
        dbWarning(`getConfirmationSnapshot failed: ${(error as Error).message}`);
      }
    }
  }
  return (mem.reservationGet(reservationId) as Row | undefined) ?? null;
}