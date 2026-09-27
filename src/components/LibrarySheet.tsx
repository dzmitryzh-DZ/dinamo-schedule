import { useState, type ReactNode, type RefObject } from "react";
import type { UiStrings } from "../i18n/ui";
import type {
  ActivityItem,
  DayTemplate,
  Lang,
  RosterPlayer,
  SplitItem,
  TeamItem,
} from "../data/types";
import { RowColorPicker } from "./RowColorPicker";
import { LibraryListPanel, type BilingualItem } from "./library/LibraryListPanel";
import { TeamsPanel } from "./library/TeamsPanel";
import { TemplatesPanel } from "./library/TemplatesPanel";
import { RosterPanel } from "./library/RosterPanel";

type PanelKey = "activities" | "splits" | "teams" | "templates" | "roster";

type Props = {
  ui: UiStrings;
  lang: Lang;
  activities: ActivityItem[];
  splits: SplitItem[];
  teams: TeamItem[];
  templates: DayTemplate[];
  roster: RosterPlayer[];
  sheetRef: RefObject<HTMLElement | null>;
  onAddActivity: (ru: string, en: string, group?: string) => void;
  onUpdateActivity: (id: string, updates: Partial<ActivityItem>) => void;
  onRemoveActivity: (id: string) => void;
  onAddSplit: (ru: string, en: string) => void;
  onUpdateSplit: (id: string, updates: Partial<SplitItem>) => void;
  onRemoveSplit: (id: string) => void;
  onAddTeam: (abbr: string, ru: string, en: string) => void;
  onUpdateTeam: (id: string, updates: Partial<TeamItem>) => void;
  onRemoveTeam: (id: string) => void;
  onUpdateTemplate: (id: string, updates: Partial<DayTemplate>) => void;
  onRemoveTemplate: (id: string) => void;
  onAddToRoster: (
    ru: string,
    en: string,
    number: string,
    position: string
  ) => void;
  onRemoveFromRoster: (playerId: string) => void;
  onUpdateRoster: (playerId: string, updates: Partial<RosterPlayer>) => void;
  onReset: () => void;
};

export function LibrarySheet({
  ui,
  lang,
  activities,
  splits,
  teams,
  templates,
  roster,
  sheetRef,
  onAddActivity,
  onUpdateActivity,
  onRemoveActivity,
  onAddSplit,
  onUpdateSplit,
  onRemoveSplit,
  onAddTeam,
  onUpdateTeam,
  onRemoveTeam,
  onUpdateTemplate,
  onRemoveTemplate,
  onAddToRoster,
  onRemoveFromRoster,
  onUpdateRoster,
  onReset,
}: Props) {
  const [editingPanels, setEditingPanels] = useState<
    Record<PanelKey, boolean>
  >({
    activities: false,
    splits: false,
    teams: false,
    templates: false,
    roster: false,
  });

  function togglePanel(panel: PanelKey) {
    setEditingPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  }

  /** Shared color swatch editor/viewer for the bilingual library panels. */
  function colorRenders<T extends BilingualItem & { color?: string }>(
    onUpdate: (id: string, updates: Partial<T>) => void
  ) {
    return {
      renderExtraEdit: (item: BilingualItem) => (
        <RowColorPicker
          lang={lang}
          title={ui.color}
          value={(item as T).color}
          onChange={(color) => onUpdate(item.id, { color } as Partial<T>)}
        />
      ),
      renderExtraView: (item: BilingualItem): ReactNode =>
        (item as T).color ? (
          <span
            className={`row-color-dot row-color-dot-${(item as T).color} is-swatch`}
            aria-hidden="true"
          />
        ) : null,
    };
  }

  const activityRenders = colorRenders<ActivityItem>(onUpdateActivity);
  const splitRenders = colorRenders<SplitItem>(onUpdateSplit);

  return (
    <article className="sheet sheet-library" ref={sheetRef}>
      <header className="library-header">
        <div className="library-heading">
          <h2>{ui.tabLibrary}</h2>
        </div>
      </header>
      <div className="content library-content">
        <LibraryListPanel
          ui={ui}
          lang={lang}
          editing={editingPanels.activities}
          onToggleEdit={() => togglePanel("activities")}
          label={ui.activityLibrary}
          hint={ui.activityLibraryHint}
          addLabel={ui.addActivity}
          confirmRemove={ui.confirmRemoveActivity}
          items={activities}
          grouped
          groupPlaceholder={ui.activityGroup}
          onAdd={onAddActivity}
          onUpdate={(id, updates) => onUpdateActivity(id, updates)}
          onRemove={onRemoveActivity}
          renderExtraEdit={activityRenders.renderExtraEdit}
          renderExtraView={activityRenders.renderExtraView}
        />
        <TeamsPanel
          ui={ui}
          lang={lang}
          editing={editingPanels.teams}
          onToggleEdit={() => togglePanel("teams")}
          teams={teams}
          onAdd={onAddTeam}
          onUpdate={onUpdateTeam}
          onRemove={onRemoveTeam}
        />
        <LibraryListPanel
          ui={ui}
          lang={lang}
          editing={editingPanels.splits}
          onToggleEdit={() => togglePanel("splits")}
          label={ui.splitLibrary}
          hint={ui.splitLibraryHint}
          addLabel={ui.addSplit}
          confirmRemove={ui.confirmRemoveSplit}
          items={splits}
          onAdd={onAddSplit}
          onUpdate={(id, updates) => onUpdateSplit(id, updates)}
          onRemove={onRemoveSplit}
          renderExtraEdit={splitRenders.renderExtraEdit}
          renderExtraView={splitRenders.renderExtraView}
        />
        <TemplatesPanel
          ui={ui}
          lang={lang}
          editing={editingPanels.templates}
          onToggleEdit={() => togglePanel("templates")}
          templates={templates}
          onUpdateTemplate={onUpdateTemplate}
          onRemoveTemplate={onRemoveTemplate}
        />
        <RosterPanel
          ui={ui}
          editing={editingPanels.roster}
          onToggleEdit={() => togglePanel("roster")}
          roster={roster}
          onAddToRoster={onAddToRoster}
          onRemoveFromRoster={onRemoveFromRoster}
          onUpdateRoster={onUpdateRoster}
        />
        <section className="library-panel library-reset-panel" aria-label={ui.reset}>
          <div className="library-panel-header">
            <div>
              <p className="section-label">{ui.reset}</p>
              <p className="groups-caption">{ui.confirmReset}</p>
            </div>
            <button type="button" className="btn btn-danger" onClick={onReset}>
              {ui.reset}
            </button>
          </div>
        </section>
      </div>
    </article>
  );
}
