export type Lang = "ru" | "en";

export type RosterPlayer = {
  id: string;
  ru: string;
  en: string;
  /** Jersey / player number. */
  number: string;
  /** Position abbreviation: ВР, ЗЩ, НП. */
  position: string;
  /** Whether the player is active and shown in selection lists. */
  active?: boolean;
  /** Injured players stay in lists and are marked with a cross. */
  injured?: boolean;
};

export type ScheduleRow = {
  /** Stable row id (uuid), assigned during normalization when missing. */
  id: string;
  time: string;
  activityRu: string;
  activityEn: string;
  noteRu: string;
  noteEn: string;
  /** Optional row highlight color key. */
  color: string;
  /** Optional row kind. "split" renders as a full-width roster separator. */
  kind?: "split";
};

export type DayGroups = {
  group1: string[];
  group2: string[];
  group1NameRu: string;
  group1NameEn: string;
  group2NameRu: string;
  group2NameEn: string;
};

export type TrainingDay = {
  id: string;
  date: string;
  schedule: ScheduleRow[];
  groups: DayGroups;
  /** Custom groups section label. Falls back to ui.groupsLabel. */
  groupsLabelRu?: string;
  groupsLabelEn?: string;
};

/** Named reusable day schedule (and groups) snapshot. */
export type DayTemplate = {
  id: string;
  nameRu: string;
  nameEn: string;
  schedule: ScheduleRow[];
  groups: DayGroups;
  groupsLabelRu?: string;
  groupsLabelEn?: string;
};

export type DayKind = "training" | "home" | "away" | "off" | "recovery";

export const DAY_KINDS: readonly DayKind[] = [
  "training",
  "home",
  "away",
  "off",
  "recovery",
];

export function isDayKind(value: string): value is DayKind {
  return (DAY_KINDS as readonly string[]).includes(value);
}

/** Max letters for a flight destination stamp on a month cell. */
export const FLIGHT_DEST_MAX = 12;

/** Bilingual word (or IATA code) on the airplane stamp. */
export type FlightDest = {
  ru: string;
  en: string;
};

/** User-defined day activity for the month calendar. */
export type MonthActivity = {
  id: string;
  ru: string;
  en: string;
  /** Optional uploaded icon as a data URL. */
  logo?: string;
};

export type MatchInfo = {
  opponent: string;
  /** Optional link to a library team (logo + 3-letter abbr). */
  teamId?: string;
};

export type TeamMark =
  | "letter"
  | "anchor"
  | "star"
  | "bars"
  | "stripe"
  | "ring"
  | "diamond"
  | "bolt"
  | "wing"
  | "gear"
  | "flame"
  | "crown"
  | "wave"
  | "dragon"
  | "bear"
  | "shield"
  | "cross"
  | "hawk"
  | "wheel"
  | "ice";

export type TeamItem = {
  id: string;
  /** 1–3 letter abbreviation shown on the calendar. */
  abbr: string;
  ru: string;
  en: string;
  color: string;
  color2?: string;
  mark?: TeamMark;
  /** Optional uploaded logo as a data URL. */
  logo?: string;
};

export type ScheduleStore = {
  /** Data schema version for explicit migrations. */
  version?: number;
  activeDayId: string;
  roster: RosterPlayer[];
  days: TrainingDay[];
  /** Calendar day markers keyed by DD.MM.YYYY (built-in kind, month activity id or "flight"). */
  calendar: Record<string, string[]>;
  /** Custom day activities that can be painted on the month calendar. */
  monthActivities: MonthActivity[];
  /** Priority order of month calendar activities (kind ids, custom ids and "flight"). */
  monthActivityOrder: string[];
  /** Optional custom icons for built-in day kinds. */
  monthKindLogos: Partial<Record<DayKind, string>>;
  /** Optional flight stamps keyed by DD.MM.YYYY (RU/EN words or IATA, up to 12 letters). */
  flights: Record<string, FlightDest>;
  /** Optional train stamps keyed by DD.MM.YYYY (RU/EN words, up to 12 letters). */
  trains: Record<string, FlightDest>;
  /** Whether the Zubr watermark is shown behind the month sheet. */
  monthWatermark: boolean;
  /** Match details keyed by DD.MM.YYYY */
  matches: Record<string, MatchInfo>;
  /** Shared activity library */
  activities: ActivityItem[];
  /** Opponent teams for the month calendar */
  teams: TeamItem[];
  /** Roster split labels */
  splits: SplitItem[];
  /** Named day schedule templates */
  templates: DayTemplate[];
};

export type AppView = "day" | "month" | "library";

export type ActivityItem = {
  id: string;
  ru: string;
  en: string;
  /** Default highlight color applied when the activity is selected. */
  color?: string;
  /** User-defined group name; activities are shown grouped in the library. */
  group?: string;
};

export type SplitItem = {
  id: string;
  ru: string;
  en: string;
  /** Default highlight color applied when the split is selected. */
  color?: string;
};

export type GroupKey = "group1" | "group2";

export type GroupNameField =
  | "group1NameRu"
  | "group1NameEn"
  | "group2NameRu"
  | "group2NameEn";
