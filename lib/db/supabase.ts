import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Never import from client components. The key is only ever
 * present server-side (SUPABASE_SERVICE_ROLE_KEY is not NEXT_PUBLIC_).
 */

type DbState =
  | { kind: "ready"; client: SupabaseClient }
  | { kind: "disabled" } // credentials or table setup missing
  | { kind: "error"; reason: string };

let cachedState: DbState | null = null;
let loggedBootstrap = false;

function buildClient(): DbState {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { kind: "disabled" };
  }
  if (!url.startsWith("https://") || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
    return { kind: "error", reason: "SUPABASE_URL does not look like a Supabase project URL." };
  }
  return {
    kind: "ready",
    client: createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: {
        headers: { "x-application-name": "reddy-properties" },
      },
    }),
  };
}

export function getSupabase(): DbState {
  if (!cachedState) cachedState = buildClient();
  return cachedState;
}

/** True when a live Supabase client is available (env configured). */
export function hasSupabase(): boolean {
  return getSupabase().kind === "ready";
}

export function dbWarning(message: string): void {
  if (loggedBootstrap) return;
  loggedBootstrap = true;
  console.warn(`[supabase] ${message}`);
}

export function isTableMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "42P01" || // relation does not exist
    code === "PGRST205" || // table not found
    message.includes("PGRST205") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

export type { SupabaseClient };