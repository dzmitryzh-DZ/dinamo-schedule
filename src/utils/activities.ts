import { DAY_KINDS, isDayKind, type ActivityItem, type DayKind } from "../data/types";
import { bilingualText } from "./localize";

/**
 * Order for dropdown suggestions: ungrouped activities first, then groups
 * alphabetically; within a group the original library order is kept.
 */
export function sortActivitiesByGroup(
  activities: ActivityItem[]
): ActivityItem[] {
  return activities
    .map((activity, index) => ({ activity, index }))
    .sort((a, b) => {
      const groupA = a.activity.group?.trim() ?? "";
      const groupB = b.activity.group?.trim() ?? "";
      if (!groupA && !groupB) return a.index - b.index;
      if (!groupA) return -1;
      if (!groupB) return 1;
      const byGroup = groupA.localeCompare(groupB, "ru");
      return byGroup || a.index - b.index;
    })
    .map(({ activity }) => activity);
}

/**
 * Exact (case-insensitive) match of free-typed text against the activity
 * library: by Russian name, English name, or the combined "RU / EN" label
 * used by the datalist suggestions.
 */
export function matchActivity(
  activities: ActivityItem[],
  text: string
): ActivityItem | undefined {
  const norm = text.trim().toLowerCase();
  if (!norm) return undefined;
  return activities.find((activity) =>
    [activity.ru, activity.en, bilingualText(activity.ru, activity.en)].some(
      (value) => value.trim().toLowerCase() === norm
    )
  );
}

/** All identifiers that can appear inside a calendar day entry. */
export const MONTH_CALENDAR_ACTIVITY_KINDS = [...DAY_KINDS, "flight", "train"] as const;

/** Check whether a value is a built-in month-calendar activity id. */
export function isMonthCalendarKind(value: string): value is (typeof MONTH_CALENDAR_ACTIVITY_KINDS)[number] | DayKind {
  return isDayKind(value) || value === "flight" || value === "train";
}
