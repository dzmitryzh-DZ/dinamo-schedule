import { useId } from "react";
import type { ActivityItem, ScheduleRow } from "../data/types";
import { matchActivity, sortActivitiesByGroup } from "../utils/activities";

type Props = {
  row: ScheduleRow;
  activities: ActivityItem[];
  placeholder: string;
  onSelect: (activity: ActivityItem) => void;
};

/**
 * Free-text activity fields (RU + EN) with datalist suggestions from the
 * library. Typed text goes into the edited language as-is; an exact match
 * (RU, EN or the combined "RU / EN" label) fills both languages and the
 * default color.
 */
export function ActivitySelect({
  row,
  activities,
  placeholder,
  onSelect,
}: Props) {
  const ruListId = useId();
  const enListId = useId();
  const sorted = sortActivitiesByGroup(activities);

  function applyText(field: "ru" | "en", text: string) {
    const hit = matchActivity(activities, text);
    if (hit) {
      onSelect(hit);
      return;
    }
    onSelect({
      id: "",
      ru: field === "ru" ? text : row.activityRu,
      en: field === "en" ? text : row.activityEn,
    });
  }

  return (
    <div className="player-fields activity-fields">
      <input
        className="activity-input"
        list={ruListId}
        value={row.activityRu}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => applyText("ru", e.target.value)}
      />
      <datalist id={ruListId}>
        {sorted
          .filter((activity) => activity.ru.trim())
          .map((activity) => (
            <option
              key={activity.id}
              value={activity.ru}
              label={activity.group || undefined}
            />
          ))}
      </datalist>
      <input
        className="activity-input en-field"
        list={enListId}
        value={row.activityEn}
        placeholder="EN"
        aria-label={`${placeholder} (EN)`}
        onChange={(e) => applyText("en", e.target.value)}
      />
      <datalist id={enListId}>
        {sorted
          .filter(
            (activity) =>
              activity.en.trim() &&
              activity.en.trim().toLowerCase() !== activity.ru.trim().toLowerCase()
          )
          .map((activity) => (
            <option
              key={activity.id}
              value={activity.en}
              label={activity.group || undefined}
            />
          ))}
      </datalist>
    </div>
  );
}
