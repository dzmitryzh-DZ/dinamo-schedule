import type { RefObject } from "react";
import { getUi, type UiStrings } from "../i18n/ui";
import type {
  DayGroups,
  GroupKey,
  GroupNameField,
  Lang,
  RosterPlayer,
} from "../data/types";
import { DocumentHeader } from "./DocumentHeader";
import { PlayerName } from "./PlayerName";
import { resolvePlayers } from "../data/storage";
import { bilingualText, comparePlayersByNumber, rosterPlayerLabel } from "../utils/localize";

const POSITION_ORDER = ["ВР", "ЗЩ", "НП"] as const;

const POSITION_KEYS: Record<string, keyof UiStrings> = {
  ВР: "posGoalies",
  ЗЩ: "posDefence",
  НП: "posForwards",
};

type PositionSection = {
  position: string;
  label: string;
  players: RosterPlayer[];
};

function groupPlayersByPosition(
  players: RosterPlayer[],
  ui: UiStrings
): PositionSection[] {
  const labelFor = (pos: string) => {
    const key = POSITION_KEYS[pos];
    return key ? (ui[key] as string) : pos;
  };

  const byPosition = new Map<string, RosterPlayer[]>();
  const noPosition: RosterPlayer[] = [];
  for (const player of players) {
    const pos = player.position.trim();
    if (!pos) {
      noPosition.push(player);
      continue;
    }
    const list = byPosition.get(pos) ?? [];
    list.push(player);
    byPosition.set(pos, list);
  }

  const sections: PositionSection[] = [];
  for (const pos of POSITION_ORDER) {
    const list = byPosition.get(pos);
    if (list?.length) {
      sections.push({ position: pos, label: labelFor(pos), players: list });
      byPosition.delete(pos);
    }
  }

  for (const [pos, list] of byPosition) {
    if (list.length) {
      sections.push({ position: pos, label: pos, players: list });
    }
  }

  if (noPosition.length) {
    sections.push({
      position: "",
      label: ui.posNoPosition,
      players: noPosition,
    });
  }

  return sections;
}

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  date: string;
  groups: DayGroups;
  groupsLabelRu?: string;
  groupsLabelEn?: string;
  roster: RosterPlayer[];
  sheetRef: RefObject<HTMLElement | null>;
  onSelectPlayer: (group: GroupKey, index: number, playerId: string) => void;
  onRemovePlayer: (group: GroupKey, index: number) => void;
  onMovePlayer: (group: GroupKey, from: number, to: number) => void;
  onMovePlayerToGroup: (group: GroupKey, index: number, targetGroup: GroupKey) => void;
  onAddPlayerSlot: (group: GroupKey) => void;
  onGroupNameChange: (field: GroupNameField, value: string) => void;
  onGroupsLabelChange?: (lang: "ru" | "en", value: string) => void;
};

export function GroupsSheet({
  ui,
  lang,
  editing,
  date,
  groups,
  groupsLabelRu = "",
  groupsLabelEn = "",
  roster,
  sheetRef,
  onSelectPlayer,
  onRemovePlayer,
  onMovePlayer,
  onMovePlayerToGroup,
  onAddPlayerSlot,
  onGroupNameChange,
  onGroupsLabelChange,
}: Props) {
  const sectionLabelBilingual =
    bilingualText(groupsLabelRu, groupsLabelEn) || ui.groupsLabelBilingual;
  const sections: {
    key: GroupKey;
    nameRu: GroupNameField;
    nameEn: GroupNameField;
  }[] = [
    { key: "group1", nameRu: "group1NameRu", nameEn: "group1NameEn" },
    { key: "group2", nameRu: "group2NameRu", nameEn: "group2NameEn" },
  ];

  const hasPlayers =
    (groups.group1 ?? []).some((id) => id.trim()) ||
    (groups.group2 ?? []).some((id) => id.trim());

  const selectedIds = new Set([
    ...(groups.group1 ?? []),
    ...(groups.group2 ?? []),
  ]);

  function optionsForSlot(currentId: string): RosterPlayer[] {
    return roster
      .filter(
        (player) =>
          player.active !== false &&
          (player.id === currentId || !selectedIds.has(player.id))
      )
      .sort(comparePlayersByNumber);
  }

  return (
    <article
      className={["sheet", "sheet-groups", hasPlayers ? "" : "is-empty"]
        .filter(Boolean)
        .join(" ")}
      ref={sheetRef}
    >
      <DocumentHeader ui={ui} title={ui.groupsTitleBilingual} date={date} />
      <div className="content">
        <section className="groups" aria-label={sectionLabelBilingual}>
          {editing ? (
            <div className="groups-label-fields player-fields">
              <input
                className="groups-label-input"
                value={groupsLabelRu}
                placeholder={`${ui.groupsLabel} (RU)`}
                aria-label={`${ui.groupsLabel} RU`}
                onChange={(e) => onGroupsLabelChange?.("ru", e.target.value)}
              />
              <input
                className="groups-label-input en-field"
                value={groupsLabelEn}
                placeholder={`${ui.groupsLabel} (EN)`}
                aria-label={`${ui.groupsLabel} EN`}
                onChange={(e) => onGroupsLabelChange?.("en", e.target.value)}
              />
            </div>
          ) : (
            <p className="section-label">{sectionLabelBilingual}</p>
          )}
          <div className="groups-grid">
            {sections.map((section) => {
              const ids = groups?.[section.key] ?? [];
              const players = resolvePlayers(ids, roster);
              const ruTitle =
                groups[section.nameRu].trim() || getUi("ru")[section.key];
              const enTitle =
                groups[section.nameEn].trim() || getUi("en")[section.key];
              const title = bilingualText(ruTitle, enTitle);

              return (
                <div className="group-card" key={section.key}>
                  {editing ? (
                    <div className="group-title-fields player-fields">
                      <input
                        className="group-title-input"
                        value={groups[section.nameRu] ?? ""}
                        placeholder="RU"
                        aria-label={`${ui.groupName} RU`}
                        onChange={(e) =>
                          onGroupNameChange(section.nameRu, e.target.value)
                        }
                      />
                      <input
                        className="group-title-input en-field"
                        value={groups[section.nameEn] ?? ""}
                        placeholder="EN"
                        aria-label={`${ui.groupName} EN`}
                        onChange={(e) =>
                          onGroupNameChange(section.nameEn, e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <h2>{title}</h2>
                  )}
                  <ol>
                    {editing
                      ? ids.map((playerId, index) => (
                          <li
                            key={`${section.key}-edit-${index}`}
                            className="player-row is-editing"
                          >
                            <select
                              className="player-select"
                              value={playerId}
                              aria-label={ui.selectPlayer}
                              onChange={(e) =>
                                onSelectPlayer(section.key, index, e.target.value)
                              }
                            >
                              <option value="">{ui.selectPlayer}</option>
                              {optionsForSlot(playerId).map((player) => {
                                const label =
                                  rosterPlayerLabel(player, lang) || player.id;
                                return (
                                  <option
                                    key={player.id}
                                    value={player.id}
                                    aria-label={
                                      player.injured
                                        ? `${ui.injured}: ${label}`
                                        : undefined
                                    }
                                  >
                                    {player.injured ? "✚ " : ""}
                                    {label}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="row-btn row-btn-move"
                                title={ui.moveUp}
                                aria-label={ui.moveUp}
                                disabled={index === 0}
                                onClick={() =>
                                  onMovePlayer(section.key, index, index - 1)
                                }
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="row-btn row-btn-move"
                                title={ui.moveDown}
                                aria-label={ui.moveDown}
                                disabled={index === ids.length - 1}
                                onClick={() =>
                                  onMovePlayer(section.key, index, index + 1)
                                }
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                className="row-btn row-btn-move"
                                title={ui.moveToOtherGroup}
                                aria-label={ui.moveToOtherGroup}
                                onClick={() =>
                                  onMovePlayerToGroup(
                                    section.key,
                                    index,
                                    section.key === "group1" ? "group2" : "group1"
                                  )
                                }
                              >
                                {section.key === "group1" ? "→" : "←"}
                              </button>
                              <button
                                type="button"
                                className="row-btn"
                                title={ui.remove}
                                aria-label={ui.remove}
                                onClick={() => onRemovePlayer(section.key, index)}
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))
                      : groupPlayersByPosition(players, ui).flatMap(
                          (posSection, posIndex, posArr) => {
                            const header = (
                              <li
                                className="position-header"
                                key={`${section.key}-pos-${posSection.position}-header`}
                              >
                                <span>{posSection.label}</span>
                              </li>
                            );
                            const rows = posSection.players.map((player, index) => {
                              const number = player.number.trim();
                              return (
                                <li
                                  key={`${section.key}-${player.id}-${posSection.position}-${index}`}
                                  className={[
                                    "player-row",
                                    player.injured ? "is-injured" : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  <span className="player-number">
                                    {number ? `№${number}` : ""}
                                  </span>
                                  <PlayerName
                                    player={player}
                                    showNumber={false}
                                    injuredLabel={ui.injured}
                                  />
                                </li>
                              );
                            });
                            const divider =
                              posIndex < posArr.length - 1 ? (
                                <li
                                  className="position-divider"
                                  key={`${section.key}-pos-${posSection.position}-divider`}
                                  aria-hidden="true"
                                />
                              ) : null;
                            return divider
                              ? [header, ...rows, divider]
                              : [header, ...rows];
                          }
                        )}
                  </ol>
                  {editing && (
                    <button
                      type="button"
                      className="btn btn-ghost add-row"
                      onClick={() => onAddPlayerSlot(section.key)}
                    >
                      {ui.addPlayer}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </article>
  );
}
