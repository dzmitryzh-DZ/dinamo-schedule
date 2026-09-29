import { useEffect, useRef, useState } from "react";
import type { UiStrings } from "../i18n/ui";
import type { AppView } from "../data/types";
import type { ExportKind } from "../utils/exportDocument";
import { ChevronDownIcon, DownloadIcon } from "./icons";

type Props = {
  ui: UiStrings;
  view: AppView;
  /** В составах групп есть игроки — можно сохранить и их. */
  hasGroups: boolean;
  busy: boolean;
  onExport: (kind: ExportKind) => void;
};

type Item = { kind: ExportKind; label: string };

/** Кнопка «Сохранить» с меню: PDF и PNG для расписания дня и плана месяца. */
export function ExportMenu({ ui, view, hasGroups, busy, onExport }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (view === "library") return null;

  const items: Item[] =
    view === "month"
      ? [
          { kind: "month-pdf", label: ui.exportPdfMonth },
          { kind: "month-png", label: ui.exportPngMonth },
        ]
      : [
          { kind: "day-pdf", label: ui.exportPdfDay },
          ...(hasGroups
            ? [{ kind: "day-pdf-groups" as const, label: ui.exportPdfDayGroups }]
            : []),
          { kind: "day-png", label: ui.exportPngDay },
          ...(hasGroups
            ? [{ kind: "groups-png" as const, label: ui.exportPngGroups }]
            : []),
        ];

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-primary btn-icon-text export-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        title={busy ? ui.exportBusy : ui.exportMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <DownloadIcon />
        <span className="btn-label">{busy ? ui.exportBusy : ui.exportMenu}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="export-menu-panel" role="menu">
          {items.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="menuitem"
              className="export-menu-item"
              onClick={() => {
                setOpen(false);
                onExport(item.kind);
              }}
            >
              <span className="export-menu-format">{item.label.slice(0, 3)}</span>
              {item.label.replace(/^(PDF|PNG) — /, "")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
