import { useRef, useState, type DragEvent, type ReactNode, type RefObject } from "react";
import type { UiStrings } from "../i18n/ui";
import type {
  ActivityItem,
  DayTemplate,
  Lang,
  ScheduleRow,
  SplitItem,
  TrainingDay,
} from "../data/types";
import { DocumentHeader } from "./DocumentHeader";
import { ActivitySelect } from "./ActivitySelect";
import { SplitSelect } from "./SplitSelect";
import { RowColorPicker } from "./RowColorPicker";
import { DayActions } from "./DayActions";
import { rowColorClass } from "../utils/rowColors";
import { bilingualText, isBlankScheduleRow } from "../utils/localize";

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  date: string;
  gameDay?: boolean;
  schedule: ScheduleRow[];
  activities: ActivityItem[];
  splits: SplitItem[];
  days: TrainingDay[];
  templates: DayTemplate[];
  activeDayId: string;
  sheetRef: RefObject<HTMLElement | null>;
  onDateChange: (value: string) => void;
  onGameDayChange?: (value: boolean) => void;
  onRowChange: (index: number, field: keyof ScheduleRow, value: string) => void;
  onRemoveRow: (index: number) => void;
  onMoveRow: (from: number, to: number) => void;
  onAddRow: () => void;
  onAddSplitRow?: () => void;
  onCopySchedule?: () => void;
  onAddDay: () => void;
  onAddNext10Days: () => void;
  onPullFromDay: (sourceDayId: string) => void;
  onPullFromTemplate: (templateId: string) => void;
  onSaveAsTemplate: (name: string) => void;
  onRemoveDay: () => void;
};

export function ScheduleSheet({
  ui,
  lang,
  editing,
  date,
  gameDay,
  schedule,
  activities,
  splits,
  days,
  templates,
  activeDayId,
  sheetRef,
  onDateChange,
  onGameDayChange,
  onRowChange,
  onRemoveRow,
  onMoveRow,
  onAddRow,
  onAddSplitRow,
  onAddDay,
  onAddNext10Days,
  onPullFromDay,
  onPullFromTemplate,
  onSaveAsTemplate,
  onRemoveDay,
}: Props) {
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleDragStart(event: DragEvent, index: number) {
    dragFrom.current = index;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOver !== index) setDragOver(index);
  }

  function handleDrop(index: number) {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragOver(null);
    if (from == null || from === index) return;
    onMoveRow(from, index);
  }

  function handleDragEnd() {
    dragFrom.current = null;
    setDragOver(null);
  }

  function editRowClass(index: number, row: ScheduleRow, extra = "") {
    return [
      dragOver === index ? "drag-over" : "",
      rowColorClass(row.color),
      extra,
    ]
      .filter(Boolean)
      .join(" ");
  }

  /** Shared action cell for both edit-row variants; toggle sits after ▲▼. */
  function renderRowActions(index: number, row: ScheduleRow, isSplit: boolean) {
    return (
      <td className="col-actions">
        <div className="row-actions">
          <span
            className="drag-handle"
            title={ui.moveRow}
            aria-label={ui.moveRow}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
          >
            ⋮⋮
          </span>
          <RowColorPicker
            lang={lang}
            title={ui.color}
            value={row.color}
            onChange={(color) => onRowChange(index, "color", color)}
          />
          <button
            type="button"
            className="row-btn row-btn-move"
            title={ui.moveUp}
            aria-label={ui.moveUp}
            disabled={index === 0}
            onClick={() => onMoveRow(index, index - 1)}
          >
            ▲
          </button>
          <button
            type="button"
            className="row-btn row-btn-move"
            title={ui.moveDown}
            aria-label={ui.moveDown}
            disabled={index === schedule.length - 1}
            onClick={() => onMoveRow(index, index + 1)}
          >
            ▼
          </button>
          <button
            type="button"
            className="row-btn row-btn-move"
            title={ui.toggleSplitRow}
            aria-label={ui.toggleSplitRow}
            onClick={() => onRowChange(index, "kind", isSplit ? "" : "split")}
          >
            ▬
          </button>
          <button
            type="button"
            className="row-btn"
            title={ui.remove}
            aria-label={ui.remove}
            onClick={() => onRemoveRow(index)}
          >
            ×
          </button>
        </div>
      </td>
    );
  }

  function renderEditRow(row: ScheduleRow, index: number): ReactNode {
    if (row.kind === "split") {
      return (
        <tr
          key={row.id}
          className={editRowClass(index, row, "schedule-split-edit")}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
        >
          <td className="col-time" />
          <td colSpan={2} className="col-activity-split">
            <SplitSelect
              row={row}
              splits={splits}
              placeholder={ui.selectSplit}
              onSelect={(split) => {
                onRowChange(index, "activityRu", split.ru);
                onRowChange(index, "activityEn", split.en);
                if (split.color) onRowChange(index, "color", split.color);
              }}
            />
          </td>
          {renderRowActions(index, row, true)}
        </tr>
      );
    }
    return (
      <tr
        key={row.id}
        className={editRowClass(index, row)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={() => handleDrop(index)}
        onDragEnd={handleDragEnd}
      >
        <td className="col-time">
          <input
            value={row.time}
            onChange={(e) => onRowChange(index, "time", e.target.value)}
          />
        </td>
        <td>
          <ActivitySelect
            row={row}
            activities={activities}
            placeholder={ui.typeActivity}
            onSelect={(activity) => {
              onRowChange(index, "activityRu", activity.ru);
              onRowChange(index, "activityEn", activity.en);
              if (activity.color) onRowChange(index, "color", activity.color);
            }}
          />
        </td>
        <td className="col-note">
          <div className="player-fields">
            <input
              value={row.noteRu}
              placeholder="RU"
              aria-label="RU"
              onChange={(e) => onRowChange(index, "noteRu", e.target.value)}
            />
            <input
              className="en-field"
              value={row.noteEn}
              placeholder="EN"
              aria-label="EN"
              onChange={(e) => onRowChange(index, "noteEn", e.target.value)}
            />
          </div>
        </td>
        {renderRowActions(index, row, false)}
      </tr>
    );
  }

  function renderViewRow(row: ScheduleRow): ReactNode {
    if (row.kind === "split") {
      return (
        <tr key={row.id} className={rowColorClass(row.color)}>
          <td colSpan={4} className="schedule-split-row">
            <span className="split-label">
              {bilingualText(row.activityRu, row.activityEn)}
            </span>
          </td>
        </tr>
      );
    }

    return (
      <tr key={row.id} className={rowColorClass(row.color)}>
        <td className="col-time">{row.time}</td>
        <td className="col-activity-ru">{row.activityRu}</td>
        <td className="col-activity-en">{row.activityEn}</td>
        <td className="col-note col-note-bilingual">
          <div className="bilingual-note">{bilingualText(row.noteRu, row.noteEn)}</div>
        </td>
      </tr>
    );
  }

  return (
    <article className="sheet sheet-schedule" ref={sheetRef}>
      <DocumentHeader
        ui={ui}
        title={ui.titleBilingual}
        date={date}
        editing={editing}
        onDateChange={onDateChange}
        gameDay={gameDay}
        onGameDayChange={onGameDayChange}
      />
      <div className="content">
        <div className="section-header">
          <p className="section-label">{ui.scheduleLabel}</p>
          {editing && (
            <div className="section-header-actions no-print">
              <DayActions
                ui={ui}
                lang={lang}
                days={days}
                templates={templates}
                activeDayId={activeDayId}
                onAddDay={onAddDay}
                onAddNext10Days={onAddNext10Days}
                onPullFromDay={onPullFromDay}
                onPullFromTemplate={onPullFromTemplate}
                onSaveAsTemplate={onSaveAsTemplate}
                onRemoveDay={onRemoveDay}
              />
            </div>
          )}
        </div>
        <table className="schedule">
          <tbody>
            {schedule.map((row, index) => {
              if (editing) return renderEditRow(row, index);
              if (isBlankScheduleRow(row)) return null;
              return renderViewRow(row);
            })}
          </tbody>
        </table>
        {editing && (
          <div className="schedule-add-actions">
            <button type="button" className="btn add-row" onClick={onAddRow}>
              {ui.addRow}
            </button>
            {onAddSplitRow && (
              <button
                type="button"
                className="btn add-row"
                onClick={onAddSplitRow}
              >
                {ui.addSplitRow}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
