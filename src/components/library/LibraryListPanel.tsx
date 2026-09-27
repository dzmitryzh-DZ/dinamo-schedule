import { useId, type ReactNode } from "react";
import type { UiStrings } from "../../i18n/ui";
import type { Lang } from "../../data/types";
import { bilingualPair } from "../../utils/localize";

export type BilingualItem = { id: string; ru: string; en: string; group?: string };

type Props = {
  ui: UiStrings;
  lang: Lang;
  editing: boolean;
  onToggleEdit: () => void;
  label: string;
  hint: string;
  addLabel: string;
  confirmRemove: string;
  items: BilingualItem[];
  /** Show items grouped by their optional `group` field and edit it. */
  grouped?: boolean;
  groupPlaceholder?: string;
  onAdd: (ru: string, en: string, group?: string) => void;
  onUpdate: (
    id: string,
    updates: { ru?: string; en?: string; group?: string }
  ) => void;
  onRemove: (id: string) => void;
  renderExtraEdit?: (item: BilingualItem) => ReactNode;
  renderExtraView?: (item: BilingualItem) => ReactNode;
};

export function LibraryListPanel({
  ui,
  lang,
  editing,
  onToggleEdit,
  label,
  hint,
  addLabel,
  confirmRemove,
  items,
  grouped = false,
  groupPlaceholder,
  onAdd,
  onUpdate,
  onRemove,
  renderExtraEdit,
  renderExtraView,
}: Props) {
  const groupListId = useId();
  const groupNames = grouped
    ? Array.from(
        new Set(
          items
            .map((item) => item.group?.trim())
            .filter((name): name is string => Boolean(name))
        )
      )
    : [];

  function renderViewItem(item: BilingualItem) {
    return (
      <li key={item.id}>
        <span className="library-item-name">
          {renderExtraView?.(item)}
          {lang === "ru" ? item.ru || item.en : item.en || item.ru}
        </span>
        <span className="library-item-lang">{bilingualPair(item.ru, item.en)}</span>
      </li>
    );
  }

  function renderViewList(list: BilingualItem[]) {
    if (!list.length) return null;
    return <ul className="library-list">{list.map(renderViewItem)}</ul>;
  }

  return (
    <section className="library-panel" aria-label={label}>
      <div className="library-panel-header">
        <div>
          <p className="section-label">{label}</p>
          <p className="groups-caption">{hint}</p>
        </div>
        <button type="button" className="btn" onClick={onToggleEdit}>
          {editing ? ui.done : ui.edit}
        </button>
      </div>

      {grouped && (
        <datalist id={groupListId}>
          {groupNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}

      {editing && (
        <form
          className={["library-add-form", grouped ? "has-group" : ""]
            .filter(Boolean)
            .join(" ")}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const ru = String(data.get("ru") || "").trim();
            const en = String(data.get("en") || "").trim();
            const group = String(data.get("group") || "").trim();
            if (!ru && !en) return;
            onAdd(ru, en, group);
            form.reset();
          }}
        >
          <input name="ru" placeholder="RU" aria-label="RU" />
          <input name="en" placeholder="EN" aria-label="EN" />
          {grouped && (
            <input
              name="group"
              list={groupListId}
              placeholder={groupPlaceholder}
              aria-label={groupPlaceholder}
            />
          )}
          <button type="submit" className="btn btn-primary">
            {addLabel}
          </button>
        </form>
      )}

      {editing ? (
        <ul className="library-list">
          {items.map((item) => (
            <li key={item.id}>
              <div
                className={["activity-edit-row", grouped ? "has-group" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <input
                  value={item.ru}
                  placeholder="RU"
                  aria-label="RU"
                  onChange={(e) => onUpdate(item.id, { ru: e.target.value })}
                />
                <input
                  value={item.en}
                  placeholder="EN"
                  aria-label="EN"
                  onChange={(e) => onUpdate(item.id, { en: e.target.value })}
                />
                {grouped && (
                  <input
                    className="activity-group-input"
                    value={item.group ?? ""}
                    list={groupListId}
                    placeholder={groupPlaceholder}
                    aria-label={groupPlaceholder}
                    onChange={(e) => onUpdate(item.id, { group: e.target.value })}
                  />
                )}
                {renderExtraEdit?.(item)}
                <button
                  type="button"
                  className="row-btn"
                  title={ui.remove}
                  aria-label={ui.remove}
                  onClick={() => {
                    if (confirm(confirmRemove)) onRemove(item.id);
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : grouped ? (
        <>
          {renderViewList(items.filter((item) => !item.group?.trim()))}
          {groupNames.map((name) => (
            <section key={name} className="library-group" aria-label={name}>
              <p className="section-label library-group-label">{name}</p>
              {renderViewList(
                items.filter((item) => item.group?.trim() === name)
              )}
            </section>
          ))}
        </>
      ) : (
        renderViewList(items)
      )}
    </section>
  );
}
