export const ROW_COLORS = [
  { key: "", label: "—", labelEn: "—" },
  { key: "red", label: "Красный", labelEn: "Red" },
  { key: "orange", label: "Оранжевый", labelEn: "Orange" },
  { key: "yellow", label: "Жёлтый", labelEn: "Yellow" },
  { key: "green", label: "Зелёный", labelEn: "Green" },
  { key: "teal", label: "Бирюзовый", labelEn: "Teal" },
  { key: "blue", label: "Синий", labelEn: "Blue" },
  { key: "navy", label: "Индиго", labelEn: "Indigo" },
  { key: "purple", label: "Фиолетовый", labelEn: "Purple" },
  { key: "pink", label: "Розовый", labelEn: "Pink" },
] as const;

export type RowColorKey = (typeof ROW_COLORS)[number]["key"];

const ROW_COLOR_KEYS = new Set<string>(
  ROW_COLORS.map((c) => c.key).filter((key) => key.length > 0)
);

/** Retired keys from the larger palette → nearest remaining color. */
const ROW_COLOR_ALIASES: Record<string, string> = {
  lime: "green",
  gold: "yellow",
  brown: "orange",
  gray: "navy",
};

export function normalizeRowColor(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const mapped = ROW_COLOR_ALIASES[value] ?? value;
  return ROW_COLOR_KEYS.has(mapped) ? mapped : "";
}

export function rowColorClass(color: string | undefined): string {
  const key = normalizeRowColor(color);
  return key ? `row-color-${key}` : "";
}

export const ROW_COLOR_PALETTE = ROW_COLORS.map((c) => c.key).filter(
  (key): key is Exclude<RowColorKey, ""> => key.length > 0
);

/**
 * First unused palette color, scanned cyclically after the last used color.
 * When every palette color is taken, keeps the cycle going past it.
 */
export function nextUnusedRowColor(used: Iterable<string | undefined>): string {
  type PaletteKey = (typeof ROW_COLOR_PALETTE)[number];
  const taken = new Set<string>();
  let lastColor = "";
  for (const value of used) {
    const key = normalizeRowColor(value);
    if (key) {
      taken.add(key);
      lastColor = key;
    }
  }
  const n = ROW_COLOR_PALETTE.length;
  const start = lastColor
    ? (ROW_COLOR_PALETTE.indexOf(lastColor as PaletteKey) + 1) % n
    : 0;
  for (let i = 0; i < n; i++) {
    const key = ROW_COLOR_PALETTE[(start + i) % n];
    if (!taken.has(key)) return key;
  }
  // All palette colors are in use: continue the cycle after the last one.
  return ROW_COLOR_PALETTE[start];
}
