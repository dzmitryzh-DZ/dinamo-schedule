import type { UiStrings } from "../../i18n/ui";
import type { Lang, TeamItem } from "../../data/types";
import { sortTeams, teamLabel } from "../../data/teams";
import { resizeImageToDataUrl } from "../../utils/image";
import { bilingualPair } from "../../utils/localize";
import { TeamLogo } from "../TeamLogo";

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  onToggleEdit: () => void;
  teams: TeamItem[];
  onAdd: (abbr: string, ru: string, en: string) => void;
  onUpdate: (id: string, updates: Partial<TeamItem>) => void;
  onRemove: (id: string) => void;
};

export function TeamsPanel({
  ui,
  lang,
  editing,
  onToggleEdit,
  teams,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const sorted = sortTeams(teams);

  async function handleLogo(id: string, file: File | undefined) {
    if (!file) return;
    try {
      const logo = await resizeImageToDataUrl(file);
      onUpdate(id, { logo });
    } catch {
      /* ignore unreadable files */
    }
  }

  return (
    <section className="library-panel" aria-label={ui.teamLibrary}>
      <div className="library-panel-header">
        <div>
          <p className="section-label">{ui.teamLibrary}</p>
          <p className="groups-caption">{ui.teamLibraryHint}</p>
        </div>
        <button type="button" className="btn" onClick={onToggleEdit}>
          {editing ? ui.done : ui.edit}
        </button>
      </div>

      {editing && (
        <form
          className="library-add-form team-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const abbr = String(data.get("abbr") || "").trim().slice(0, 3).toUpperCase();
            const ru = String(data.get("ru") || "").trim();
            const en = String(data.get("en") || "").trim();
            if (!abbr && !ru && !en) return;
            onAdd(abbr || (ru || en).slice(0, 3), ru, en);
            form.reset();
          }}
        >
          <input
            name="abbr"
            placeholder={ui.teamAbbr}
            aria-label={ui.teamAbbr}
            maxLength={3}
          />
          <input name="ru" placeholder="RU" aria-label="RU" />
          <input name="en" placeholder="EN" aria-label="EN" />
          <button type="submit" className="btn btn-primary">
            {ui.addTeam}
          </button>
        </form>
      )}

      <ul className="library-list">
        {sorted.map((team) => (
          <li key={team.id}>
            {editing ? (
              <div className="team-edit-row">
                <TeamLogo team={team} />
                <input
                  value={team.abbr}
                  maxLength={3}
                  placeholder={ui.teamAbbr}
                  aria-label={ui.teamAbbr}
                  onChange={(e) => onUpdate(team.id, { abbr: e.target.value })}
                />
                <input
                  value={team.ru}
                  placeholder="RU"
                  aria-label="RU"
                  onChange={(e) => onUpdate(team.id, { ru: e.target.value })}
                />
                <input
                  value={team.en}
                  placeholder="EN"
                  aria-label="EN"
                  onChange={(e) => onUpdate(team.id, { en: e.target.value })}
                />
                <input
                  type="color"
                  className="team-color-input"
                  value={team.color}
                  aria-label={ui.teamLogo}
                  onChange={(e) => onUpdate(team.id, { color: e.target.value })}
                />
                <label className="team-logo-upload">
                  {ui.uploadLogo}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void handleLogo(team.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {team.logo ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onUpdate(team.id, { logo: "" })}
                  >
                    {ui.clearLogo}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="row-btn"
                  title={ui.remove}
                  aria-label={ui.remove}
                  onClick={() => {
                    if (confirm(ui.confirmRemoveTeam)) onRemove(team.id);
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <span className="library-item-name">
                  <TeamLogo team={team} />
                  <span className="team-abbr-chip">{team.abbr}</span>
                  {teamLabel(team, lang)}
                </span>
                <span className="library-item-lang">{bilingualPair(team.ru, team.en)}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
