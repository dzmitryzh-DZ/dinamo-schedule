import type { UiStrings } from "../i18n/ui";

type Props = {
  ui: UiStrings;
  title: string;
  date: string;
  editing?: boolean;
  onDateChange?: (value: string) => void;
};

export function DocumentHeader({
  ui,
  title,
  date,
  editing = false,
  onDateChange,
}: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <img className="logo" src="/logo.png" alt={ui.club} width={56} height={56} />
        <div className="titles">
          <div className="club">{ui.club}</div>
          <div className="doc-title">{title}</div>
        </div>
      </div>
      <div className="date-block">
        <div className="date-label">{ui.dateLabel}</div>
        <div className="date-value">
          {editing ? (
            <input
              type="text"
              value={date}
              aria-label={ui.dateLabel}
              onChange={(e) => onDateChange?.(e.target.value)}
            />
          ) : (
            date
          )}
        </div>
      </div>
    </header>
  );
}
