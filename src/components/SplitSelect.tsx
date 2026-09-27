import type { ScheduleRow, SplitItem } from "../data/types";
import { bilingualText } from "../utils/localize";

/** Synthetic option id for a row whose text matches no split in the library. */
const CURRENT_ID = "__current__";

type Props = {
  row: ScheduleRow;
  splits: SplitItem[];
  placeholder: string;
  onSelect: (split: SplitItem) => void;
};

export function SplitSelect({ row, splits, placeholder, onSelect }: Props) {
  const matched = splits.find(
    (s) => s.ru === row.activityRu && s.en === row.activityEn
  );
  // Keep the row's current text visible when it matches no library split,
  // so editing a neighbouring field never "loses" the selection.
  const currentLabel = matched ? "" : bilingualText(row.activityRu, row.activityEn);

  return (
    <select
      className="activity-select"
      value={matched?.id ?? (currentLabel ? CURRENT_ID : "")}
      aria-label={placeholder}
      onChange={(e) => {
        const split = splits.find((s) => s.id === e.target.value);
        if (split) onSelect(split);
      }}
    >
      <option value="">{placeholder}</option>
      {currentLabel && <option value={CURRENT_ID}>{currentLabel}</option>}
      {splits.map((split) => (
        <option key={split.id} value={split.id}>
          {bilingualText(split.ru, split.en)}
        </option>
      ))}
    </select>
  );
}
