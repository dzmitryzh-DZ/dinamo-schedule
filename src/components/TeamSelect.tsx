import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang, TeamItem } from "../data/types";
import { sortTeams, teamLabel } from "../data/teams";
import { TeamLogo } from "./TeamLogo";

type Props = {
  teams: TeamItem[];
  lang: Lang;
  teamId: string;
  customAbbr: string;
  placeholder: string;
  customLabel: string;
  abbrHint: string;
  onSelectTeam: (team: TeamItem | null) => void;
  onCustomAbbr: (abbr: string) => void;
};

export function TeamSelect({
  teams,
  lang,
  teamId,
  customAbbr,
  placeholder,
  customLabel,
  abbrHint,
  onSelectTeam,
  onCustomAbbr,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = teams.find((team) => team.id === teamId);
  const sorted = useMemo(() => sortTeams(teams), [teams]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((team) => {
      const hay = `${team.abbr} ${team.ru} ${team.en}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, sorted]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const displayAbbr = selected?.abbr || customAbbr;

  return (
    <div className="team-select" ref={rootRef}>
      <button
        type="button"
        className="team-select-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        {displayAbbr ? (
          <TeamLogo team={selected} abbr={displayAbbr} />
        ) : null}
        <span className="team-select-label">
          {selected
            ? `${selected.abbr} · ${teamLabel(selected, lang)}`
            : displayAbbr
              ? displayAbbr
              : placeholder}
        </span>
        <span className="team-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="team-select-menu">
          <input
            type="search"
            className="team-select-search"
            value={query}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="team-select-list" role="listbox">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!teamId}
                className={`team-select-option${!teamId ? " is-selected" : ""}`}
                onClick={() => {
                  onSelectTeam(null);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {placeholder}
              </button>
            </li>
            {filtered.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={team.id === teamId}
                  className={`team-select-option${
                    team.id === teamId ? " is-selected" : ""
                  }`}
                  onClick={() => {
                    onSelectTeam(team);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <TeamLogo team={team} />
                  <span className="team-select-abbr">{team.abbr}</span>
                  <span className="team-select-name">{teamLabel(team, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="team-select-custom">
            <label className="team-select-custom-label">
              {customLabel}
              <input
                type="text"
                className="month-match-input"
                value={customAbbr}
                maxLength={3}
                placeholder={abbrHint}
                aria-label={customLabel}
                onChange={(e) => onCustomAbbr(e.target.value.toUpperCase())}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
