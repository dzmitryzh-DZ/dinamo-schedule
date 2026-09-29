import type { UiStrings } from "../i18n/ui";

type Props = {
  ui: UiStrings;
  busy?: boolean;
  onResolve: (choice: "local" | "shared") => void;
  onClose: () => void;
};

/**
 * Конфликт версий: файл на Диске изменился, пока пользователь редактировал
 * локально. Даёт явный выбор вместо молчаливой подмены данных.
 */
export function ConflictDialog({ ui, busy = false, onResolve, onClose }: Props) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog-conflict"
        role="alertdialog"
        aria-label={ui.conflictTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 className="dialog-title">{ui.conflictTitle}</h2>
        </div>
        <div className="dialog-section">
          <p className="dialog-message">{ui.conflictText}</p>
          <div className="dialog-actions dialog-actions-column">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => onResolve("local")}
            >
              {ui.conflictLocal}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => onResolve("shared")}
            >
              {ui.conflictShared}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
