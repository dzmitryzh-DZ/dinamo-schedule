import { useCallback, useRef, useState } from "react";
import { Toolbar } from "./components/Toolbar";
import { ScheduleSheet } from "./components/ScheduleSheet";
import { GroupsSheet } from "./components/GroupsSheet";
import { MonthCalendar } from "./components/MonthCalendar";
import { LoginGate } from "./components/LoginGate";
import { SettingsDialog } from "./components/SettingsDialog";
import {
  emptyScheduleRow,
  getActiveDay,
  templateFromDay,
} from "./data/storage";
import type { GroupKey } from "./data/types";
import { useScheduleStore } from "./hooks/useScheduleStore";
import { useDayActions } from "./hooks/useDayActions";
import { isAuthenticated } from "./utils/auth";
import {
  copyTextToClipboard,
  formatDayForWhatsApp,
  openInWhatsApp,
} from "./utils/whatsapp";

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
    mutateStore,
    handleLangChange,
    handleViewChange,
    handlePreviewToggle,
    handleDayChange,
    updateActiveDay,
  } = store;

  const scheduleRef = useRef<HTMLElement | null>(null);
  const groupsRef = useRef<HTMLElement | null>(null);
  const dayPageRef = useRef<HTMLDivElement | null>(null);
  const monthRef = useRef<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const day = getActiveDay(data);
  const dayActions = useDayActions(store);

  const whatsappText = useCallback(
    () => formatDayForWhatsApp(getActiveDay(data), data.roster, lang),
    [data, lang]
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

  const saveAsTemplate = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        flash(ui.templateNameRequired);
        return;
      }
      mutateStore(
        (current) => {
          if (!current.templates) current.templates = [];
          const active = getActiveDay(current);
          current.templates.push(templateFromDay(active, trimmed, trimmed));
          return current;
        },
        { message: ui.templateSaved.replace("{name}", trimmed) }
      );
    },
    [mutateStore, flash, ui.templateNameRequired, ui.templateSaved]
  );

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
      ) : (
        <div className="document" id="page" ref={dayPageRef}>
          <ScheduleSheet
            ui={ui}
            lang={lang}
            editing={editing}
            date={day.date}
            schedule={day.schedule}
            activities={data.activities}
            splits={data.splits}
            days={data.days}
            templates={data.templates ?? []}
            activeDayId={data.activeDayId}
            sheetRef={scheduleRef}
            onAddDay={dayActions.addDay}
            onAddNext10Days={dayActions.addNext10Days}
            onPullFromDay={dayActions.pullFromDay}
            onPullFromTemplate={dayActions.pullFromTemplate}
            onSaveAsTemplate={saveAsTemplate}
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
            editing={editing}
            date={day.date}
            groups={day.groups}
            groupsLabelRu={day.groupsLabelRu}
            groupsLabelEn={day.groupsLabelEn}
            roster={data.roster}
            sheetRef={groupsRef}
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
        </div>
      )}

      <p className="app-credit no-print">{ui.creator}</p>

      {settingsOpen && (
        <SettingsDialog ui={ui} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
