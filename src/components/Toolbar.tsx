import { useMemo, useState } from "react";
import type { UiStrings } from "../i18n/ui";
import type { AppView, Lang, TrainingDay } from "../data/types";
import type { SyncState } from "../data/yandexSync";
import { hasYandexToken } from "../data/yandexSync";
import type { ExportKind } from "../utils/exportDocument";
import { ExportMenu } from "./ExportMenu";
import { compareDateRu, parseDateRuToLocal, startOfLocalDay } from "../utils/dates";
import {
  ChatIcon,
  ExternalIcon,
  EyeIcon,
  HistoryIcon,
  RedoIcon,
  SettingsIcon,
  UndoIcon,
} from "./icons";

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
  hasGroups: boolean;
  exporting: boolean;
  lastSyncAt: number | null;
  onSyncNow: () => void;
  onExport: (kind: ExportKind) => void;
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
  hasGroups,
  exporting,
  onExport,
  lastSyncAt,
  onSyncNow,
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
                className="btn btn-ghost btn-past"
                aria-pressed={showPast}
                title={showPast ? ui.hidePastDays : ui.showPastDays}
                aria-label={showPast ? ui.hidePastDays : ui.showPastDays}
                onClick={toggleShowPast}
              >
                <HistoryIcon />
                <span className="btn-label">
                  {showPast ? ui.hidePastDays : ui.showPastDays}
                </span>
              </button>
            )}
          </>
        )}

        {sync !== "idle" && (
          <button
            type="button"
            className={`sync-badge${conflict ? " is-conflict" : localOnly ? " is-local" : ""}`}
            title={
              conflict
                ? ui.syncConflict
                : localOnly
                  ? ui.syncLocalOnly
                  : `${ui.syncSaved}${
                      lastSyncAt
                        ? " · " +
                          new Date(lastSyncAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""
                    } — ${ui.syncNow}`
            }
            onClick={onSyncNow}
          >
            {conflict
              ? ui.syncBadgeConflict
              : localOnly
                ? ui.syncBadgeLocal
                : `${ui.syncBadgeSynced}${
                    lastSyncAt
                      ? " · " +
                        new Date(lastSyncAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }`}
          </button>
        )}
      </div>

      <div className="toolbar-actions">
        {view !== "library" && (
          <button
            type="button"
            className={`btn btn-icon-text${preview ? " is-active" : ""}`}
            aria-pressed={preview}
            title={ui.preview}
            onClick={onPreviewToggle}
          >
            <EyeIcon />
            <span className="btn-label">{ui.preview}</span>
          </button>
        )}

        <div className="btn-group" role="group" aria-label={`${ui.undoLabel} / ${ui.redoLabel}`}>
          <button
            type="button"
            className="btn btn-icon"
            disabled={!canUndo}
            title={ui.undoLabel}
            aria-label={ui.undoLabel}
            onClick={onUndo}
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            className="btn btn-icon"
            disabled={!canRedo}
            title={ui.redoLabel}
            aria-label={ui.redoLabel}
            onClick={onRedo}
          >
            <RedoIcon />
          </button>
        </div>

        <ExportMenu
          ui={ui}
          view={view}
          hasGroups={hasGroups}
          busy={exporting}
          onExport={onExport}
        />

        {isDay && (
          <div className="btn-group btn-group-whatsapp" role="group">
            <button
              type="button"
              className="btn btn-whatsapp btn-icon-text"
              title={ui.whatsappCopied}
              onClick={onWhatsAppCopy}
            >
              <ChatIcon />
              <span className="btn-label">{ui.whatsappCopy}</span>
            </button>
            <button
              type="button"
              className="btn btn-whatsapp-outline btn-icon"
              title={ui.whatsappOpen}
              aria-label={ui.whatsappOpen}
              onClick={onWhatsAppOpen}
            >
              <ExternalIcon />
            </button>
          </div>
        )}

        <span className="toolbar-sep" aria-hidden="true" />
        <button
          type="button"
          className={`btn btn-icon${noToken ? " btn-attention" : ""}`}
          title={noToken ? `${ui.settings} — ${ui.syncLocalOnly}` : ui.settings}
          aria-label={ui.settings}
          onClick={onOpenSettings}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}
