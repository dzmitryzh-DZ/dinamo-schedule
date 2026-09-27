import type { UiStrings } from "../../i18n/ui";
import type { DayTemplate, Lang } from "../../data/types";
import { bilingualPair } from "../../utils/localize";

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  onToggleEdit: () => void;
  templates: DayTemplate[];
  onUpdateTemplate: (id: string, updates: Partial<DayTemplate>) => void;
  onRemoveTemplate: (id: string) => void;
};

export function TemplatesPanel({
  ui,
  lang,
  editing,
  onToggleEdit,
  templates,
  onUpdateTemplate,
  onRemoveTemplate,
}: Props) {
  return (
    <section className="library-panel" aria-label={ui.templatesLibrary}>
      <div className="library-panel-header">
        <div>
          <p className="section-label">{ui.templatesLibrary}</p>
          <p className="groups-caption">{ui.templatesLibraryHint}</p>
        </div>
        <button type="button" className="btn" onClick={onToggleEdit} disabled={!templates.length}>
          {editing ? ui.done : ui.edit}
        </button>
      </div>

      {!templates.length ? (
        <p className="groups-caption">{ui.noTemplates}</p>
      ) : (
        <ul className="library-list">
          {templates.map((tpl) => {
            const pair = bilingualPair(tpl.nameRu, tpl.nameEn);
            return (
            <li key={tpl.id}>
              {editing ? (
                <div className="activity-edit-row">
                  <input
                    value={tpl.nameRu}
                    placeholder="RU"
                    aria-label="RU"
                    onChange={(e) =>
                      onUpdateTemplate(tpl.id, { nameRu: e.target.value })
                    }
                  />
                  <input
                    value={tpl.nameEn}
                    placeholder="EN"
                    aria-label="EN"
                    onChange={(e) =>
                      onUpdateTemplate(tpl.id, { nameEn: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="row-btn"
                    title={ui.remove}
                    aria-label={ui.remove}
                    onClick={() => {
                      if (confirm(ui.confirmRemoveTemplate))
                        onRemoveTemplate(tpl.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <span className="library-item-name">
                    {lang === "ru"
                      ? tpl.nameRu || tpl.nameEn
                      : tpl.nameEn || tpl.nameRu}
                  </span>
                  <span className="library-item-lang">
                    {ui.templateRows.replace("{n}", String(tpl.schedule.length))}
                    {pair ? ` · ${pair}` : null}
                  </span>
                </>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
