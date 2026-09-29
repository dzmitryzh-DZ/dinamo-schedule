import {
  DAY_KINDS,
  isDayKind,
  FLIGHT_DEST_MAX,
  type ActivityItem,
  type FlightDest,
  type DayGroups,
  type DayKind,
  type DayTemplate,
  type MatchInfo,
  type MonthActivity,
  type RosterPlayer,
  type ScheduleRow,
  type ScheduleStore,
  type SplitItem,
  type TeamItem,
  type TeamMark,
  type TrainingDay,
} from "./types";
import { addDays, formatDateRu, startOfLocalDay, upcomingDateStrings } from "../utils/dates";
import { normalizeRowColor, nextUnusedRowColor } from "../utils/rowColors";
import { DEFAULT_TEAMS, TEAM_MARKS } from "./teams";

export const STORAGE_KEY = "dinamo-schedule-v3";
export const SCHEMA_VERSION = 5;
export const LANG_KEY = "dinamo-schedule-lang";

export function cloneData<T>(value: T): T {
  return structuredClone(value);
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createRowId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the legacy id below */
  }
  return createId("row");
}

export function createPlayerId(): string {
  return createId("p");
}

export function createActivityId(): string {
  return createId("a");
}

export function createSplitId(): string {
  return createId("split");
}

export function createTeamId(): string {
  return createId("team");
}

export function createMonthActivityId(): string {
  return createId("ma");
}

function createDayId(): string {
  return createId("day");
}

function createTemplateId(): string {
  return createId("tpl");
}

export function emptyScheduleRow(kind?: "split"): ScheduleRow {
  return {
    id: createRowId(),
    time: "",
    activityRu: "",
    activityEn: "",
    noteRu: "",
    noteEn: "",
    color: "",
    ...(kind ? { kind } : {}),
  };
}

const BLANK_SCHEDULE_ROWS = 6;

function blankSchedule(count = BLANK_SCHEDULE_ROWS): ScheduleRow[] {
  return Array.from({ length: count }, () => emptyScheduleRow());
}

function isBlankSchedule(schedule: ScheduleRow[]): boolean {
  return schedule.every(
    (row) =>
      !row.time.trim() &&
      !row.activityRu.trim() &&
      !row.activityEn.trim() &&
      !row.noteRu.trim() &&
      !row.noteEn.trim()
  );
}

/** Demo schedule row: `[time, activityRu, activityEn, noteRu?, noteEn?]`. */
type DemoRow = [string, string, string, (string | undefined)?, (string | undefined)?];

function demoRows(...entries: DemoRow[]): ScheduleRow[] {
  return entries.map(([time, activityRu, activityEn, noteRu, noteEn]) => ({
    id: createRowId(),
    time,
    activityRu,
    activityEn,
    noteRu: noteRu ?? "",
    noteEn: noteEn ?? "",
    color: "",
  }));
}

const SAMPLE_PLAYERS: { ru: string; en: string }[] = [
  { ru: "Ковалёв А.", en: "Kovalev A." },
  { ru: "Смирнов Д.", en: "Smirnov D." },
  { ru: "Петров Н.", en: "Petrov N." },
  { ru: "Иванов М.", en: "Ivanov M." },
  { ru: "Морозов К.", en: "Morozov K." },
  { ru: "Волков Е.", en: "Volkov E." },
  { ru: "Соколов И.", en: "Sokolov I." },
  { ru: "Лебедев П.", en: "Lebedev P." },
  { ru: "Новиков С.", en: "Novikov S." },
  { ru: "Орлов В.", en: "Orlov V." },
  { ru: "Фёдоров А.", en: "Fyodorov A." },
  { ru: "Михайлов Р.", en: "Mikhailov R." },
  { ru: "Алексеев Т.", en: "Alekseev T." },
  { ru: "Егоров Л.", en: "Egorov L." },
  { ru: "Павлов Ю.", en: "Pavlov Yu." },
  { ru: "Кузнецов Г.", en: "Kuznetsov G." },
  { ru: "Степанов Б.", en: "Stepanov B." },
  { ru: "Николаев Д.", en: "Nikolaev D." },
  { ru: "Зайцев А.", en: "Zaitsev A." },
  { ru: "Белов И.", en: "Belov I." },
  { ru: "Громов К.", en: "Gromov K." },
];

function withIds(players: { ru: string; en: string }[]): RosterPlayer[] {
  return players.map((player, index) => ({
    ru: player.ru,
    en: player.en,
    number: "",
    position: "",
    active: true,
    injured: false,
    id: `sample-${index + 1}`,
  }));
}

const DEFAULT_ROSTER: RosterPlayer[] = withIds(SAMPLE_PLAYERS);

const G1 = DEFAULT_ROSTER.slice(0, 9).map((p) => p.id);
const G2 = DEFAULT_ROSTER.slice(9, 18).map((p) => p.id);
const GOL = DEFAULT_ROSTER.slice(18, 21).map((p) => p.id);

const SAMPLE_GROUPS: DayGroups = {
  group1: [...G1, GOL[0], GOL[1]],
  group2: [...G2, GOL[2]],
  group1NameRu: "Группа 1",
  group1NameEn: "Group 1",
  group2NameRu: "Группа 2",
  group2NameEn: "Group 2",
};

/** Group fallback for files that do have real roster data: names only, no
 * demo player ids (demo groups are for demo-only data). */
const BLANK_GROUPS: DayGroups = {
  group1: [],
  group2: [],
  group1NameRu: "Группа 1",
  group1NameEn: "Group 1",
  group2NameRu: "Группа 2",
  group2NameEn: "Group 2",
};

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: "a-breakfast", ru: "Завтрак", en: "Breakfast", color: "orange" },
  { id: "a-lunch", ru: "Обед", en: "Lunch", color: "yellow" },
  { id: "a-dinner", ru: "Ужин", en: "Dinner", color: "pink" },
  { id: "a-meeting", ru: "Собрание", en: "Meeting", color: "teal" },
  { id: "a-video", ru: "Видео", en: "Video", color: "purple" },
  { id: "a-warmup", ru: "Разминка", en: "Warm-up", color: "green" },
  { id: "a-ice", ru: "Лёд", en: "Ice", color: "blue" },
  { id: "a-workout", ru: "ОФП", en: "Workout", color: "navy" },
  { id: "a-goalies", ru: "Вратари", en: "Goalies", color: "red" },
  { id: "a-pp", ru: "Большинство", en: "Power play", color: "orange" },
  { id: "a-pk", ru: "Меньшинство", en: "Penalty kill", color: "red" },
  { id: "a-dayoff", ru: "Выходной", en: "Day off", color: "navy" },
];

const DEFAULT_SPLITS: SplitItem[] = [
  { id: "split-playing", ru: "Играющий состав", en: "Playing roster", color: "navy" },
  { id: "split-nonplaying", ru: "Неиграющий состав", en: "Non-playing roster", color: "orange" },
];

export const DEFAULT_DATA: ScheduleStore = {
  version: SCHEMA_VERSION,
  activeDayId: "day-2026-08-04",
  roster: cloneData(DEFAULT_ROSTER),
  calendar: {
    "03.08.2026": ["training"],
    "04.08.2026": ["training"],
    "05.08.2026": ["training"],
  },
  matches: {},
  teams: cloneData(DEFAULT_TEAMS),
  activities: cloneData(DEFAULT_ACTIVITIES),
  splits: cloneData(DEFAULT_SPLITS),
  templates: [],
  monthActivities: [],
  monthActivityOrder: [...DAY_KINDS, "flight", "train"],
  monthKindLogos: {},
  flights: {},
  trains: {},
  monthWatermark: true,
  days: [
    {
      id: "day-2026-08-03",
      date: "03.08.2026",
      schedule: demoRows(
        ["9:05–9:20", "Разминка", "Warm-up", "игровой зал", "game hall"],
        ["9:45–10:10", "Вратари + БОЛ", "Goalies + PP", "конькобежный стадион", "speed skating arena"],
        ["10:15–10:25", "Собрание (видео), группа 2", "Meeting (video), group 2", "главная раздевалка", "main locker room"],
        ["10:30–11:30", "Группа 2, лёд", "Group 2, ice", "главная арена", "main arena"],
        ["11:45–12:30", "Группа 2, ОФП", "Group 2, off-ice", "тренажёрный зал", "gym"],
        ["11:45–11:55", "Собрание (видео), группа 1", "Meeting (video), group 1", "главная раздевалка", "main locker room"],
        ["12:00–13:00", "Группа 1, лёд", "Group 1, ice", "главная арена", "main arena"],
        ["13:15–14:00", "Группа 1, ОФП", "Group 1, off-ice", "тренажёрный зал", "gym"]
      ),
      groups: cloneData(SAMPLE_GROUPS),
    },
    {
      id: "day-2026-08-04",
      date: "04.08.2026",
      schedule: demoRows(
        ["8:00–10:00", "Завтрак", "Breakfast"],
        ["9:30", "Группа 1, собрание", "Group 1, Meeting"],
        ["9:45", "Вратари", "Goalies"],
        ["9:50", "Группа 1, разминка", "Group 1, Warm-up"],
        ["10:30", "Группа 1, Лёд", "Group 1, Ice"],
        ["11:20", "Группа 2, разминка", "Group 2, Warm-up"],
        ["11:45", "Группа 1, ОФП", "Group 1, Workout"],
        ["11:45", "Группа 2, собрание", "Group 2, Meeting"],
        ["12:00", "Группа 2, Лёд", "Group 2, Ice"],
        ["13:00", "Обед", "Lunch"],
        ["13:15", "Группа 2, ОФП", "Group 2, Workout"]
      ),
      groups: cloneData(SAMPLE_GROUPS),
    },
    {
      id: "day-2026-08-05",
      date: "05.08.2026",
      schedule: demoRows(
        ["8:00–10:00", "Завтрак", "Breakfast"],
        ["10:00", "Группа 1, разминка", "Group 1, Warm-up"],
        ["10:30", "Группа 1, Лёд", "Group 1, Ice"],
        ["12:00", "Группа 2, Лёд", "Group 2, Ice"],
        ["13:00", "Обед", "Lunch"]
      ),
      groups: cloneData(SAMPLE_GROUPS),
    },
  ],
};

export function emptyDay(date = ""): TrainingDay {
  return {
    id: createDayId(),
    date,
    schedule: blankSchedule(),
    gameDay: false,
    groupsLabelRu: "",
    groupsLabelEn: "",
    groups: {
      group1: [],
      group2: [],
      group1NameRu: "Группа 1",
      group1NameEn: "Group 1",
      group2NameRu: "Группа 2",
      group2NameEn: "Group 2",
    },
  };
}

/** Tomorrow (after local today): create or pad to 6 empty activity rows. */
export function ensureDayAfterToday(
  store: ScheduleStore,
  from = new Date()
): { store: ScheduleStore; changed: boolean } {
  const date = formatDateRu(addDays(startOfLocalDay(from), 1));
  const next = cloneData(store);
  let day = findDayByDate(next, date);
  let changed = false;

  if (!day) {
    day = emptyDay(date);
    next.days.push(day);
    next.activeDayId = day.id;
    changed = true;
    return { store: next, changed };
  }

  if (isBlankSchedule(day.schedule) && day.schedule.length < BLANK_SCHEDULE_ROWS) {
    while (day.schedule.length < BLANK_SCHEDULE_ROWS) {
      day.schedule.push(emptyScheduleRow());
    }
    changed = true;
  }

  if (isBlankSchedule(day.schedule) && next.activeDayId !== day.id) {
    next.activeDayId = day.id;
    changed = true;
  }

  return { store: next, changed };
}

export function applyDaySnapshot(
  day: TrainingDay,
  source: TrainingDay | DayTemplate
): TrainingDay {
  return {
    ...day,
    schedule: cloneData(source.schedule),
    groups: cloneData(source.groups),
    groupsLabelRu: source.groupsLabelRu ?? "",
    groupsLabelEn: source.groupsLabelEn ?? "",
  };
}

export function dayFromTemplate(
  date: string,
  template?: TrainingDay | DayTemplate | null
): TrainingDay {
  const base = emptyDay(date);
  if (!template) return base;
  return applyDaySnapshot(base, template);
}

export function templateFromDay(
  day: TrainingDay,
  nameRu: string,
  nameEn: string
): DayTemplate {
  const snapshot = applyDaySnapshot(emptyDay(""), day);
  return {
    id: createTemplateId(),
    nameRu: nameRu.trim(),
    nameEn: nameEn.trim(),
    schedule: snapshot.schedule,
    groups: snapshot.groups,
    groupsLabelRu: snapshot.groupsLabelRu,
    groupsLabelEn: snapshot.groupsLabelEn,
  };
}

export function createUpcomingDays(
  store: ScheduleStore,
  count = 10,
  template?: TrainingDay | DayTemplate | null
): { store: ScheduleStore; created: TrainingDay[] } {
  const existing = new Set(store.days.map((day) => day.date.trim()));
  const created: TrainingDay[] = [];
  const next = cloneData(store);
  const source = template ?? getActiveDay(store);

  for (const date of upcomingDateStrings(count)) {
    if (existing.has(date)) continue;
    const day = dayFromTemplate(date, source);
    created.push(day);
    next.days.push(day);
    existing.add(date);
  }

  if (created.length) {
    next.activeDayId = created[0].id;
  }

  return { store: next, created };
}

function playerKey(player: { ru?: string; en?: string }): string {
  return `${(player.ru || "").trim().toLowerCase()}|${(player.en || "").trim().toLowerCase()}`;
}

function ensureRosterPlayer(
  roster: RosterPlayer[],
  player: { ru?: string; en?: string; number?: string; position?: string; id?: string }
): string {
  if (player.id && roster.some((p) => p.id === player.id)) return player.id;

  const key = playerKey(player);
  if (!key.replace("|", "")) {
    const created: RosterPlayer = {
      id: createPlayerId(),
      ru: player.ru || "",
      en: player.en || "",
      number: player.number || "",
      position: player.position || "",
    };
    roster.push(created);
    return created.id;
  }

  const existing = roster.find((p) => playerKey(p) === key);
  if (existing) return existing.id;

  const created: RosterPlayer = {
    id: createPlayerId(),
    ru: player.ru || "",
    en: player.en || "",
    number: player.number || "",
    position: player.position || "",
  };
  roster.push(created);
  return created.id;
}

function normalizeGroupIds(
  list: unknown,
  roster: RosterPlayer[],
  fallbackIds: string[]
): string[] {
  if (!Array.isArray(list)) return [...fallbackIds];

  const mapped = list.map((item) => {
    if (typeof item === "string") {
      // Keep intentional empty slots; unknown ids become empty selects.
      if (!item) return "";
      if (roster.some((p) => p.id === item)) return item;
      console.warn(`[storage] dropped unknown roster id "${item}" from day groups`);
      return "";
    }
    if (item && typeof item === "object") {
      return ensureRosterPlayer(roster, item as { ru?: string; en?: string; id?: string });
    }
    return "";
  });
  return mapped;
}

function normalizeSchedule(
  list: unknown,
  fallback: TrainingDay["schedule"]
): TrainingDay["schedule"] {
  if (!Array.isArray(list)) return cloneData(fallback);
  return list.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === "string" && r.id ? r.id : createRowId(),
      time: typeof r.time === "string" ? r.time : "",
      activityRu: typeof r.activityRu === "string" ? r.activityRu : "",
      activityEn: typeof r.activityEn === "string" ? r.activityEn : "",
      noteRu: typeof r.noteRu === "string" ? r.noteRu : "",
      noteEn: typeof r.noteEn === "string" ? r.noteEn : "",
      color: normalizeRowColor(r.color),
      kind: r.kind === "split" ? ("split" as const) : undefined,
    };
  });
}

function normalizeDay(
  day: Partial<TrainingDay> | null | undefined,
  roster: RosterPlayer[],
  fallbackGroups: DayGroups,
  fallbackSchedule: TrainingDay["schedule"]
): TrainingDay {
  const groupsSource = (day?.groups ?? fallbackGroups) as Record<string, unknown>;
  const group1 = normalizeGroupIds(groupsSource.group1, roster, fallbackGroups.group1);
  const group2 = normalizeGroupIds(groupsSource.group2, roster, fallbackGroups.group2);
  const legacyGoalies = normalizeGroupIds(
    groupsSource.goalies ?? groupsSource.goalie,
    roster,
    []
  );

  // Fold former "goalies" column into group1/group2 (skip already assigned).
  const used = new Set([...group1, ...group2]);
  const extras = legacyGoalies.filter((id) => id && !used.has(id));
  for (let i = 0; i < extras.length; i++) {
    if (i % 2 === 0) group1.push(extras[i]);
    else group2.push(extras[i]);
  }

  return {
    id: typeof day?.id === "string" && day.id ? day.id : createDayId(),
    date: typeof day?.date === "string" ? day.date : "",
    schedule: normalizeSchedule(day?.schedule, fallbackSchedule),
    gameDay: day?.gameDay === true,
    groupsLabelRu: typeof day?.groupsLabelRu === "string" ? day.groupsLabelRu : "",
    groupsLabelEn: typeof day?.groupsLabelEn === "string" ? day.groupsLabelEn : "",
    groups: {
      group1,
      group2,
      group1NameRu:
        typeof groupsSource.group1NameRu === "string" && groupsSource.group1NameRu.trim()
          ? groupsSource.group1NameRu
          : fallbackGroups.group1NameRu,
      group1NameEn:
        typeof groupsSource.group1NameEn === "string" && groupsSource.group1NameEn.trim()
          ? groupsSource.group1NameEn
          : fallbackGroups.group1NameEn,
      group2NameRu:
        typeof groupsSource.group2NameRu === "string" && groupsSource.group2NameRu.trim()
          ? groupsSource.group2NameRu
          : fallbackGroups.group2NameRu,
      group2NameEn:
        typeof groupsSource.group2NameEn === "string" && groupsSource.group2NameEn.trim()
          ? groupsSource.group2NameEn
          : fallbackGroups.group2NameEn,
    },
  };
}

/**
 * A missing field (old file that never had a roster) falls back to the demo
 * roster; a present-but-empty array is respected and stays empty.
 */
function normalizeRoster(list: unknown): RosterPlayer[] {
  if (!Array.isArray(list)) return cloneData(DEFAULT_ROSTER);
  const roster: RosterPlayer[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const p = item as Partial<RosterPlayer>;
    roster.push({
      id: typeof p.id === "string" && p.id ? p.id : createPlayerId(),
      ru: p.ru || "",
      en: p.en || "",
      number: p.number || "",
      position: p.position || "",
      active: p.active !== false,
      injured: Boolean(p.injured),
    });
  }
  return roster;
}

const MONTH_ACTIVITY_LABEL_MAX = 80;

function monthActivityNameKey(ru: string, en: string): string {
  return `${ru.toLocaleLowerCase()}|${en.toLocaleLowerCase()}`;
}

function normalizeMonthActivities(value: unknown): MonthActivity[] {
  if (!Array.isArray(value)) return [];
  const result: MonthActivity[] = [];
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const ru = (
      trimmedField(raw, "ru") || trimmedField(raw, "label")
    ).slice(0, MONTH_ACTIVITY_LABEL_MAX);
    const en = trimmedField(raw, "en").slice(0, MONTH_ACTIVITY_LABEL_MAX);
    if (!ru && !en) continue;
    const nameKey = monthActivityNameKey(ru, en);
    if (usedNames.has(nameKey)) continue;
    let id =
      typeof raw.id === "string" && raw.id.startsWith("ma-") && raw.id.length > 3
        ? raw.id
        : createMonthActivityId();
    if (usedIds.has(id)) id = createMonthActivityId();
    usedIds.add(id);
    usedNames.add(nameKey);
    const activity: MonthActivity = { id, ru, en };
    const logo = normalizeLogo(raw.logo);
    if (logo) activity.logo = logo;
    result.push(activity);
  }
  return result;
}

function normalizeMonthKindLogos(
  value: unknown
): Partial<Record<DayKind, string>> {
  const result: Partial<Record<DayKind, string>> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!isDayKind(key)) continue;
    const logo = normalizeLogo(raw);
    if (logo) result[key] = logo;
  }
  return result;
}

function normalizeFlights(value: unknown): Record<string, FlightDest> {
  const result: Record<string, FlightDest> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || !key.trim()) continue;
    const dest = normalizeFlightDest(raw);
    if (dest) result[key.trim()] = dest;
  }
  return result;
}

function normalizeTrains(value: unknown): Record<string, FlightDest> {
  return normalizeFlights(value);
}

function normalizeFlightWord(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, FLIGHT_DEST_MAX);
}

/** Accepts a legacy string or `{ ru, en }`. A lone string is copied to both languages. */
export function normalizeFlightDest(value: unknown): FlightDest | null {
  if (typeof value === "string") {
    const text = normalizeFlightWord(value);
    if (!text) return null;
    return { ru: text, en: text };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rec = value as { ru?: unknown; en?: unknown };
  const ru = normalizeFlightWord(rec.ru);
  const en = normalizeFlightWord(rec.en);
  if (!ru && !en) return null;
  return { ru, en };
}

function isValidCalendarEntry(
  kind: unknown,
  customIds: Set<string>
): kind is string {
  if (typeof kind !== "string" || !kind.trim()) return false;
  if (isDayKind(kind) || kind === "flight" || kind === "train" || customIds.has(kind)) return true;
  return false;
}

function normalizeCalendar(
  value: unknown,
  monthActivities: MonthActivity[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!value || typeof value !== "object") return result;
  const customIds = new Set(monthActivities.map((activity) => activity.id));

  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || !key.trim()) continue;

    // Migration from v1: single string kind → array.
    if (typeof raw === "string") {
      if (isValidCalendarEntry(raw, customIds)) {
        result[key] = [raw];
      } else if (raw === "match") {
        result[key] = ["home"];
      }
      continue;
    }

    if (!Array.isArray(raw)) continue;
    const entries: string[] = [];
    for (const kind of raw) {
      if (isValidCalendarEntry(kind, customIds)) {
        entries.push(kind);
      } else if (kind === "match") {
        entries.push("home");
      }
    }
    if (entries.length) result[key] = entries;
  }
  return result;
}

function normalizeMonthActivityOrder(
  value: unknown,
  monthActivities: MonthActivity[]
): string[] {
  const customIds = new Set(monthActivities.map((activity) => activity.id));
  const valid = new Set<string>([...DAY_KINDS, "flight", "train", ...customIds]);

  const incoming = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && valid.has(item))
    : [];

  const result: string[] = [];
  const used = new Set<string>();
  for (const id of incoming) {
    if (used.has(id)) continue;
    used.add(id);
    result.push(id);
  }
  // Append any missing built-in kinds and custom activities at the end.
  for (const id of [...DAY_KINDS, "flight", "train", ...customIds]) {
    if (!used.has(id)) {
      result.push(id);
      used.add(id);
    }
  }
  return result;
}

function trimmedField(raw: Record<string, unknown>, key: string): string {
  return typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
}

/**
 * Shared normalizer for id-keyed library lists (activities / splits / teams).
 * Missing field → defaults; present array (even empty) → respected as-is.
 * `build` returns the item or `null` to skip the entry.
 */
function normalizeLibraryList<T extends { id: string }>(
  value: unknown,
  options: {
    defaults: () => T[];
    build: (
      raw: Record<string, unknown>,
      context: { result: T[]; defaults: T[]; usedIds: Set<string> }
    ) => T | null;
  }
): T[] {
  if (!Array.isArray(value)) return cloneData(options.defaults());
  const result: T[] = [];
  const usedIds = new Set<string>();
  const defaults = options.defaults();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const built = options.build(item as Record<string, unknown>, {
      result,
      defaults,
      usedIds,
    });
    if (built) result.push(built);
  }
  return result;
}

function normalizeActivities(value: unknown): ActivityItem[] {
  return normalizeLibraryList<ActivityItem>(value, {
    defaults: () => DEFAULT_ACTIVITIES,
    build: (raw, { result, defaults }) => {
      const ru = trimmedField(raw, "ru");
      const en = trimmedField(raw, "en");
      if (!ru && !en) return null;
      const id = typeof raw.id === "string" && raw.id ? raw.id : createActivityId();
      const fallback = defaults.find((activity) => activity.id === id);
      const group = trimmedField(raw, "group");
      return {
        id,
        ru,
        en,
        ...(group ? { group } : {}),
        color:
          normalizeRowColor(raw.color) ||
          fallback?.color ||
          nextUnusedRowColor(result.map((activity) => activity.color)),
      };
    },
  });
}

function normalizeSplits(value: unknown): SplitItem[] {
  return normalizeLibraryList<SplitItem>(value, {
    defaults: () => DEFAULT_SPLITS,
    build: (raw, { defaults }) => {
      const ru = trimmedField(raw, "ru");
      const en = trimmedField(raw, "en");
      if (!ru && !en) return null;
      const id = typeof raw.id === "string" && raw.id ? raw.id : createSplitId();
      const fallback = defaults.find((split) => split.id === id);
      return {
        id,
        ru,
        en,
        color: normalizeRowColor(raw.color) || fallback?.color || "",
      };
    },
  });
}

function normalizeTeams(value: unknown): TeamItem[] {
  return normalizeLibraryList<TeamItem>(value, {
    defaults: () => DEFAULT_TEAMS,
    build: (raw, { usedIds, defaults }) => {
      // Удалённая из приложения заглушка: вычищаем из старых сохранений.
      if (raw.id === "team-mm2") return null;
      const abbr =
        typeof raw.abbr === "string"
          ? raw.abbr.trim().slice(0, 3).toUpperCase()
          : "";
      const ru = trimmedField(raw, "ru");
      const en = trimmedField(raw, "en");
      if (!abbr && !ru && !en) return null;
      let id = typeof raw.id === "string" && raw.id ? raw.id : createTeamId();
      if (usedIds.has(id)) id = createTeamId();
      usedIds.add(id);
      const mark =
        typeof raw.mark === "string" && TEAM_MARK_SET.has(raw.mark)
          ? (raw.mark as TeamMark)
          : "letter";
      const team: TeamItem = {
        id,
        abbr: abbr || (ru || en).slice(0, 3).toUpperCase(),
        ru: ru || en || abbr,
        en: en || ru || abbr,
        color: normalizeHexColor(raw.color),
        color2: normalizeHexColor(raw.color2, "#ffffff"),
        mark,
      };
      // Свой логотип приоритетнее; иначе — встроенный логотип команды.
      const fallback = defaults.find((entry) => entry.id === id);
      const logo = normalizeLogo(raw.logo) ?? fallback?.logo;
      if (logo) team.logo = logo;
      return team;
    },
  });
}

const TEAM_MARK_SET = new Set<string>(TEAM_MARKS);

function normalizeHexColor(value: unknown, fallback = "#1565c0"): string {
  if (typeof value !== "string") return fallback;
  const hex = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  return fallback;
}

function normalizeLogo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const logo = value.trim();
  if (logo.startsWith("data:image/")) return logo;
  return undefined;
}

function normalizeTemplates(
  value: unknown,
  roster: RosterPlayer[],
  fallbackGroups: DayGroups
): DayTemplate[] {
  if (!Array.isArray(value)) return [];
  const result: DayTemplate[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Partial<DayTemplate>;
    const nameRu = typeof raw.nameRu === "string" ? raw.nameRu.trim() : "";
    const nameEn = typeof raw.nameEn === "string" ? raw.nameEn.trim() : "";
    if (!nameRu && !nameEn) continue;
    const day = normalizeDay(
      {
        id: "tpl-normalize",
        date: "",
        schedule: raw.schedule,
        groups: raw.groups,
        groupsLabelRu: raw.groupsLabelRu,
        groupsLabelEn: raw.groupsLabelEn,
      },
      roster,
      fallbackGroups,
      [emptyScheduleRow()]
    );
    result.push({
      id: typeof raw.id === "string" && raw.id ? raw.id : createTemplateId(),
      nameRu: nameRu || nameEn,
      nameEn: nameEn || nameRu,
      schedule: day.schedule,
      groups: day.groups,
      groupsLabelRu: day.groupsLabelRu,
      groupsLabelEn: day.groupsLabelEn,
    });
  }
  return result;
}

function normalizeMatches(value: unknown): Record<string, MatchInfo> {
  const result: Record<string, MatchInfo> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || !key.trim()) continue;
    if (!raw || typeof raw !== "object") continue;
    const m = raw as Record<string, unknown>;
    const opponent =
      typeof m.opponent === "string" ? m.opponent.slice(0, 3).toUpperCase() : "";
    const teamId = typeof m.teamId === "string" && m.teamId ? m.teamId : undefined;
    result[key] = teamId ? { opponent, teamId } : { opponent };
  }
  return result;
}

export function normalizeData(data: unknown): ScheduleStore {
  const base = cloneData(DEFAULT_DATA);
  if (!data || typeof data !== "object") return base;

  const source = data as ScheduleStore & { roster?: unknown };

  const roster = normalizeRoster(source.roster);
  // Demo day-groups belong only to files that never had a roster; a real
  // (even empty) roster must not pull the 21 sample players into groups.
  const fallbackGroups: DayGroups = Array.isArray(source.roster)
    ? BLANK_GROUPS
    : SAMPLE_GROUPS;

  // Pull players from old day groups shaped as {ru,en} into roster
  if (Array.isArray(source.days)) {
    for (const day of source.days) {
      const groups = day?.groups as unknown as Record<string, unknown> | undefined;
      if (!groups) continue;
      for (const key of ["group1", "group2", "goalies", "goalie"] as const) {
        const list = groups[key];
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          if (item && typeof item === "object" && !("id" in (item as object) && typeof (item as { id: unknown }).id === "string" && roster.some((p) => p.id === (item as { id: string }).id))) {
            if (typeof item === "object" && ("ru" in item || "en" in item)) {
              ensureRosterPlayer(roster, item as { ru?: string; en?: string });
            }
          }
        }
      }
    }
  }

  const days = Array.isArray(source.days)
    ? source.days.map((day) =>
        // A day entry of a real file never falls back to the demo schedule.
        normalizeDay(day, roster, fallbackGroups, blankSchedule())
      )
    : base.days;

  const activeDayId =
    typeof source.activeDayId === "string" &&
    days.some((day) => day.id === source.activeDayId)
      ? source.activeDayId
      : days[0]?.id ?? "";

  const monthActivities = normalizeMonthActivities(
    (source as { monthActivities?: unknown }).monthActivities
  );
  const monthActivityOrder = normalizeMonthActivityOrder(
    (source as { monthActivityOrder?: unknown }).monthActivityOrder,
    monthActivities
  );
  const monthKindLogos = normalizeMonthKindLogos(
    (source as { monthKindLogos?: unknown }).monthKindLogos
  );
  const calendar = normalizeCalendar(
    (source as { calendar?: unknown }).calendar,
    monthActivities
  );

  const flights = normalizeFlights(
    (source as { flights?: unknown }).flights
  );
  const trains = normalizeTrains(
    (source as { trains?: unknown }).trains
  );
  const monthWatermark =
    typeof (source as { monthWatermark?: unknown }).monthWatermark === "boolean"
      ? (source as { monthWatermark: boolean }).monthWatermark
      : true;
  const matches = normalizeMatches(
    (source as { matches?: unknown }).matches
  );
  const teams = normalizeTeams((source as { teams?: unknown }).teams);
  // Clear match references to teams that no longer exist.
  const teamIds = new Set(teams.map((team) => team.id));
  for (const match of Object.values(matches)) {
    if (match.teamId && !teamIds.has(match.teamId)) delete match.teamId;
  }

  const activities = normalizeActivities(
    (source as { activities?: unknown }).activities
  );
  const splits = normalizeSplits((source as { splits?: unknown }).splits);
  const templates = normalizeTemplates(
    (source as { templates?: unknown }).templates,
    roster,
    fallbackGroups
  );

  return {
    version: SCHEMA_VERSION,
    activeDayId,
    roster,
    days,
    calendar,
    monthActivities,
    monthActivityOrder,
    monthKindLogos,
    flights,
    trains,
    monthWatermark,
    matches,
    teams,
    activities,
    splits,
    templates,
  };
}

export function loadData(): ScheduleStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeData(JSON.parse(raw));
    return cloneData(DEFAULT_DATA);
  } catch {
    return cloneData(DEFAULT_DATA);
  }
}

export function saveData(data: ScheduleStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActiveDay(store: ScheduleStore): TrainingDay {
  return store.days.find((day) => day.id === store.activeDayId) || store.days[0];
}

export function findDayByDate(
  store: ScheduleStore,
  date: string
): TrainingDay | undefined {
  const key = date.trim();
  if (!key) return undefined;
  return store.days.find((day) => day.date.trim() === key);
}

export function resolvePlayers(
  ids: string[] | undefined,
  roster: RosterPlayer[]
): RosterPlayer[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => roster.find((player) => player.id === id))
    .filter((player): player is RosterPlayer => Boolean(player));
}

/* ------------------------------------------------------------------ */
/* Generic library-item mutations (pure; used by the action hooks).    */
/* ------------------------------------------------------------------ */

export type LibraryCollectionKey =
  | "activities"
  | "splits"
  | "teams"
  | "templates"
  | "roster";

type LibraryItemMap = {
  activities: ActivityItem;
  splits: SplitItem;
  teams: TeamItem;
  templates: DayTemplate;
  roster: RosterPlayer;
};

/** Item type of a library collection (used by the action hooks). */
export type LibraryItem<K extends LibraryCollectionKey = LibraryCollectionKey> =
  LibraryItemMap[K];

/** Fields removed (not set to "") when patched with an empty/blank value. */
const BLANK_DROPPED_FIELDS: Record<LibraryCollectionKey, string[]> = {
  activities: ["group"],
  splits: [],
  teams: ["logo"],
  templates: [],
  roster: [],
};

/** String field shape enforcement applied on patch (no trimming: that
 * would move the caret while typing; normalizeData trims on load instead). */
const FIELD_TRANSFORMS: Partial<
  Record<LibraryCollectionKey, Record<string, (value: string) => string>>
> = {
  teams: { abbr: (value) => value.slice(0, 3).toUpperCase() },
};

/**
 * Patch one library item by id in place. Fields that are `undefined` in the
 * patch are left untouched; blank optional fields listed in
 * BLANK_DROPPED_FIELDS are deleted. No trimming here — trimming input would
 * jump the caret while typing (it happens in normalizeData on load instead).
 */
export function patchItem<K extends LibraryCollectionKey>(
  store: ScheduleStore,
  collection: K,
  id: string,
  patch: Partial<LibraryItemMap[K]>
): void {
  const list = store[collection] as unknown as { id: string }[] | undefined;
  const item = list?.find((entry) => entry.id === id) as
    | Record<string, unknown>
    | undefined;
  if (!item) return;
  const dropWhenBlank = BLANK_DROPPED_FIELDS[collection];
  const transforms = FIELD_TRANSFORMS[collection];
  for (const [field, value] of Object.entries(
    patch as Record<string, unknown>
  )) {
    if (value === undefined) continue;
    if (dropWhenBlank.includes(field) && !String(value).trim()) {
      delete item[field];
    } else if (transforms?.[field] && typeof value === "string") {
      item[field] = transforms[field](value);
    } else {
      item[field] = value;
    }
  }
}

/**
 * Remove one library item by id in place, keeping referential integrity:
 * roster removals purge the player from every day's groups, team removals
 * clear dangling matches[*].teamId references.
 */
export function removeItem(
  store: ScheduleStore,
  collection: LibraryCollectionKey,
  id: string
): void {
  if (collection === "roster") {
    store.roster = store.roster.filter((player) => player.id !== id);
    for (const day of store.days) {
      for (const key of ["group1", "group2"] as const) {
        day.groups[key] = day.groups[key].filter((playerId) => playerId !== id);
      }
    }
    for (const template of store.templates) {
      for (const key of ["group1", "group2"] as const) {
        template.groups[key] = template.groups[key].filter(
          (playerId) => playerId !== id
        );
      }
    }
    return;
  }
  if (collection === "teams") {
    store.teams = store.teams.filter((team) => team.id !== id);
    for (const match of Object.values(store.matches)) {
      if (match.teamId === id) delete match.teamId;
    }
    return;
  }
  if (collection === "activities") {
    store.activities = store.activities.filter((item) => item.id !== id);
    return;
  }
  if (collection === "splits") {
    store.splits = store.splits.filter((item) => item.id !== id);
    return;
  }
  store.templates = store.templates.filter((item) => item.id !== id);
}
