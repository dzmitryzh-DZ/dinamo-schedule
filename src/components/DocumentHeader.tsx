import type { UiStrings } from "../i18n/ui";
import zubrLogoUrl from "../assets/zubr-logo.png";

type Props = {
  ui: UiStrings;
  title: string;
  date: string;
  editing?: boolean;
  onDateChange?: (value: string) => void;
  /** Показывать строку «ИГРОВОЙ ДЕНЬ / GAME DAY» под названием документа. */
  gameDay?: boolean;
  /** Если задан и режим редактирования — рядом с названием появляется галочка. */
  onGameDayChange?: (value: boolean) => void;
};

export function DocumentHeader({
  ui,
  title,
  date,
  editing = false,
  onDateChange,
  gameDay = false,
  onGameDayChange,
}: Props) {
  return (
    <header className="header">
      <div className="header-left">
        <img className="logo" src={zubrLogoUrl} alt={ui.club} width={56} height={56} />
        <div className="titles">
          <div className="club">{ui.club}</div>
          <div className="doc-title">{title}</div>
          {gameDay && <div className="game-day-line">{ui.gameDayBilingual}</div>}
        </div>
        {editing && onGameDayChange && (
          <label className="game-day-toggle no-print">
            <input
              type="checkbox"
              checked={gameDay}
              onChange={(e) => onGameDayChange(e.target.checked)}
            />
            <span>{ui.gameDayLabel}</span>
          </label>
        )}
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
