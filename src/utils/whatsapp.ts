import type { Lang, RosterPlayer, TrainingDay } from "../data/types";
import { parseDateRuToLocal } from "./dates";
import {
  bilingualText,
  isBlankScheduleRow,
  playerDisplayName,
} from "./localize";

/** Эмодзи по ключевым словам активности (RU/EN, без учёта регистра). */
const EMOJI_RULES: [RegExp, string][] = [
  [/завтрак|breakfast/i, "🍳"],
  [/обед|lunch/i, "🍽️"],
  [/ужин|dinner/i, "🍲"],
  [/вратар|goalie/i, "🥅"],
  [/лёд|лед|ice\b/i, "🏒"],
  [/офп|workout|gym|тренаж/i, "🏋️"],
  [/разминка|warm.?up/i, "🤸"],
  [/видео|video/i, "🎥"],
  [/собрание|meeting/i, "🗣️"],
  [/большинств|power\s?play/i, "⭐"],
  [/меньшинств|penalty\s?kill/i, "🛡️"],
  [/выходной|day\s?off|отдых|rest/i, "🌴"],
  [/восстанов|recovery/i, "🧖"],
  [/вылет|flight|самол[её]т|plane/i, "✈️"],
  [/поезд|train/i, "🚂"],
  [/автобус|bus/i, "🚌"],
  [/игра|матч|game|match/i, "🏆"],
  [/массаж|massage/i, "💆"],
  [/медицин|doctor|медосмотр/i, "🩺"],
  [/собесед|interview|пресса|press/i, "🎤"],
];

function activityEmoji(text: string): string {
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(text)) return emoji;
  }
  return "▫️";
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toLocaleUpperCase("ru-RU") + value.slice(1) : value;
}

/** «Вторник, 04.08.2026» / «Tuesday, 04.08.2026»; без дня недели, если дата битая. */
export function scheduleDateTitle(date: string, lang: Lang): string {
  const trimmed = date.trim();
  const local = parseDateRuToLocal(trimmed);
  if (!local) return trimmed;
  const weekday = capitalize(
    local.toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { weekday: "long" })
  );
  return `${weekday}, ${trimmed}`;
}

function playerLabel(player: RosterPlayer, lang: Lang): string {
  const number = player.number.trim();
  const name = playerDisplayName(player, lang);
  const base = number ? `№${number} ${name}` : name;
  return player.injured ? `${base} 🤕` : base;
}

function groupNames(ids: string[], roster: RosterPlayer[], lang: Lang): string[] {
  return ids
    .map((id) => roster.find((p) => p.id === id))
    .filter((p): p is RosterPlayer => Boolean(p))
    .map((p) => playerLabel(p, lang))
    .filter(Boolean);
}

/**
 * Текст расписания дня для WhatsApp: *жирный* заголовок с датой и днём
 * недели, эмодзи у активностей, _курсив_ у примечаний, списки групп внизу.
 */
export function formatDayForWhatsApp(
  day: TrainingDay,
  roster: RosterPlayer[],
  lang: Lang
): string {
  const lines: string[] = [];

  const title = scheduleDateTitle(day.date, lang);
  lines.push("🏒 *ХК ДИНАМО-МИНСК*");
  if (title) lines.push(`📅 *${title}*`);
  lines.push("");

  for (const row of day.schedule) {
    if (isBlankScheduleRow(row)) continue;

    if (row.kind === "split") {
      const label = bilingualText(row.activityRu, row.activityEn);
      if (label) lines.push("", `➖ *${label}* ➖`);
      continue;
    }

    const time = row.time.trim();
    const activity = bilingualText(row.activityRu, row.activityEn);
    const note = bilingualText(row.noteRu, row.noteEn);
    const emoji = activityEmoji(activity || note);

    if (time && activity) {
      lines.push(`${emoji} *${time}* — ${activity}`);
    } else if (activity) {
      lines.push(`${emoji} *${activity}*`);
    } else if (time) {
      lines.push(`🕐 *${time}*`);
    }
    if (note) lines.push(`   _${note}_`);
  }

  const groups: [string, string[]][] = [
    [
      bilingualText(day.groups.group1NameRu, day.groups.group1NameEn) ||
        (lang === "en" ? "Group 1" : "Группа 1"),
      groupNames(day.groups.group1, roster, lang),
    ],
    [
      bilingualText(day.groups.group2NameRu, day.groups.group2NameEn) ||
        (lang === "en" ? "Group 2" : "Группа 2"),
      groupNames(day.groups.group2, roster, lang),
    ],
  ];

  for (const [name, players] of groups) {
    if (!players.length) continue;
    lines.push("", `👥 *${name}*`);
    players.forEach((player, index) => lines.push(`${index + 1}. ${player}`));
  }

  lines.push(
    "",
    lang === "en"
      ? "⚠️ _The schedule is subject to change_"
      : "⚠️ _В расписании возможны изменения_"
  );

  return lines.join("\n");
}

/** Скопировать текст в буфер (Clipboard API + запасной вариант). */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("execCommand copy failed");
}

/** Открыть WhatsApp с готовым текстом (выбор чата). */
export function openInWhatsApp(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
