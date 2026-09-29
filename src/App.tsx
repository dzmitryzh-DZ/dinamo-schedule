import { useCallback, useRef, useState, type RefObject } from "react";
import { Toolbar } from "./components/Toolbar";
import { ScheduleSheet } from "./components/ScheduleSheet";
import { GroupsSheet } from "./components/GroupsSheet";
import { MonthCalendar } from "./components/MonthCalendar";
import { LibrarySheet } from "./components/LibrarySheet";
import { LoginGate } from "./components/LoginGate";
import { SettingsDialog } from "./components/SettingsDialog";
import { emptyScheduleRow, getActiveDay } from "./data/storage";
import type { GroupKey } from "./data/types";
import { useScheduleStore } from "./hooks/useScheduleStore";
import { useLibraryActions } from "./hooks/useLibraryActions";
import { useDayActions } from "./hooks/useDayActions";
import { isAuthenticated } from "./utils/auth";
import { formatScheduleForMessenger } from "./utils/localize";
import { ExportStage } from "./components/ExportStage";
import {
  dateStamp,
  exportKindMeta,
  slugify,
  type ExportJob,
  type ExportKind,
} from "./utils/exportDocument";
import { copyTextToClipboard, openInWhatsApp } from "./utils/whatsapp";

type DaySheetRefs = {
  schedule: RefObject<HTMLElement | null>;
  groups: RefObject<HTMLElement | null>;
};

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;
  return <ScheduleApp />;
}

function ScheduleApp() {
  const store = useScheduleStore();
  const {
    lang,
    view,
    data,
    status,
    sync,
    preview,
    editing,
    ui,
    canUndo,
    canRedo,
    undo,
    redo,
    flash,
    handleLangChange,
    handleViewChange,
    handlePreviewToggle,
    handleDayChange,
    handleReset,
    updateActiveDay,
  } = store;

  const scheduleRef = useRef<HTMLElement | null>(null);
  const groupsRef = useRef<HTMLElement | null>(null);
  const dayPageRef = useRef<HTMLDivElement | null>(null);
  const monthRef = useRef<HTMLElement | null>(null);
  const libraryRef = useRef<HTMLElement | null>(null);
  const exportScheduleRef = useRef<HTMLElement | null>(null);
  const exportGroupsRef = useRef<HTMLElement | null>(null);
  const exportCounter = useRef(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);

  const day = getActiveDay(data);
  const library = useLibraryActions(store);
  const dayActions = useDayActions(store);

  const whatsappText = useCallback(
    () => {
      const active = getActiveDay(data);
      return formatScheduleForMessenger(
        active.schedule,
        ui.titleBilingual,
        active.date,
        active.gameDay === true ? ui.gameDayBilingual : ""
      );
    },
    [data, ui.titleBilingual, ui.gameDayBilingual]
  );

  const handleWhatsAppCopy = useCallback(async () => {
    try {
      await copyTextToClipboard(whatsappText());
      flash(ui.whatsappCopied, true);
    } catch (error) {
      console.error(error);
      flash(ui.whatsappError);
    }
  }, [whatsappText, flash, ui.whatsappCopied, ui.whatsappError]);

  const handleWhatsAppOpen = useCallback(() => {
    openInWhatsApp(whatsappText());
  }, [whatsappText]);

  const hasGroups = [...day.groups.group1, ...day.groups.group2].some((id) =>
    id.trim()
  );

  const handleExport = useCallback(
    (kind: ExportKind) => {
      if (exportJob) return;
      const { format, parts } = exportKindMeta(kind);
      const id = (exportCounter.current += 1);
      const langClass = `lang-${lang}`;
      let job: ExportJob;

      if (kind === "month-pdf" || kind === "month-png") {
        const sheet = monthRef.current;
        if (!sheet) return;
        const label = sheet.dataset.monthLabel ?? "";
        // Клон без кнопок редактирования клеток (они не нужны в файле).
        const clone = sheet.cloneNode(true) as HTMLElement;
        clone
          .querySelectorAll(".month-row-move, .no-print")
          .forEach((node) => node.remove());
        job = {
          id,
          kind,
          format,
          parts,
          fileBase: `dinamo-month-${slugify(label) || dateStamp("")}`,
          monthNode: clone,
          bodyClass: `print-month export-body ${langClass}`,
        };
      } else {
        const suffix =
          kind === "groups-png"
            ? "groups"
            : kind === "day-pdf-groups"
              ? "schedule-groups"
              : "schedule";
        job = {
          id,
          kind,
          format,
          parts,
          fileBase: `${dateStamp(day.date)}-dinamo-${suffix}`,
          bodyClass: `print-day export-body ${langClass}`,
        };
      }
      flash(ui.exportBusy);
      setExportJob(job);
    },
    [exportJob, lang, day.date, flash, ui.exportBusy]
  );

  const handleExportDone = useCallback(
    (error: Error | null) => {
      setExportJob(null);
      if (error) flash(ui.exportError);
      else flash(ui.exportDone, true);
    },
    [flash, ui.exportDone, ui.exportError]
  );

  /** Листы дня: на экране (isEditing зависит от режима) и для экспорта (всегда просмотр). */
  function renderDaySheets(isEditing: boolean, refs: DaySheetRefs) {
    return (
      <>
      <ScheduleSheet
        ui={ui}
        lang={lang}
        editing={isEditing}
        date={day.date}
        gameDay={day.gameDay === true}
        schedule={day.schedule}
        activities={data.activities}
        splits={data.splits}
        days={data.days}
        templates={data.templates ?? []}
        activeDayId={data.activeDayId}
        sheetRef={refs.schedule}
        onAddDay={dayActions.addDay}
        onAddNext10Days={dayActions.addNext10Days}
        onPullFromDay={dayActions.pullFromDay}
        onPullFromTemplate={dayActions.pullFromTemplate}
        onSaveAsTemplate={library.saveAsTemplate}
        onRemoveDay={dayActions.removeDay}
        onDateChange={(value) =>
          updateActiveDay(
            (d) => {
              d.date = value;
              return d;
            },
            { coalesceKey: `day:${day.id}:date` }
          )
        }
        onGameDayChange={(value) =>
          updateActiveDay(
            (d) => {
              if ((d.gameDay === true) === value) return d;
              d.gameDay = value;
              return d;
            },
            { coalesceKey: `day:${day.id}:gameDay` }
          )
        }
        onRowChange={(index, field, value) =>
          updateActiveDay(
            (d) => {
              d.schedule[index] = { ...d.schedule[index], [field]: value };
              return d;
            },
            { coalesceKey: `day:${day.id}:row:${index}:${String(field)}` }
          )
        }
        onRemoveRow={(index) =>
          updateActiveDay((d) => {
            d.schedule.splice(index, 1);
            return d;
          })
        }
        onMoveRow={(from, to) =>
          updateActiveDay((d) => {
            if (
              from < 0 ||
              to < 0 ||
              from >= d.schedule.length ||
              to >= d.schedule.length ||
              from === to
            ) {
              return d;
            }
            const [row] = d.schedule.splice(from, 1);
            d.schedule.splice(to, 0, row);
            return d;
          })
        }
        onAddRow={() =>
          updateActiveDay((d) => {
            d.schedule.push(emptyScheduleRow());
            return d;
          })
        }
        onAddSplitRow={() =>
          updateActiveDay((d) => {
            d.schedule.push(emptyScheduleRow("split"));
            return d;
          })
        }
      />

      <div className="page-break" aria-hidden="true" />

      <GroupsSheet
        ui={ui}
        lang={lang}
        editing={isEditing}
        date={day.date}
        groups={day.groups}
        groupsLabelRu={day.groupsLabelRu}
        groupsLabelEn={day.groupsLabelEn}
        roster={data.roster}
        sheetRef={refs.groups}
        onSelectPlayer={(group, index, playerId) =>
          updateActiveDay(
            (d) => {
              if (d.groups[group][index] === playerId) return d;
              d.groups[group][index] = playerId;
              return d;
            },
            { coalesceKey: `day:${day.id}:slot:${group}:${index}` }
          )
        }
        onRemovePlayer={(group: GroupKey, index) =>
          updateActiveDay((d) => {
            d.groups[group].splice(index, 1);
            return d;
          })
        }
        onMovePlayer={dayActions.handleMovePlayer}
        onMovePlayerToGroup={dayActions.handleMovePlayerToGroup}
        onAddPlayerSlot={(group: GroupKey) =>
          updateActiveDay((d) => {
            d.groups[group].push("");
            return d;
          })
        }
        onGroupNameChange={(field, value) =>
          updateActiveDay(
            (d) => {
              if (d.groups[field] === value) return d;
              d.groups[field] = value;
              return d;
            },
            { coalesceKey: `day:${day.id}:gname:${String(field)}` }
          )
        }
        onGroupsLabelChange={(labelLang, value) =>
          updateActiveDay(
            (d) => {
              const labelField =
                labelLang === "ru" ? "groupsLabelRu" : "groupsLabelEn";
              if (d[labelField] === value) return d;
              d[labelField] = value;
              return d;
            },
            { coalesceKey: `day:${day.id}:glabel:${labelLang}` }
          )
        }
      />
      </>
    );
  }

  return (
    <>
      <Toolbar
        ui={ui}
        lang={lang}
        view={view}
        sync={sync}
        preview={preview}
        days={data.days}
        activeDayId={data.activeDayId}
        onViewChange={handleViewChange}
        onLangChange={handleLangChange}
        onDayChange={handleDayChange}
        onWhatsAppCopy={handleWhatsAppCopy}
        onWhatsAppOpen={handleWhatsAppOpen}
        onPreviewToggle={handlePreviewToggle}
        onOpenSettings={() => setSettingsOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        hasGroups={hasGroups}
        exporting={exportJob !== null}
        onExport={handleExport}
      />

      <p className={`status${status.ok ? " ok" : ""}`} aria-live="polite">
        {status.text}
      </p>

      {view === "month" ? (
        <div className="document document-month">
          <MonthCalendar
            ui={ui}
            lang={lang}
            editing={editing}
            calendar={data.calendar}
            monthActivities={data.monthActivities ?? []}
            monthKindLogos={data.monthKindLogos ?? {}}
            matches={data.matches ?? {}}
            flights={data.flights ?? {}}
            trains={data.trains ?? {}}
            watermark={data.monthWatermark ?? true}
            teams={data.teams ?? []}
            sheetRef={monthRef}
            onSetDayKind={dayActions.setCalendarDayKind}
            onSetMatch={dayActions.setMatch}
            onSetFlight={dayActions.setFlight}
            onSetTrain={dayActions.setTrain}
            onSetWatermark={dayActions.setMonthWatermark}
            onAddMonthActivity={dayActions.addMonthActivity}
            onUpdateMonthActivity={dayActions.updateMonthActivity}
            onRemoveMonthActivity={dayActions.removeMonthActivity}
            onMoveCalendarActivity={dayActions.moveCalendarActivity}
            onSetMonthKindLogo={dayActions.setMonthKindLogo}
          />
        </div>
      ) : view === "library" ? (
        <div className="document document-library">
          <LibrarySheet
            ui={ui}
            lang={lang}
            activities={data.activities}
            splits={data.splits}
            teams={data.teams ?? []}
            templates={data.templates ?? []}
            roster={data.roster}
            sheetRef={libraryRef}
            onAddActivity={library.handleAddActivity}
            onUpdateActivity={library.handleUpdateActivity}
            onRemoveActivity={library.handleRemoveActivity}
            onAddSplit={library.handleAddSplit}
            onUpdateSplit={library.handleUpdateSplit}
            onRemoveSplit={library.handleRemoveSplit}
            onAddTeam={library.handleAddTeam}
            onUpdateTeam={library.handleUpdateTeam}
            onRemoveTeam={library.handleRemoveTeam}
            onUpdateTemplate={library.handleUpdateTemplate}
            onRemoveTemplate={library.handleRemoveTemplate}
            onAddToRoster={library.handleAddToRoster}
            onRemoveFromRoster={library.handleRemoveFromRoster}
            onUpdateRoster={library.handleUpdateRoster}
            onReset={handleReset}
          />
        </div>
      ) : (
        <div className="document" id="page" ref={dayPageRef}>
          {renderDaySheets(editing, { schedule: scheduleRef, groups: groupsRef })}
        </div>
      )}

      <p className="app-credit no-print">{ui.creator}</p>

      {exportJob && (
        <ExportStage job={exportJob} onDone={handleExportDone}>
          {!exportJob.monthNode ? (
            <div className="document">
              {renderDaySheets(false, {
                schedule: exportScheduleRef,
                groups: exportGroupsRef,
              })}
            </div>
          ) : null}
        </ExportStage>
      )}

      {settingsOpen && (
        <SettingsDialog
          ui={ui}
          onClose={() => setSettingsOpen(false)}
          onOpenLibrary={() => {
            setSettingsOpen(false);
            handleViewChange("library");
          }}
        />
      )}
    </>
  );
}
