import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { UiStrings } from "../i18n/ui";
import {
  DAY_KINDS,
  FLIGHT_DEST_MAX,
  isDayKind,
  type DayKind,
  type FlightDest,
  type Lang,
  type MatchInfo,
  type MonthActivity,
  type TeamItem,
} from "../data/types";
import { collectAirportLegend, flightDestText, resolveFlightStamp } from "../data/airports";
import { findTeamForMatch, teamLabel } from "../data/teams";
import { monthActivityLabel } from "../utils/localize";
import { resizeImageToDataUrl } from "../utils/image";
import {
  buildMonthGrid,
  formatDateRu,
  monthTitle,
  shiftMonth,
} from "../utils/dates";
import { DayKindIcon } from "./DayKindIcon";
import { FlightIcon } from "./FlightIcon";
import { TrainIcon } from "./TrainIcon";
import { TeamLogo } from "./TeamLogo";
import { TeamSelect } from "./TeamSelect";

const GAME_KINDS = new Set<DayKind>(["home", "away"]);
/** Keeps the CSS grid layout intact while ARIA rows/cells are exposed. */
const CONTENTS_STYLE: CSSProperties = { display: "contents" };

const CUSTOM_KIND_COLORS = [
  { accent: "#8e24aa", bg: "#f3e5f5", line: "#ce93d8" },
  { accent: "#00897b", bg: "#e0f2f1", line: "#80cbc4" },
  { accent: "#3949ab", bg: "#e8eaf6", line: "#9fa8da" },
  { accent: "#6d4c41", bg: "#efebe9", line: "#bcaaa4" },
  { accent: "#d81b60", bg: "#fce4ec", line: "#f48fb1" },
  { accent: "#ef6c00", bg: "#fff3e0", line: "#ffcc80" },
] as const;

type KindStyle = CSSProperties & {
  "--kind": string;
  "--kind-bg": string;
  "--kind-line": string;
};

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  calendar: Record<string, string[]>;
  monthActivities: MonthActivity[];
  monthKindLogos: Partial<Record<DayKind, string>>;
  matches: Record<string, MatchInfo>;
  flights: Record<string, FlightDest>;
  trains: Record<string, FlightDest>;
  watermark: boolean;
  teams: TeamItem[];
  sheetRef: RefObject<HTMLElement | null>;
  onSetDayKind: (date: string, kind: string | null) => void;
  onSetMatch: (date: string, match: MatchInfo | null) => void;
  onSetFlight: (date: string, dest: FlightDest | null) => void;
  onSetTrain: (date: string, dest: FlightDest | null) => void;
  onSetWatermark: (on: boolean) => void;
  onAddMonthActivity: (ru: string, en: string) => string;
  onUpdateMonthActivity: (
    id: string,
    updates: Partial<Pick<MonthActivity, "ru" | "en" | "logo">>
  ) => void;
  onRemoveMonthActivity: (id: string) => void;
  onMoveCalendarActivity: (date: string, fromIndex: number, toIndex: number) => void;
  onSetMonthKindLogo: (kind: DayKind, logo: string | null) => void;
};

export function MonthCalendar({
  ui,
  lang,
  editing,
  calendar,
  monthActivities,
  monthKindLogos,
  matches,
  flights,
  trains,
  watermark,
  teams,
  sheetRef,
  onSetDayKind,
  onSetMatch,
  onSetFlight,
  onSetTrain,
  onSetWatermark,
  onAddMonthActivity,
  onUpdateMonthActivity,
  onRemoveMonthActivity,
  onMoveCalendarActivity,
  onSetMonthKindLogo,
}: Props) {
  const [now] = useState(() => new Date());
  const today = formatDateRu(now);
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedKind, setSelectedKind] = useState<string>("training");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [matchOpponent, setMatchOpponent] = useState("");
  const [customRu, setCustomRu] = useState("");
  const [customEn, setCustomEn] = useState("");
  const [flightRu, setFlightRu] = useState("");
  const [flightEn, setFlightEn] = useState("");
  const [trainRu, setTrainRu] = useState("");
  const [trainEn, setTrainEn] = useState("");

  const cells = useMemo(
    () => buildMonthGrid(year, monthIndex),
    [year, monthIndex]
  );

  // 42 cells → six ARIA rows of seven for the role="grid" structure.
  const cellWeeks = useMemo(() => {
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [cells]);

  const title = monthTitle(year, monthIndex, lang);
  const isGameKind = GAME_KINDS.has(selectedKind as DayKind);
  const isFlightTool = selectedKind === "flight";
  const isTrainTool = selectedKind === "train";
  const isClearTool = selectedKind === "clear";
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const activityById = useMemo(() => {
    const map = new Map<string, MonthActivity>();
    for (const activity of monthActivities) map.set(activity.id, activity);
    return map;
  }, [monthActivities]);
  const airportLegend = useMemo(() => {
    const dests: string[] = [];
    for (const cell of cells) {
      if (!cell.inMonth) continue;
      const dest = flights[cell.date];
      if (dest) dests.push(flightDestText(dest, lang));
    }
    return collectAirportLegend(dests, lang);
  }, [cells, flights, lang]);
  const selectedCustom = activityById.get(selectedKind);
  const selectedBuiltin = isDayKind(selectedKind) ? selectedKind : undefined;
  const selectedLogo = selectedCustom?.logo ??
    (selectedBuiltin ? monthKindLogos[selectedBuiltin] : undefined);

  const orderedActivityIds = useMemo(
    () => [...DAY_KINDS, "flight", "train", ...monthActivities.map((a) => a.id)],
    [monthActivities]
  );

  function go(delta: number) {
    const next = shiftMonth(year, monthIndex, delta);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  }

  function makeMatchInfo(): MatchInfo {
    const opponent = (selectedTeam?.abbr || matchOpponent)
      .trim()
      .slice(0, 3)
      .toUpperCase();
    return selectedTeam?.id
      ? { opponent, teamId: selectedTeam.id }
      : { opponent };
  }

  function makeFlightDest(): FlightDest | null {
    const ru = flightRu.trim();
    const en = flightEn.trim();
    return ru || en ? { ru, en } : null;
  }

  function makeTrainDest(): FlightDest | null {
    const ru = trainRu.trim();
    const en = trainEn.trim();
    return ru || en ? { ru, en } : null;
  }

  function applyToDate(date: string) {
    if (isClearTool) {
      onSetDayKind(date, null);
      return;
    }

    if (isFlightTool) {
      const wasPresent = calendar[date]?.includes("flight") ?? false;
      if (wasPresent) {
        onSetDayKind(date, "flight");
      } else {
        const dest = makeFlightDest();
        if (dest) {
          onSetFlight(date, dest);
          onSetDayKind(date, "flight");
        }
      }
      return;
    }

    if (isTrainTool) {
      const wasPresent = calendar[date]?.includes("train") ?? false;
      if (wasPresent) {
        onSetDayKind(date, "train");
      } else {
        const dest = makeTrainDest();
        if (dest) {
          onSetTrain(date, dest);
          onSetDayKind(date, "train");
        }
      }
      return;
    }

    if (!isDayKind(selectedKind) && !activityById.has(selectedKind)) {
      return;
    }

    const wasPresent = calendar[date]?.includes(selectedKind) ?? false;
    if (isGameKind) {
      if (wasPresent) {
        onSetMatch(date, null);
        onSetDayKind(date, selectedKind);
      } else {
        const match = makeMatchInfo();
        if (match.opponent || match.teamId) {
          onSetMatch(date, match);
          onSetDayKind(date, selectedKind);
        }
      }
      return;
    }

    onSetDayKind(date, selectedKind);
  }

  function handleSelectTeam(team: TeamItem | null) {
    setSelectedTeamId(team?.id ?? "");
    setMatchOpponent(team?.abbr ?? "");
  }

  function handleCustomAbbr(abbr: string) {
    const next = abbr.trim().slice(0, 3).toUpperCase();
    setMatchOpponent(next);
    const found = teams.find((team) => team.abbr.toUpperCase() === next);
    setSelectedTeamId(found?.id ?? "");
  }

  function handleAddCustom(event: FormEvent) {
    event.preventDefault();
    const id = onAddMonthActivity(customRu, customEn);
    if (!id) return;
    setSelectedKind(id);
    setCustomRu("");
    setCustomEn("");
  }

  function handleRemoveCustom(id: string, label: string) {
    if (!confirm(ui.confirmRemoveMonthActivity.replace("{name}", label))) return;
    onRemoveMonthActivity(id);
    if (selectedKind === id) setSelectedKind("training");
  }

  async function handleLogoFile(file: File | undefined) {
    if (!file) return;
    try {
      const logo = await resizeImageToDataUrl(file);
      if (selectedCustom) {
        onUpdateMonthActivity(selectedCustom.id, { logo });
      } else if (selectedBuiltin) {
        onSetMonthKindLogo(selectedBuiltin, logo);
      }
    } catch {
      /* ignore unreadable files */
    }
  }

  function handleClearLogo() {
    if (selectedCustom) {
      onUpdateMonthActivity(selectedCustom.id, { logo: "" });
    } else if (selectedBuiltin) {
      onSetMonthKindLogo(selectedBuiltin, null);
    }
  }

  function handleClearLogoById(id: string) {
    const builtin = isDayKind(id) ? id : undefined;
    const custom = builtin ? undefined : activityById.get(id);
    if (custom) {
      onUpdateMonthActivity(custom.id, { logo: "" });
    } else if (builtin) {
      onSetMonthKindLogo(builtin, null);
    }
  }

  return (
    <article className="sheet sheet-month" ref={sheetRef} data-month-label={title}>
      {watermark ? (
        <img
          className="month-watermark"
          src={`${import.meta.env.BASE_URL}zubr-watermark.png`}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <div className="content month-content">
        {editing && (
          <div className="month-activity-picker no-print" aria-label={ui.activityList}>
            <p className="section-label">{ui.activityList}</p>
            <div className="month-activity-list" role="radiogroup" aria-label={ui.activityList}>
              {orderedActivityIds.map((id) => {
                if (id === "flight") {
                  return (
                    <ActivityOption
                      key={id}
                      selected={selectedKind === id}
                      onClick={() => setSelectedKind(id)}
                    >
                      <FlightIcon />
                      {ui.kindFlight}
                    </ActivityOption>
                  );
                }

                if (id === "train") {
                  return (
                    <ActivityOption
                      key={id}
                      selected={selectedKind === id}
                      onClick={() => setSelectedKind(id)}
                    >
                      <TrainIcon />
                      {ui.kindTrain}
                    </ActivityOption>
                  );
                }

                const builtin = isDayKind(id) ? id : undefined;
                const custom = builtin ? undefined : activityById.get(id);
                if (!builtin && !custom) return null;
                const label = builtin
                  ? kindLabel(ui, builtin)
                  : monthActivityLabel(custom!, lang);
                const logo =
                  custom?.logo ??
                  (builtin ? monthKindLogos[builtin] : undefined);
                return (
                  <span key={id} className="month-activity-chip">
                    <ActivityOption
                      selected={selectedKind === id}
                      style={custom ? customKindStyle(monthActivities.indexOf(custom)) : undefined}
                      className={builtin ? `kind-${builtin}` : "kind-custom"}
                      onClick={() => setSelectedKind(id)}
                    >
                      <KindMark kind={builtin} custom={custom} logo={logo} />
                      {label}
                    </ActivityOption>
                    {logo ? (
                      <button
                        type="button"
                        className="month-activity-logo-remove"
                        title={ui.clearLogo}
                        aria-label={ui.clearLogo}
                        onClick={() => handleClearLogoById(id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M5 5h14c.55 0 1 .45 1 1v8.2l-3.2-2.6L12 15l-2-1.5L6.2 15.6 5 14.9V6c0-.55.45-1 1-1Zm14 12.5V19c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1.5l4.5-3.7 2 1.5 4.8-3.4 3.7 3Z" />
                          <path d="m3.7 2.3 18 18-1.4 1.4-18-18 1.4-1.4Z" />
                        </svg>
                      </button>
                    ) : null}
                    {custom && (
                      <button
                        type="button"
                        className="month-activity-remove"
                        title={ui.remove}
                        aria-label={ui.remove}
                        onClick={() => handleRemoveCustom(custom.id, label)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
              <button
                type="button"
                role="radio"
                aria-checked={isClearTool}
                className={`month-activity-option kind-clear${
                  isClearTool ? " is-selected" : ""
                }`}
                onClick={() => setSelectedKind("clear")}
              >
                {ui.clearDayKind}
              </button>
            </div>

            <form
              className="month-custom-activity-form"
              onSubmit={handleAddCustom}
              aria-label={ui.customMonthActivity}
            >
              <input
                value={customRu}
                maxLength={80}
                placeholder={ui.customMonthActivityRu}
                aria-label={ui.customMonthActivityRu}
                onChange={(event) => setCustomRu(event.target.value)}
              />
              <input
                value={customEn}
                maxLength={80}
                placeholder={ui.customMonthActivityEn}
                aria-label={ui.customMonthActivityEn}
                onChange={(event) => setCustomEn(event.target.value)}
              />
              <button
                type="submit"
                className="btn"
                disabled={!customRu.trim() && !customEn.trim()}
              >
                {ui.addMonthActivity}
              </button>
            </form>

            {selectedKind !== "clear" && (selectedCustom || selectedBuiltin) ? (
              <div className="month-activity-logo-editor">
                <span className="month-match-kind-hint">{ui.activityLogoHint}</span>
                <label className="team-logo-upload">
                  {ui.uploadLogo}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleLogoFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                {selectedLogo ? (
                  <button type="button" className="btn" onClick={handleClearLogo}>
                    {ui.clearLogo}
                  </button>
                ) : null}
              </div>
            ) : null}

            {isFlightTool && (
              <div className="month-match-editor">
                <input
                  className="month-flight-dest"
                  value={flightRu}
                  maxLength={FLIGHT_DEST_MAX}
                  placeholder={ui.flightDestRu}
                  aria-label={ui.flightDestRu}
                  onChange={(event) => setFlightRu(event.target.value)}
                />
                <input
                  className="month-flight-dest"
                  value={flightEn}
                  maxLength={FLIGHT_DEST_MAX}
                  placeholder={ui.flightDestEn}
                  aria-label={ui.flightDestEn}
                  onChange={(event) => setFlightEn(event.target.value)}
                />
                <span className="month-match-kind-hint">{ui.flightDestHint}</span>
              </div>
            )}

            {isTrainTool && (
              <div className="month-match-editor">
                <input
                  className="month-flight-dest"
                  value={trainRu}
                  maxLength={FLIGHT_DEST_MAX}
                  placeholder={ui.trainDestRu}
                  aria-label={ui.trainDestRu}
                  onChange={(event) => setTrainRu(event.target.value)}
                />
                <input
                  className="month-flight-dest"
                  value={trainEn}
                  maxLength={FLIGHT_DEST_MAX}
                  placeholder={ui.trainDestEn}
                  aria-label={ui.trainDestEn}
                  onChange={(event) => setTrainEn(event.target.value)}
                />
                <span className="month-match-kind-hint">{ui.trainDestHint}</span>
              </div>
            )}

            {isGameKind && (
              <div className="month-match-editor">
                <TeamSelect
                  teams={teams}
                  lang={lang}
                  teamId={selectedTeamId}
                  customAbbr={matchOpponent}
                  placeholder={ui.selectTeam}
                  customLabel={ui.customTeam}
                  abbrHint={ui.matchAbbrHint}
                  onSelectTeam={handleSelectTeam}
                  onCustomAbbr={handleCustomAbbr}
                />
                <span className="month-match-kind-hint">
                  {selectedKind === "home" ? ui.matchHome : ui.matchAway}
                  {selectedTeam || matchOpponent
                    ? ` · ${(selectedTeam?.abbr || matchOpponent).slice(0, 3)}`
                    : ` · ${ui.matchAbbrHint}`}
                </span>
              </div>
            )}

            <p className="month-hint">{ui.calendarHint}</p>
          </div>
        )}

        <div className="month-board">
          <header className="month-header">
            <div className="month-nav no-print">
              <button
                type="button"
                className="btn"
                onClick={() => go(-1)}
                aria-label={ui.prevMonth}
              >
                ‹
              </button>
            </div>
            <div className="month-heading">
              <p className="section-label">{ui.monthTitle}</p>
              <h2 className="month-title">{title}</h2>
            </div>
            <div className="month-nav no-print">
              <button
                type="button"
                className={`btn month-watermark-toggle${watermark ? " is-on" : ""}`}
                aria-pressed={watermark}
                title={ui.watermark}
                onClick={() => onSetWatermark(!watermark)}
              >
                {ui.watermark}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => go(1)}
                aria-label={ui.nextMonth}
              >
                ›
              </button>
            </div>
          </header>
        <div className="month-grid" role="grid" aria-label={title}>
          <div className="month-grid-row" role="row" style={CONTENTS_STYLE}>
            {ui.weekdays.map((label) => (
              <div key={label} className="month-weekday" role="columnheader">
                {label}
              </div>
            ))}
          </div>
          {cellWeeks.map((week) => {
            const weekInMonth = week.some((day) => day.inMonth);
            return (
              <div
                key={week[0].date}
                className="month-grid-row"
                role="row"
                style={CONTENTS_STYLE}
              >
              {week.map((cell) => {
                const dayActivities = calendar[cell.date] ?? [];
                const hasFlight = dayActivities.includes("flight");
                const hasTrain = dayActivities.includes("train");
                const isSelectedPresent =
                  editing && !isClearTool && dayActivities.includes(selectedKind);
                const classes = [
                  "month-cell",
                  cell.inMonth ? "in-month" : "out-month",
                  dayActivities.length ? "has-activities" : "",
                  hasFlight ? "has-flight" : "",
                  hasTrain ? "has-train" : "",
                  cell.date === today ? "is-today" : "",
                  editing ? "is-editable" : "",
                  isSelectedPresent ? "is-selected-present" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const ariaExtra = [
                  dayActivities
                    .map((id) => activityAriaLabel(ui, lang, id, activityById, matches, teams, flights, trains, cell.date))
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .join("; ");
                return (
                  <div
                    key={cell.date}
                    className={
                      weekInMonth
                        ? "month-grid-cell"
                        : "month-grid-cell month-week-out"
                    }
                    role="gridcell"
                    style={CONTENTS_STYLE}
                  >
                    <button
                      type="button"
                      className={classes}
                      disabled={!editing || !cell.inMonth}
                      onClick={() => {
                        if (!editing || !cell.inMonth) return;
                        applyToDate(cell.date);
                      }}
                      aria-label={`${cell.date}${ariaExtra ? `, ${ariaExtra}` : ""}`}
                      title={ariaExtra || undefined}
                    >
                      <span className="month-day-num">{cell.day}</span>
                      <span
                        className={`month-activities-stack${
                          dayActivities.length >= 4 ? " is-compact" : ""
                        }`}
                      >
                        {dayActivities.map((id, index) => (
                          <ActivityRow
                            key={`${id}-${index}`}
                            id={id}
                            date={cell.date}
                            index={index}
                            total={dayActivities.length}
                            editing={editing}
                            ui={ui}
                            lang={lang}
                            activityById={activityById}
                            monthActivities={monthActivities}
                            monthKindLogos={monthKindLogos}
                            matches={matches}
                            flights={flights}
                            trains={trains}
                            teams={teams}
                            onMove={onMoveCalendarActivity}
                          />
                        ))}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
        </div>

        <div className="month-legend" aria-label={ui.legend}>
          <p className="section-label">{ui.legend}</p>
          <ul>
            {DAY_KINDS.map((kind) => (
              <li key={kind} className={`kind-${kind}`}>
                <KindMark kind={kind} logo={monthKindLogos[kind]} />
                {kindLabel(ui, kind)}
              </li>
            ))}
            <li className="kind-flight">
              <FlightIcon />
              {ui.kindFlight}
            </li>
            <li className="kind-train">
              <TrainIcon />
              {ui.kindTrain}
            </li>
            {monthActivities.map((activity, index) => (
              <li
                key={activity.id}
                className="kind-custom"
                style={customKindStyle(index)}
              >
                <KindMark custom={activity} logo={activity.logo} />
                {monthActivityLabel(activity, lang)}
              </li>
            ))}
          </ul>
        </div>
        {airportLegend.length > 0 ? (
          <div className="month-airports" aria-label={ui.airportLegend}>
            <p className="section-label">{ui.airportLegend}</p>
            <ul>
              {airportLegend.map((item) => (
                <li key={item.code}>
                  <span className="month-airport-code">{item.code}</span>
                  {item.name ? (
                    <span className="month-airport-name">— {item.name}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="month-change-notice">{ui.scheduleChangeNotice}</p>
      </div>
    </article>
  );
}

function ActivityOption({
  selected,
  style,
  className,
  children,
  onClick,
}: {
  selected: boolean;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`month-activity-option${className ? ` ${className}` : ""}${
        selected ? " is-selected" : ""
      }`}
      style={style}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ActivityRow({
  id,
  date,
  index,
  total,
  editing,
  ui,
  lang,
  activityById,
  monthActivities,
  monthKindLogos,
  matches,
  flights,
  trains,
  teams,
  onMove,
}: {
  id: string;
  date: string;
  index: number;
  total: number;
  editing: boolean;
  ui: UiStrings;
  lang: Lang;
  activityById: Map<string, MonthActivity>;
  monthActivities: MonthActivity[];
  monthKindLogos: Partial<Record<DayKind, string>>;
  matches: Record<string, MatchInfo>;
  flights: Record<string, FlightDest>;
  trains: Record<string, FlightDest>;
  teams: TeamItem[];
  onMove: (date: string, fromIndex: number, toIndex: number) => void;
}) {
  const canMoveUp = editing && index > 0;
  const canMoveDown = editing && index < total - 1;

  const builtin = id === "flight" ? undefined : isDayKind(id) ? id : undefined;
  const custom = builtin ? undefined : activityById.get(id);

  const content = (() => {
    if (id === "flight") {
      const flight = flights[date];
      const flightText = flight ? flightDestText(flight, lang) : "";
      const flightStamp = flightText ? resolveFlightStamp(flightText) : undefined;
      return (
        <>
          <span className="month-kind-label">
            {flightStamp?.code
              ? `${ui.cellFlight} ${flightStamp.code}`
              : ui.kindFlight}
          </span>
          <FlightIcon />
        </>
      );
    }

    if (id === "train") {
      const train = trains[date];
      const text = train ? trainStampText(train, lang) : "";
      return (
        <>
          <span className="month-kind-label">
            {text ? (
              <>
                {ui.cellTrain}
                <br />
                {text}
              </>
            ) : (
              ui.kindTrain
            )}
          </span>
          <TrainIcon />
        </>
      );
    }

    if (!builtin && !custom) return null;

    const match =
      builtin && GAME_KINDS.has(builtin) ? matches[date] : undefined;
    const team = findTeamForMatch(teams, match);
    const isGameDay = Boolean(builtin && GAME_KINDS.has(builtin));
    const showOpponentLogo = Boolean(isGameDay && (team || match?.opponent));
    // Training shows only an uploaded logo in the cell plaque; the default
    // stick icon stays in the picker and legend.
    const trainingLogo = builtin === "training" ? monthKindLogos.training : undefined;
    const hideKindMark = builtin === "training" && !trainingLogo;

    const label = (
      <span className="month-kind-label">
        {showOpponentLogo ? (
          <>
            {ui.cellGame} vs
            <br />
            {match?.opponent}
          </>
        ) : custom ? (
          monthActivityLabel(custom, lang)
        ) : builtin ? (
          cellLabel(ui, builtin, match)
        ) : (
          ""
        )}
      </span>
    );

    return (
      <>
        {showOpponentLogo ? (
          <>
            {label}
            <TeamLogo
              team={team}
              abbr={match?.opponent || team?.abbr}
              title={
                team
                  ? `${team.abbr} · ${teamLabel(team, lang)}`
                  : match?.opponent
              }
            />
          </>
        ) : (
          <>
            {label}
            {!hideKindMark && (
              <KindMark
                kind={builtin}
                custom={custom}
                logo={
                  custom?.logo ??
                  (builtin ? monthKindLogos[builtin] : undefined)
                }
              />
            )}
          </>
        )}
      </>
    );
  })();

  const rowClass =
    id === "flight"
      ? "kind-flight"
      : id === "train"
        ? "kind-train"
        : builtin
        ? `kind-${builtin}`
        : custom
          ? "kind-custom"
          : "";
  const customStyle = custom
    ? customKindStyle(
        monthActivities.findIndex((activity) => activity.id === custom.id)
      )
    : undefined;

  return (
    <span className={`month-activity-row${rowClass ? ` ${rowClass}` : ""}`} style={customStyle}>
      {content}
      {editing && total > 1 ? (
        <span className="month-row-move">
          <button
            type="button"
            className="month-row-move-btn"
            disabled={!canMoveUp}
            aria-label={ui.moveUp}
            title={ui.moveUp}
            onClick={(event) => {
              event.stopPropagation();
              if (canMoveUp) onMove(date, index, index - 1);
            }}
          >
            ↑
          </button>
          <button
            type="button"
            className="month-row-move-btn"
            disabled={!canMoveDown}
            aria-label={ui.moveDown}
            title={ui.moveDown}
            onClick={(event) => {
              event.stopPropagation();
              if (canMoveDown) onMove(date, index, index + 1);
            }}
          >
            ↓
          </button>
        </span>
      ) : null}
    </span>
  );
}

function KindMark({
  kind,
  custom,
  logo,
}: {
  kind?: DayKind;
  custom?: MonthActivity;
  logo?: string;
}): ReactNode {
  if (logo) {
    return (
      <img
        className="day-kind-icon month-activity-logo"
        src={logo}
        alt=""
        aria-hidden="true"
      />
    );
  }
  if (custom) {
    return (
      <span className="month-kind-letter" aria-hidden="true">
        {activityInitial(custom.ru || custom.en)}
      </span>
    );
  }
  if (kind) return <DayKindIcon kind={kind} />;
  return null;
}

function kindLabel(ui: UiStrings, kind: DayKind): string {
  if (kind === "training") return ui.kindTraining;
  if (kind === "home") return ui.kindHome;
  if (kind === "away") return ui.kindAway;
  if (kind === "recovery") return ui.kindRecovery;
  return ui.kindOff;
}

function cellLabel(ui: UiStrings, kind: DayKind, match?: MatchInfo): string {
  if (kind === "home" || kind === "away") {
    if (match?.opponent) return `${ui.cellGame} vs ${match.opponent}`;
    return ui.cellGame;
  }

  if (kind === "training") return ui.cellTraining;
  if (kind === "recovery") return ui.cellRecovery;
  return ui.cellOff;
}

function trainStampText(dest: FlightDest, lang: Lang): string {
  return flightDestText(dest, lang)
    .replace(/^\s*(to|в|во)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FLIGHT_DEST_MAX)
    .toLocaleUpperCase();
}

function activityInitial(label: string): string {
  const trimmed = label.trim();
  return trimmed ? trimmed[0]!.toLocaleUpperCase() : "?";
}

function customKindStyle(index: number): KindStyle {
  const color =
    CUSTOM_KIND_COLORS[
      ((index % CUSTOM_KIND_COLORS.length) + CUSTOM_KIND_COLORS.length) %
        CUSTOM_KIND_COLORS.length
    ];
  return {
    "--kind": color.accent,
    "--kind-bg": color.bg,
    "--kind-line": color.line,
  };
}

function activityAriaLabel(
  ui: UiStrings,
  lang: Lang,
  id: string,
  activityById: Map<string, MonthActivity>,
  matches: Record<string, MatchInfo>,
  teams: TeamItem[],
  flights: Record<string, FlightDest>,
  trains: Record<string, FlightDest>,
  date: string
): string {
  if (id === "flight") {
    const flight = flights[date];
    const text = flight ? flightDestText(flight, lang) : "";
    const stamp = text ? resolveFlightStamp(text) : undefined;
    return stamp?.code ? `${ui.cellFlight} ${stamp.code}` : ui.kindFlight;
  }
  if (id === "train") {
    const train = trains[date];
    const text = train ? trainStampText(train, lang) : "";
    return text ? `${ui.cellTrain} ${text}` : ui.kindTrain;
  }
  const builtin = isDayKind(id) ? id : undefined;
  const custom = builtin ? undefined : activityById.get(id);
  if (custom) return monthActivityLabel(custom, lang);
  if (!builtin) return "";
  const match = GAME_KINDS.has(builtin) ? matches[date] : undefined;
  const team = findTeamForMatch(teams, match);
  const label = cellLabel(ui, builtin, match);
  if (team) return `${label} · ${teamLabel(team, lang)}`;
  return label;
}
