import "server-only";

/** Deterministic, URL-friendly slug generation from a listing title. */
export function slugifyTitle(title: string, maxLen = 64): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Guarantees uniqueness by appending the first chars of the Guesty listing id. */
export function uniqueSlug(title: string, listingId: string): string {
  const base = slugifyTitle(title);
  const suffix = listingId.slice(0, 6) || "listing";
  const core = base || `property-${suffix}`;
  return `${core}-${suffix}`;
}