/** Currency + number formatting with Intl. */

export function formatPrice(
  amount: number,
  currency: string | undefined
): string {
  const safeCurrency = currency && currency.length === 3 ? currency : "GBP";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceCompact(
  amount: number,
  currency: string | undefined
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency && currency.length === 3 ? currency : "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}