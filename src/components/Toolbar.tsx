import { useMemo, useState } from "react";
import type { UiStrings } from "../i18n/ui";
import type { AppView, Lang, TrainingDay } from "../data/types";
import type { SyncState } from "../data/yandexSync";
import { hasYandexToken } from "../data/yandexSync";
import { compareDateRu, parseDateRuToLocal, startOfLocalDay } from "../utils/dates";

const SHOW_PAST_KEY = "dinamo-schedule-show-past";

function readShowPast(): boolean {
  try {
    return localStorage.getItem(SHOW_PAST_KEY) === "1";
  } catch {
    return false;
  }
}

type Props = {
  ui: UiStrings;
  lang: Lang;
  view: AppView;
  sync: SyncState;
  preview: boolean;
  days: TrainingDay[];
  activeDayId: string;
  onViewChange: (view: AppView) => void;
  onLangChange: (lang: Lang) => void;
  onDayChange: (id: string) => void;
  onWhatsAppCopy: () => void;
  onWhatsAppOpen: () => void;
  onPreviewToggle: () => void;
  onOpenSettings: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function Toolbar({
  ui,
  lang,
  view,
  sync,
  preview,
  days,
  activeDayId,
  onViewChange,
  onLangChange,
  onDayChange,
  onWhatsAppCopy,
  onWhatsAppOpen,
  onPreviewToggle,
  onOpenSettings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  const sorted = useMemo(
    () => [...days].sort((a, b) => compareDateRu(a.date, b.date)),
    [days]
  );
  const [showPast, setShowPast] = useState<boolean>(readShowPast);

  const visibleDays = useMemo(() => {
    if (showPast) return sorted;
    const todayStart = startOfLocalDay();
    return sorted.filter((day) => {
      if (day.id === activeDayId) return true;
      const local = parseDateRuToLocal(day.date);
      if (!local) return true;
      return local >= todayStart;
    });
  }, [sorted, showPast, activeDayId]);

  const hasHiddenPast = useMemo(() => {
    const todayStart = startOfLocalDay();
    return sorted.some((day) => {
      if (day.id === activeDayId) return false;
      const local = parseDateRuToLocal(day.date);
      return local !== null && local < todayStart;
    });
  }, [sorted, activeDayId]);

  function toggleShowPast() {
    const next = !showPast;
    setShowPast(next);
    try {
      localStorage.setItem(SHOW_PAST_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }

  const isDay = view === "day";
  const conflict = sync === "conflict";
  const localOnly = !conflict && (sync === "local-only" || sync === "error");
  const noToken = !hasYandexToken();

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <nav className="lang-switch" aria-label={ui.languageLabel}>
          <button
            type="button"
            className={lang === "ru" ? "active" : undefined}
            onClick={() => onLangChange("ru")}
          >
            RU
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : undefined}
            onClick={() => onLangChange("en")}
          >
            EN
          </button>
        </nav>

        <nav className="view-switch" aria-label={ui.viewLabel}>
          <button
            type="button"
            className={view === "day" ? "active" : undefined}
            onClick={() => onViewChange("day")}
          >
            {ui.tabDay}
          </button>
          <button
            type="button"
            className={view === "month" ? "active" : undefined}
            onClick={() => onViewChange("month")}
          >
            {ui.tabMonth}
          </button>
        </nav>

        {isDay && (
          <>
            <label className="day-picker">
              <span className="day-picker-label">{ui.dayLabel}</span>
              <select
                value={activeDayId}
                onChange={(e) => onDayChange(e.target.value)}
                aria-label={ui.dayLabel}
              >
                {visibleDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.date.trim() || ui.untitledDay}
                  </option>
                ))}
              </select>
            </label>
            {hasHiddenPast && (
              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={showPast}
                title={showPast ? ui.hidePastDays : ui.showPastDays}
                aria-label={showPast ? ui.hidePastDays : ui.showPastDays}
                onClick={toggleShowPast}
              >
                {showPast ? ui.hidePastDays : ui.showPastDays}
              </button>
            )}
          </>
        )}

        {sync !== "idle" && (
          <span
            className={`sync-badge${conflict ? " is-conflict" : localOnly ? " is-local" : ""}`}
            title={
              conflict
                ? ui.syncConflict
                : localOnly
                  ? ui.syncLocalOnly
                  : ui.syncSaved
            }
          >
            {conflict
              ? ui.syncBadgeConflict
              : localOnly
                ? ui.syncBadgeLocal
                : ui.syncBadgeSynced}
          </span>
        )}
      </div>

      <div className="toolbar-actions">
        {isDay && (
          <>
            <button
              type="button"
              className="btn btn-whatsapp"
              title={ui.whatsappCopied}
              onClick={onWhatsAppCopy}
            >
              {ui.whatsappCopy}
            </button>
            <button
              type="button"
              className="btn btn-whatsapp-outline"
              title={ui.whatsappOpen}
              aria-label={ui.whatsappOpen}
              onClick={onWhatsAppOpen}
            >
              ↗
            </button>
          </>
        )}
        <button
          type="button"
          className={`btn${preview ? " is-active" : ""}`}
          aria-pressed={preview}
          onClick={onPreviewToggle}
        >
          {ui.preview}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!canUndo}
          title={ui.undoLabel}
          aria-label={ui.undoLabel}
          onClick={onUndo}
        >
          ↶
        </button>
        <button
          type="button"
          className="btn"
          disabled={!canRedo}
          title={ui.redoLabel}
          aria-label={ui.redoLabel}
          onClick={onRedo}
        >
          ↷
        </button>
        <span className="toolbar-sep" aria-hidden="true" />
        <button
          type="button"
          className={`btn${noToken ? " btn-attention" : ""}`}
          title={ui.settings}
          aria-label={ui.settings}
          onClick={onOpenSettings}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
