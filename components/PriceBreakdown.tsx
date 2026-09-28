import { formatPrice } from "@/lib/utils/format";
import type { Quote } from "@/lib/guesty/types";

/**
 * Authoritative price breakdown sourced from the Guesty reservation quote.
 * Shows exactly the lines Guesty returned — never invented sums.
 */
export default function PriceBreakdown({ quote }: { quote: Quote }) {
  const totalLine = quote.breakdown.reduce((sum, line) => sum + line.amount, 0);
  const balance = Math.abs(totalLine - quote.total);
  const lines = quote.breakdown;

  return (
    <div className="text-sm">
      <ul className="space-y-2.5">
        {lines.map((line) => (
          <li key={line.label} className="flex items-baseline justify-between gap-4">
            <span className="text-ink-600">{line.label}</span>
            <span className="font-medium text-ink-900">
              {formatPrice(line.amount, line.currency)}
            </span>
          </li>
        ))}
        {balance > 0.01 && (
          <li className="flex items-baseline justify-between gap-4">
            <span className="text-ink-600">Total</span>
            <span className="font-medium text-ink-900">{formatPrice(totalLine, quote.currency)}</span>
          </li>
        )}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-ink-900/10 pt-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-900">Total</span>
        <span className="font-display text-2xl font-medium text-ink-900">
          {formatPrice(quote.total, quote.currency)}
        </span>
      </div>
    </div>
  );
}