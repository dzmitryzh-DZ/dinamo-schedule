import type { Lang } from "../data/types";
import { ROW_COLORS } from "../utils/rowColors";

type Props = {
  value: string | undefined;
  onChange: (color: string) => void;
  title: string;
  className?: string;
  lang: Lang;
};

export function RowColorPicker({
  value = "",
  onChange,
  title,
  className,
  lang,
}: Props) {
  return (
    <select
      className={["row-color-picker", value ? `row-color-${value}` : "", className]
        .filter(Boolean)
        .join(" ")}
      value={value}
      aria-label={title}
      title={title}
      onChange={(e) => onChange(e.target.value)}
    >
      {ROW_COLORS.map((c) => (
        <option key={c.key || "clear"} value={c.key}>
          {lang === "en" ? c.labelEn : c.label}
        </option>
      ))}
    </select>
  );
}
