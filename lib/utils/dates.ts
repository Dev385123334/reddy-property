/** Lightweight date helpers (no external libs). All dates are local YYYY-MM-DD. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function parseDate(value: string): Date | null {
  if (!isValidDateString(value)) return null;
  return new Date(`${value}T12:00:00Z`);
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDate(checkIn);
  const b = parseDate(checkOut);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function todayString(): string {
  return toDateString(new Date());
}

export interface DateRangeIssue {
  ok: boolean;
  reason?: "invalid" | "past" | "reversed" | "too_long" | "empty";
}

export function validateDateRange(checkIn: string, checkOut: string): DateRangeIssue {
  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return { ok: false, reason: "invalid" };
  }
  const inDate = parseDate(checkIn) as Date;
  const outDate = parseDate(checkOut) as Date;
  const today = new Date(`${todayString()}T12:00:00Z`);

  if (outDate.getTime() <= inDate.getTime()) return { ok: false, reason: "reversed" };
  if (inDate.getTime() < today.getTime()) return { ok: false, reason: "past" };

  const nights = nightsBetween(checkIn, checkOut);
  if (nights > 60) return { ok: false, reason: "too_long" };

  return { ok: true };
}

export function formatDateLong(value: string, locale = "en-GB"): string {
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Builds a display range like "Sat, 12 Oct · Tue, 15 Oct 2026". */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const from = formatDateLong(checkIn).replace(/, \d{4}$/, "");
  const to = formatDateLong(checkOut);
  return `${from} · ${to}`;
}

export interface MonthCell {
  date: string; // YYYY-MM-DD or ""
  inMonth: boolean;
}

/** Grid of weeks for a calendar month (Mon-first, ISO 8601). */
export function monthGrid(year: number, monthIndex: number): MonthCell[][] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  let cursorDay = 1 - ((first.getUTCDay() + 6) % 7); // Monday-first offset

  const weeks: MonthCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.UTC(year, monthIndex, cursorDay + d));
      const inMonth = date.getUTCMonth() === monthIndex;
      week.push({
        inMonth,
        date: inMonth
          ? date.toISOString().slice(0, 10)
          : "",
      });
    }
    weeks.push(week);
    cursorDay += 7;
  }
  // Drop trailing empty weeks that end before the month starts.
  const lastDate = new Date(Date.UTC(year, monthIndex + 1, 0));
  const lastWeekIndex = weeks.findIndex((week) =>
    week.some((c) => c.inMonth && c.date === lastDate.toISOString().slice(0, 10))
  );
  return weeks.slice(0, lastWeekIndex + 1);
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;