import "server-only";

import { getGuestyConfig } from "./config";
import { getAccessToken, invalidateAccessToken } from "./auth";
import { classifyGuestyError, GuestyApiError, logGuesty } from "./errors";

/**
 * HTTP client for the Guesty Booking Engine API.
 *
 * - injects the cached access token (never exposed to the browser)
 * - request timeouts
 * - exponential backoff for HTTP 429 and 5xx
 * - strips Accept headers that older endpoints reject
 * - single-flight dedup for identical concurrent requests
 * - transparent token refresh on 401 (retried once)
 */

const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 20_000;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

declare global {
  var __guestInFlight: Map<string, Promise<unknown>>;
}

const inFlight = () => {
  if (!globalThis.__guestInFlight) globalThis.__guestInFlight = new Map();
  return globalThis.__guestInFlight;
};

function buildUrl(
  apiBase: string,
  path: string,
  query?: RequestOptions["query"]
): string {
  const url = new URL(apiBase + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawFetch(
  token: string,
  opts: RequestOptions
): Promise<Response> {
  const { method = "GET", path, query, body } = opts;
  const config = getGuestyConfig();
  const url = buildUrl(config.apiBase, path, query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json; charset=utf-8",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GuestyApiError({ kind: "TIMEOUT", retryable: true, message: "Guesty request timed out." });
    }
    throw new GuestyApiError({ kind: "NETWORK", retryable: true, message: String(error) });
  } finally {
    clearTimeout(timer);
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function guestyRequest<T>(opts: RequestOptions): Promise<T> {
  const config = getGuestyConfig();
  const cacheKey = `${opts.method ?? "GET"} ${config.apiBase}${opts.path} ${JSON.stringify(opts.query ?? {})}`;

  const existing = inFlight().get(cacheKey);
  if (existing) {
    return (await existing) as T;
  }

  const run = ((): Promise<T> => {
    return (async () => {
      let token = await getAccessToken();
      let lastError: GuestyApiError | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }

        let res: Response;
        try {
          res = await rawFetch(token, opts);
        } catch (err) {
          const e = err as GuestyApiError;
          lastError = e;
          if (!e.retryable) break;
          continue; // network/timeout -> retry
        }

        if (res.status === 401) {
          await invalidateAccessToken();
          token = await getAccessToken();
          lastError = new GuestyApiError({ kind: "AUTHENTICATION", status: 401, retryable: false, message: "Guesty rejected the access token." });
          if (attempt < MAX_RETRIES) continue;
          break;
        }

        const body = await parseBody(res);

        if (res.ok) {
          return body as T;
        }

        const upstreamCode =
          typeof (body as { error?: { code?: string } })?.error?.code === "string"
            ? String((body as { error: { code: string } }).error.code)
            : "";

        const classified = classifyGuestyError({ status: res.status, body, upstreamCode });

        if (classified.retryable && attempt < MAX_RETRIES) {
          lastError = classified;
          continue;
        }
        throw classified;
      }

      throw lastError ?? new GuestyApiError({ kind: "UNKNOWN", message: "Guesty request failed." });
    })();
  })();

  inFlight().set(cacheKey, run);
  try {
    return await run;
  } finally {
    inFlight().delete(cacheKey);
  }
}

export { logGuesty };