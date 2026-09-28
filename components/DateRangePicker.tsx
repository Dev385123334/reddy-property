"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTHS,
  WEEKDAYS,
  formatDateLong,
  monthGrid,
  todayString,
} from "@/lib/utils/dates";

export interface DateRange {
  checkIn?: string;
  checkOut?: string;
}

type ActiveField = "checkIn" | "checkOut";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: string;
  /** Show two separate fields (Check-in / Check-out). Default true. */
  split?: boolean;
  /** "pill" = borderless for the hero search; "field" = bordered inputs. */
  variant?: "pill" | "field";
  className?: string;
}

function fieldText(value: string | undefined, fallback: string): string {
  return value ? formatDateLong(value) : fallback;
}

export default function DateRangePicker({
  value,
  onChange,
  minDate,
  split = true,
  variant = "field",
  className = "",
}: Props) {
  const today = useMemo(() => minDate ?? todayString(), [minDate]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveField>("checkIn");
  const [view, setView] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const grid = useMemo(
    () => monthGrid(view.year, view.month),
    [view.year, view.month]
  );

  const isDisabled = (date: string) => date < today;

  const openPicker = (field: ActiveField) => {
    setActive(field);
    setOpen(true);
  };

  const pick = (date: string) => {
    if (isDisabled(date)) return;

    if (!split) {
      if (!value.checkIn) {
        onChange({ checkIn: date });
        return;
      }
      if (!value.checkOut) {
        if (date <= value.checkIn) {
          onChange({ checkIn: date });
        } else {
          onChange({ checkIn: value.checkIn, checkOut: date });
          setOpen(false);
        }
        return;
      }
      onChange({ checkIn: date });
      return;
    }

    if (active === "checkOut") {
      if (value.checkIn && date > value.checkIn) {
        onChange({ checkIn: value.checkIn, checkOut: date });
        setOpen(false);
      } else {
        // picked a day on/before check-in -> restart check-in, keep focus on out
        onChange({ checkIn: date });
        setActive("checkOut");
      }
      return;
    }

    // active === "checkIn"
    const next: DateRange = { checkIn: date };
    if (value.checkOut && date < value.checkOut) {
      next.checkOut = value.checkOut;
    }
    onChange(next);
    setActive("checkOut");
  };

  const moveMonth = (delta: number) => {
    setView((v) => {
      const newMonth = v.month + delta;
      if (newMonth < 0) return { year: v.year - 1, month: 11 };
      if (newMonth > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: newMonth };
    });
  };

  const inRange = (date: string) =>
    !!value.checkIn && !!value.checkOut && date > value.checkIn && date < value.checkOut;

  const triggerBase =
    variant === "pill"
      ? "flex min-w-0 flex-1 items-center justify-between gap-1.5 text-left"
      : "flex w-full items-center justify-between gap-2 rounded-xl border border-ink-900/15 bg-white px-4 py-3 text-left text-sm text-ink-900 shadow-soft transition-colors hover:border-gold-500";

  const triggerFieldCls = (field: ActiveField) =>
    `${triggerBase} ${
      variant === "pill"
        ? ""
        : field === active && open
          ? "border-gold-500 ring-2 ring-gold-300/40"
          : ""
    }`;

  const renderTrigger = (): ReactNode => {
    if (!split) {
      return (
        <button
          type="button"
          onClick={() => openPicker("checkIn")}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={triggerFieldCls("checkIn")}
        >
          <span className="truncate">{fieldText(value.checkIn ?? value.checkOut, "Select dates")}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
        </button>
      );
    }

    return (
      <div
        className={
          variant === "pill"
            ? "flex items-center gap-2"
            : "grid grid-cols-2 gap-2"
        }
      >
        <button
          type="button"
          onClick={() => openPicker("checkIn")}
          aria-haspopup="dialog"
          aria-expanded={open && active === "checkIn"}
          className={triggerFieldCls("checkIn")}
        >
          <span className={`truncate ${value.checkIn ? "text-ink-900" : "text-ink-400"}`}>
            {value.checkIn ? fieldText(value.checkIn, "") : "Check-in"}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => openPicker("checkOut")}
          aria-haspopup="dialog"
          aria-expanded={open && active === "checkOut"}
          className={triggerFieldCls("checkOut")}
        >
          <span className={`truncate ${value.checkOut ? "text-ink-900" : "text-ink-400"}`}>
            {value.checkOut ? fieldText(value.checkOut, "") : "Check-out"}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {renderTrigger()}

      {open && (
        <div
          role="dialog"
          aria-label="Select stay dates"
          className="absolute left-0 right-0 z-30 mt-2 sm:right-auto sm:w-[360px] rounded-2xl bg-white p-5 shadow-lift ring-1 ring-ink-900/10"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-medium text-ink-900">
                {MONTHS[view.month]} {view.year}
              </p>
              <p className="text-xs text-ink-500">
                {split
                  ? active === "checkIn"
                    ? "Select check-in date"
                    : "Select check-out date"
                  : value.checkIn
                    ? "Select check-out date"
                    : "Select check-in date"}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
                className="rounded-full p-2 text-ink-600 transition hover:bg-ivory-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
                className="rounded-full p-2 text-ink-600 transition hover:bg-ivory-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-ink-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.flat().map(({ date, inMonth }, idx) => {
              if (!date) return <div key={`x${idx}`} />;
              const disabled = !inMonth || isDisabled(date);
              const isStart = value.checkIn === date;
              const isEnd = value.checkOut === date;
              const inside = inRange(date);
              const isToday = date === todayString();

              let classes =
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors";
              if (disabled) {
                classes += " text-ink-300";
              } else if (isStart || isEnd) {
                classes += " bg-gold-500 font-semibold text-ivory-50";
              } else if (inside) {
                classes += " bg-gold-200/50 text-ink-800";
              } else {
                classes += " text-ink-700 hover:bg-ivory-200";
              }

              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(date)}
                  className={classes}
                  aria-label={date}
                  role="gridcell"
                  aria-selected={isStart || isEnd}
                >
                  {Number(date.slice(8))}
                  {isToday && !isStart && !isEnd && (
                    <span className="pointer-events-none absolute bottom-0.5 h-1 w-1 rounded-full bg-gold-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink-900/10 pt-3">
            <p className="text-xs text-ink-500">
              {value.checkIn && value.checkOut ? (
                <>
                  Check-in {formatDateLong(value.checkIn)} → Check-out{" "}
                  {formatDateLong(value.checkOut)}
                </>
              ) : (
                <>
                  {value.checkIn || active === "checkOut"
                    ? "Select check-out date"
                    : "Select check-in date"}
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-dark btn-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}