import "server-only";

/**
 * In-memory fallback store. Used ONLY when Supabase env is missing or the
 * tables haven't been created yet. Not durable across cold starts / restarts —
 * it exists so the booking flow is fully functional during development.
 * Once the Supabase tables are created, all reads/writes go to the database.
 */

export interface MemoryKvEntry {
  value: unknown;
  expiresAt: number;
}

interface RdpMemory {
  kv: Map<string, MemoryKvEntry>;
  slugsByListing: Map<string, string>;
  slugsBySlug: Map<string, string>;
  webhookEvents: Set<string>;
  sessions: Map<string, Record<string, unknown>>;
  reservations: Map<string, Record<string, unknown>>;
}

declare global {
  var __rdpMemory: RdpMemory | undefined;
}

function memory(): RdpMemory {
  if (!globalThis.__rdpMemory) {
    globalThis.__rdpMemory = {
      kv: new Map(),
      slugsByListing: new Map(),
      slugsBySlug: new Map(),
      webhookEvents: new Set(),
      sessions: new Map(),
      reservations: new Map(),
    };
  }
  return globalThis.__rdpMemory;
}

export const mem = {
  kvGet: (key: string): MemoryKvEntry | undefined => memory().kv.get(key),
  kvSet: (key: string, value: unknown, ttlSeconds: number) =>
    memory().kv.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    }),
  memory,

  addSlug(listingId: string, slug: string) {
    memory().slugsByListing.set(listingId, slug);
    memory().slugsBySlug.set(slug, listingId);
  },
  slugFor: (listingId: string) => memory().slugsByListing.get(listingId),
  listingFor: (slug: string) => memory().slugsBySlug.get(slug),

  hasWebhookEvent: (eventId: string) => memory().webhookEvents.has(eventId),
  addWebhookEvent: (eventId: string) => memory().webhookEvents.add(eventId),

  sessionGet: (id: string) => memory().sessions.get(id),
  sessionSet: (id: string, value: Record<string, unknown>) =>
    memory().sessions.set(id, value),

  reservationGet: (id: string) => memory().reservations.get(id),
  reservationSet: (id: string, value: Record<string, unknown>) =>
    memory().reservations.set(id, value),
};