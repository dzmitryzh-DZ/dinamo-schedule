import type { UiStrings } from "../../i18n/ui";
import type { RosterPlayer } from "../../data/types";
import { comparePlayersByNumber } from "../../utils/localize";
import { PlayerName } from "../PlayerName";
import { InjuryMark } from "../InjuryMark";

function positionOptions(ui: UiStrings) {
  return [
    { value: "", label: ui.positionNone },
    { value: "ВР", label: ui.positionVr },
    { value: "ЗЩ", label: ui.positionZn },
    { value: "НП", label: ui.positionNp },
  ];
}

type Props = {
  ui: UiStrings;
  editing: boolean;
  onToggleEdit: () => void;
  roster: RosterPlayer[];
  onAddToRoster: (
    ru: string,
    en: string,
    number: string,
    position: string
  ) => void;
  onRemoveFromRoster: (playerId: string) => void;
  onUpdateRoster: (playerId: string, updates: Partial<RosterPlayer>) => void;
};

export function RosterPanel({
  ui,
  editing,
  onToggleEdit,
  roster,
  onAddToRoster,
  onRemoveFromRoster,
  onUpdateRoster,
}: Props) {
  const positions = positionOptions(ui);
  return (
    <section className="library-panel" aria-label={ui.rosterLabel}>
      <div className="library-panel-header">
        <div>
          <p className="section-label">{ui.rosterLabel}</p>
          <p className="groups-caption">{ui.rosterHint}</p>
        </div>
        <button type="button" className="btn" onClick={onToggleEdit}>
          {editing ? ui.done : ui.edit}
        </button>
      </div>

      {editing && (
        <form
          className="library-add-form roster-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const ru = String(new FormData(form).get("ru") || "").trim();
            const en = String(new FormData(form).get("en") || "").trim();
            const number = String(new FormData(form).get("number") || "").trim();
            const position = String(new FormData(form).get("position") || "").trim();
            if (!ru && !en) return;
            onAddToRoster(ru, en, number, position);
            form.reset();
          }}
        >
          <input
            name="number"
            className="input-number"
            placeholder="#"
            aria-label={ui.numberLabel}
          />
          <select
            name="position"
            className="input-position"
            aria-label={ui.positionLabel}
            defaultValue=""
          >
            {positions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            name="ru"
            placeholder={ui.nameRuPlaceholder}
            aria-label={ui.nameRuPlaceholder}
          />
          <input
            name="en"
            placeholder={ui.nameEnPlaceholder}
            aria-label={ui.nameEnPlaceholder}
          />
          <button type="submit" className="btn btn-primary">
            {ui.addToRoster}
          </button>
        </form>
      )}

      <ul className="library-list roster-list">
        {[...roster]
          .filter((player) => editing || player.active !== false)
          .sort((a, b) => {
            const aActive = a.active !== false;
            const bActive = b.active !== false;
            if (aActive !== bActive) return aActive ? -1 : 1;
            return comparePlayersByNumber(a, b);
          })
          .map((player) => (
            <li key={player.id}>
              {editing ? (
                <div className="roster-edit-row">
                  <label className="input-active-label" title={ui.active}>
                    <input
                      type="checkbox"
                      className="input-active"
                      checked={player.active !== false}
                      aria-label={ui.active}
                      onChange={(e) =>
                        onUpdateRoster(player.id, { active: e.target.checked })
                      }
                    />
                  </label>
                  <label className="input-active-label" title={ui.injured}>
                    <input
                      type="checkbox"
                      className="input-injured"
                      checked={Boolean(player.injured)}
                      aria-label={ui.injured}
                      onChange={(e) =>
                        onUpdateRoster(player.id, { injured: e.target.checked })
                      }
                    />
                    <InjuryMark title={ui.injured} />
                  </label>
                  <input
                    className="input-number"
                    value={player.number}
                    placeholder="#"
                    aria-label={ui.numberLabel}
                    onChange={(e) =>
                      onUpdateRoster(player.id, { number: e.target.value })
                    }
                  />
                  <select
                    className="input-position"
                    value={player.position}
                    aria-label={ui.positionLabel}
                    onChange={(e) =>
                      onUpdateRoster(player.id, { position: e.target.value })
                    }
                  >
                    {positions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={player.ru}
                    placeholder={ui.nameRuPlaceholder}
                    aria-label={ui.nameRuPlaceholder}
                    onChange={(e) =>
                      onUpdateRoster(player.id, { ru: e.target.value })
                    }
                    onBlur={(e) =>
                      onUpdateRoster(player.id, { ru: e.target.value.trim() })
                    }
                  />
                  <input
                    value={player.en}
                    placeholder={ui.nameEnPlaceholder}
                    aria-label={ui.nameEnPlaceholder}
                    onChange={(e) =>
                      onUpdateRoster(player.id, { en: e.target.value })
                    }
                    onBlur={(e) =>
                      onUpdateRoster(player.id, { en: e.target.value.trim() })
                    }
                  />
                  <button
                    type="button"
                    className="row-btn"
                    title={ui.remove}
                    aria-label={ui.remove}
                    onClick={() => {
                      if (confirm(ui.confirmRemoveRoster))
                        onRemoveFromRoster(player.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <span>
                  {player.ru || player.en ? (
                    <PlayerName player={player} injuredLabel={ui.injured} />
                  ) : (
                    "—"
                  )}
                </span>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}
