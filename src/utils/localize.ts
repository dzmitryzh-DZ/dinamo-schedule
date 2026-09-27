import type { Lang, MonthActivity, RosterPlayer, ScheduleRow } from "../data/types";

export function localizedText(
  primary: string | undefined,
  fallback: string | undefined
): string {
  return (primary || "").trim() || (fallback || "").trim();
}

export function playerDisplayName(player: RosterPlayer, lang: Lang): string {
  return lang === "en"
    ? localizedText(player.en, player.ru)
    : localizedText(player.ru, player.en);
}

export function rosterPlayerLabel(
  player: RosterPlayer,
  lang: Lang
): string {
  const number = player.number.trim();
  const name = playerDisplayName(player, lang);
  if (!name) return "";
  return number ? `№${number} ${name}` : name;
}

export function comparePlayersByNumber(
  a: RosterPlayer,
  b: RosterPlayer
): number {
  const na = parseInt(a.number.trim(), 10);
  const nb = parseInt(b.number.trim(), 10);
  const aNum = Number.isNaN(na) ? Infinity : na;
  const bNum = Number.isNaN(nb) ? Infinity : nb;
  if (aNum !== bNum) return aNum - bNum;
  const nameA = (a.ru || a.en).trim();
  const nameB = (b.ru || b.en).trim();
  return nameA.localeCompare(nameB, "ru");
}

export function scheduleNote(row: ScheduleRow, lang: Lang): string {
  return lang === "en"
    ? localizedText(row.noteEn, row.noteRu)
    : localizedText(row.noteRu, row.noteEn);
}

export function scheduleActivity(row: ScheduleRow, lang: Lang): string {
  return lang === "en"
    ? localizedText(row.activityEn, row.activityRu)
    : localizedText(row.activityRu, row.activityEn);
}

/** True when every text field of a schedule row is empty after trim. */
export function isBlankScheduleRow(row: ScheduleRow): boolean {
  return (
    !row.time.trim() &&
    !row.activityRu.trim() &&
    !row.activityEn.trim() &&
    !row.noteRu.trim() &&
    !row.noteEn.trim()
  );
}

export function monthActivityLabel(activity: MonthActivity, lang: Lang): string {
  return lang === "en"
    ? localizedText(activity.en, activity.ru)
    : localizedText(activity.ru, activity.en);
}

export function bilingualText(ru: string, en: string): string {
  const ruText = ru.trim();
  const enText = en.trim();
  if (!ruText && !enText) return "";
  if (!ruText) return enText;
  if (!enText) return ruText;
  if (ruText.toLowerCase() === enText.toLowerCase()) return ruText;
  return `${ruText} / ${enText}`;
}

/**
 * "ru / en" only when both languages are filled and differ. For secondary
 * labels that must not repeat the primary single-language name.
 */
export function bilingualPair(ru: string, en: string): string {
  const a = ru.trim();
  const b = en.trim();
  if (!a || !b) return "";
  return bilingualText(a, b) === a ? "" : `${a} / ${b}`;
}

export function formatScheduleForMessenger(
  rows: ScheduleRow[],
  title: string,
  date: string
): string {
  const lines: string[] = [];
  const header = date ? `${title} — ${date}` : title;
  lines.push(`*${header}*`, "");

  for (const row of rows) {
    const time = row.time.trim();
    const activity = bilingualText(row.activityRu, row.activityEn);
    const note = bilingualText(row.noteRu, row.noteEn);

    if (!time && !activity && !note) continue;

    if (time && activity) {
      lines.push(`*${time}* ${activity}`);
    } else if (activity) {
      lines.push(`*${activity}*`);
    } else if (time) {
      lines.push(`*${time}*`);
    }

    if (note) {
      lines.push(`_${note}_`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}
