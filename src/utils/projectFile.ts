import { normalizeData, SCHEMA_VERSION } from "../data/storage";
import type { ScheduleStore } from "../data/types";

export type ProjectMeta = {
  /** Server-assigned revision (monotonic). */
  rev?: number;
  /** Server-assigned save timestamp (ISO). */
  savedAt?: string;
  /** Last revision known to the client when this snapshot was produced. */
  baseRev?: number;
};

export type ProjectFile = {
  version: number;
  exportedAt: string;
  meta: ProjectMeta;
  data: ScheduleStore;
};

export type ParsedProject = {
  store: ScheduleStore;
  /** Server revision from meta.rev, when present. */
  rev: number | null;
  /** Server save timestamp from meta.savedAt (epoch ms), when present. */
  savedAt: number | null;
  /** True when the file was written by a newer schema than we understand. */
  unsupported: boolean;
};

/** Local export marker kept inside meta for downloaded files (not used by the server). */
export const PROJECT_FILE_VERSION = SCHEMA_VERSION;

export function buildProjectFilename(date = ""): string {
  const stamp = String(date || "")
    .trim()
    .replaceAll(".", "-")
    .replace(/[^\d-]/g, "");
  const fallback = new Date().toISOString().slice(0, 10);
  return `${stamp || fallback}-dinamo-schedule.json`;
}

/** Compact JSON (no pretty-printing) with meta.baseRev for optimistic writes. */
export function serializeProject(
  store: ScheduleStore,
  options?: { baseRev?: number | null; exportedAt?: string }
): string {
  const meta: ProjectMeta = {
    ...(options?.baseRev != null ? { baseRev: options.baseRev } : {}),
  };
  const payload: ProjectFile = {
    version: PROJECT_FILE_VERSION,
    exportedAt: options?.exportedAt ?? new Date().toISOString(),
    meta,
    data: store,
  };
  return JSON.stringify(payload);
}

export function downloadProjectFile(store: ScheduleStore, date = ""): void {
  const blob = new Blob([serializeProject(store, { exportedAt: new Date().toISOString() })], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildProjectFilename(date);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parse an API/downloaded project payload.
 * Never returns a store as safe-to-overwrite when the file version is newer
 * than SCHEMA_VERSION: `unsupported: true` means the caller must not push.
 */
export function parseProjectFile(raw: string): ParsedProject {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid project file");
  }

  const root = parsed as Record<string, unknown>;
  const version =
    typeof root.version === "number" && Number.isFinite(root.version)
      ? root.version
      : SCHEMA_VERSION;
  const unsupported = version > SCHEMA_VERSION;

  const metaRaw = root.meta && typeof root.meta === "object" && !Array.isArray(root.meta)
    ? (root.meta as Record<string, unknown>)
    : null;
  const rev =
    typeof metaRaw?.rev === "number" && Number.isFinite(metaRaw.rev)
      ? metaRaw.rev
      : null;
  const savedAtRaw =
    typeof metaRaw?.savedAt === "string"
      ? metaRaw.savedAt
      : typeof root.exportedAt === "string"
        ? root.exportedAt
        : null;
  const savedAtMs = savedAtRaw ? Date.parse(savedAtRaw) : NaN;
  const savedAt = Number.isFinite(savedAtMs) ? savedAtMs : null;

  const payload =
    root.data && typeof root.data === "object"
      ? root.data
      : Array.isArray(root.days)
        ? root
        : null;

  if (!payload) throw new Error("Invalid project file");

  // For unsupported (newer) files still normalize for *display*, but flag it
  // so callers never persist this store back over the server version.
  return { store: normalizeData(payload), rev, savedAt, unsupported };
}

export function readProjectFile(file: File): Promise<ScheduleStore> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseProjectFile(String(reader.result || ""));
        if (parsed.unsupported) {
          reject(new Error("unsupported-version"));
          return;
        }
        resolve(parsed.store);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsText(file, "utf-8");
  });
}
