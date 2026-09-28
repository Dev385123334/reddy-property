"use client";

import { Minus, Plus, Users } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
  compact?: boolean;
}

export default function GuestsStepper({
  value,
  onChange,
  min = 1,
  max,
  label = "Guests",
  compact = false,
}: Props) {
  const safeValue = Math.min(Math.max(value, min), max);

  return (
    <div
      className={
        compact
          ? "flex items-center justify-between"
          : "flex items-center justify-between rounded-xl border border-ink-900/15 bg-white px-4 py-3 shadow-soft"
      }
    >
      <div className="flex items-center gap-2.5">
        {!compact && <Users className="h-4 w-4 text-gold-500" aria-hidden="true" />}
        <span className="text-sm font-medium text-ink-900">{label}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(safeValue - 1, min))}
          disabled={safeValue <= min}
          aria-label="Decrease guests"
          className={`flex items-center justify-center rounded-full border border-ink-900/15 text-ink-700 transition hover:border-gold-500 disabled:opacity-40 disabled:hover:border-ink-900/15 ${
            compact ? "h-7 w-7 text-sm" : "h-9 w-9"
          }`}
        >
          <Minus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
        <span className="w-7 text-center text-base font-semibold text-ink-900">
          {safeValue}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(safeValue + 1, max))}
          disabled={safeValue >= max}
          aria-label="Increase guests"
          className={`flex items-center justify-center rounded-full border border-ink-900/15 text-ink-700 transition hover:border-gold-500 disabled:opacity-40 disabled:hover:border-ink-900/15 ${
            compact ? "h-7 w-7 text-sm" : "h-9 w-9"
          }`}
        >
          <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </div>
    </div>
  );
}