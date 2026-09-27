/** Format as DD.MM.YYYY */
export function formatDateRu(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** Split a DD.MM.YYYY string into numeric parts; invalid → null. */
function datePartsRu(value: string): { day: number; month: number; year: number } | null {
  const m = String(value).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return { day: +m[1], month: +m[2], year: +m[3] };
}

/** Parse DD.MM.YYYY to a comparable timestamp; invalid → NaN. */
export function parseDateRu(value: string): number {
  const parts = datePartsRu(value);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) : NaN;
}

/** Chronological compare for DD.MM.YYYY strings (empty dates last). */
export function compareDateRu(a: string, b: string): number {
  const ta = parseDateRu(a);
  const tb = parseDateRu(b);
  if (Number.isNaN(ta) && Number.isNaN(tb)) return String(a).localeCompare(String(b), "ru");
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return ta - tb;
}

export function startOfLocalDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Next `count` calendar days starting today (inclusive). */
export function upcomingDateStrings(count = 10, from = new Date()): string[] {
  const start = startOfLocalDay(from);
  return Array.from({ length: count }, (_, i) => formatDateRu(addDays(start, i)));
}

/** Monday = 0 … Sunday = 6 for a local Date. */
export function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function shiftMonth(year: number, monthIndex: number, delta: number): {
  year: number;
  monthIndex: number;
} {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export type MonthCell = {
  date: string;
  day: number;
  inMonth: boolean;
};

/** Calendar grid (Mon–Sun) covering `year`/`monthIndex` (0–11). */
export function buildMonthGrid(year: number, monthIndex: number): MonthCell[] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = mondayBasedWeekday(first);
  const start = addDays(first, -startOffset);
  const cells: MonthCell[] = [];

  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    cells.push({
      date: formatDateRu(d),
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
    });
  }

  return cells;
}

/** Capitalize the first letter (for ru-RU month names that come lowercase). */
function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("ru-RU") + value.slice(1);
}

export function monthTitle(year: number, monthIndex: number, lang: "ru" | "en"): string {
  const d = new Date(year, monthIndex, 1);
  const raw = d.toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
    month: "long",
    year: "numeric",
  });
  return lang === "ru" ? capitalizeFirst(raw) : raw;
}

/** Parse DD.MM.YYYY to a local Date at midnight; invalid → null. */
export function parseDateRuToLocal(value: string): Date | null {
  const parts = datePartsRu(value);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
}
