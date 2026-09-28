import "server-only";

import { getGuestyConfig } from "./config";
import { kvGet, kvSet } from "@/lib/db";
import { GuestyApiError, logGuesty } from "./errors";

/**
 * Guesty Booking Engine API OAuth.
 *
 * Flow: Next.js server -> POST {authUrl} (client_credentials) -> access token
 * -> cached for ~23h (reused across requests, refreshed once a day) -> API calls.
 *
 * The token is cached in Supabase (durable across Vercel cold starts) with an
 * in-memory single-flight guard so concurrent requests share one refresh.
 */

const TOKEN_KV_KEY = "guesty:access-token";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

declare global {
  var __guestToken: CachedToken | undefined;
  var __guestTokenPromise: Promise<string> | undefined;
}

const REFRESH_MARGIN_MS = 10 * 60 * 1000; // refresh 10 min before expiry

function memoryToken(): CachedToken | undefined {
  return globalThis.__guestToken;
}

function setMemoryToken(token: CachedToken) {
  globalThis.__guestToken = token;
}

function clearMemoryToken() {
  globalThis.__guestToken = undefined;
}

function isFresh(token: CachedToken | undefined): token is CachedToken {
  return !!token && token.expiresAt - REFRESH_MARGIN_MS > Date.now();
}

async function persistToken(token: CachedToken): Promise<void> {
  const ttlSeconds = Math.max(60, Math.floor((token.expiresAt - Date.now()) / 1000));
  await kvSet(TOKEN_KV_KEY, token, ttlSeconds).catch(() => {});
}

async function loadPersistedToken(): Promise<CachedToken | null> {
  try {
    const token = await kvGet<CachedToken>(TOKEN_KV_KEY);
    return token && isFresh(token) ? token : null;
  } catch {
    return null;
  }
}

async function requestToken(): Promise<string> {
  const config = getGuestyConfig();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "booking_engine:api",
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(config.authUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    const aborted = controller.signal.aborted;
    throw new GuestyApiError({
      kind: aborted ? "TIMEOUT" : "NETWORK",
      retryable: true,
      message: "Failed to reach the Guesty auth endpoint.",
    });
  }
  clearTimeout(timer);

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }

  if (!res.ok || typeof json.access_token !== "string") {
    const upstreamCode = typeof json.error === "string" ? json.error : "";
    const isRateLimit =
      res.status === 429 ||
      String(json.error).toLowerCase().includes("rate") ||
      String(json.error_description).includes("rate");
    throw new GuestyApiError({
      kind: isRateLimit ? "AUTH_RATE_LIMIT" : "AUTHENTICATION",
      status: res.status,
      upstreamCode,
      retryable: res.status === 429 || res.status >= 500,
      message: "Guesty OAuth token request failed.",
    });
  }

  const accessToken = String(json.access_token);
  const expiresIn = Number(json.expires_in ?? 86400);
  const expiresAt = Date.now() + expiresIn * 1000;

  setMemoryToken({ accessToken, expiresAt });
  await persistToken({ accessToken, expiresAt }).catch(() => {});

  logGuesty("auth", "Access token refreshed (cached for ~24h).");
  return accessToken;
}

/**
 * Returns a valid access token, reusing the cached one wherever possible.
 * Concurrent callers share a single in-flight refresh.
 */
export async function getAccessToken(): Promise<string> {
  // 1. warm in-memory cache
  const cached = memoryToken();
  if (isFresh(cached)) return cached.accessToken;

  // 2. share an in-flight refresh across concurrent requests
  if (globalThis.__guestTokenPromise) {
    return await globalThis.__guestTokenPromise;
  }

  // 3. load from Supabase KV cache (survives cold starts)
  const persisted = await loadPersistedToken();
  if (persisted) {
    setMemoryToken(persisted);
    return persisted.accessToken;
  }

  globalThis.__guestTokenPromise = requestToken()
    .then((token) => {
      globalThis.__guestTokenPromise = undefined;
      return token;
    })
    .catch((err) => {
      globalThis.__guestTokenPromise = undefined;
      clearMemoryToken();
      throw err;
    });

  return await globalThis.__guestTokenPromise;
}

/**
 * Called when an API request returns 401 — drops the cached token
 * so the next request obtains a fresh one.
 */
export async function invalidateAccessToken(): Promise<void> {
  clearMemoryToken();
  await kvSet(TOKEN_KV_KEY, null, 1).catch(() => {});
}