const REGION_MAP: Array<{ label: string; terms: string[] }> = [
  { label: "London", terms: ["london", "camden", "notting hill", "chelsea", "kensington", "shoreditch", "greenwich", "clapham", "islington"] },
  { label: "Cotswolds", terms: ["cotswold", "cheltenham", "chippenham", "cirencester", "broadway", "bourton", "tetbury", "stow"] },
  { label: "Lake District", terms: ["lake district", "windermere", "ambleside", "keswick", "cumbria", "lakeside"] },
  { label: "Cornwall", terms: ["cornwall", "st ives", "padstow", "newquay", "falmouth", "truro"] },
  { label: "Devon", terms: ["devon", "salcombe", "sidmouth", "torbay", "exeter", "plymouth"] },
  { label: "Scotland", terms: ["scotland", "edinburgh", "glasgow", "highland", "loch lomond", "inverness"] },
  { label: "Yorkshire", terms: ["yorkshire", "harrogate", "york", "leeds", "hevonside"] },
  { label: "Wales", terms: ["wales", "snowdonia", "cardiff", "conwy"] },
  { label: "Brighton", terms: ["brighton", "hove"] },
  { label: "Bath", terms: ["bath"] },
];

export interface Destination {
  id: string;
  label: string;
  count: number;
  imageUrl?: string;
  query: string;
}

/** Groups live properties into destinations by ≤ region match. */
export function buildDestinations(
  properties: Array<{
    location: { city: string; state: string; neighborhood: string; full: string };
    featuredImage?: { url?: string };
  }>,
  limit = 6
): Destination[] {
  const hits = new Map<string, { count: number; imageUrl?: string; query: string }>();

  for (const property of properties) {
    const haystack = [
      property.location.neighborhood,
      property.location.state,
      property.location.city,
      property.location.full,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    for (const region of REGION_MAP) {
      if (region.terms.some((term) => haystack.includes(term))) {
        const entry = hits.get(region.label) ?? { count: 0, query: region.terms[0] };
        entry.count += 1;
        if (!entry.imageUrl && property.featuredImage?.url) {
          entry.imageUrl = property.featuredImage.url;
        }
        hits.set(region.label, entry);
        break;
      }
    }
  }

  return Array.from(hits.entries())
    .map(([label, entry]) => ({ id: label, label, ...entry }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}